<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CRM Analytics Reports — provider-scoped, read-only.
 *
 * Yetki kuralı:
 *   - doctor              → kendi randevuları (doctor_id = user->id)
 *   - clinicOwner/hospital→ kliniğinin randevuları (clinic_id = user->clinic_id)
 *   - superAdmin/saasAdmin→ tüm veri (admin gözetim)
 *
 * Gerçek kolonlar kullanılır; olmayan veri boş döner (uydurma yok).
 */
class ReportController extends Controller
{
    /**
     * Driver-aware DATE() ifadesi — gün bazlı gruplama için.
     * MySQL/TiDB: DATE(col), sqlite: date(col), pgsql: DATE(col)
     */
    private function dateExpr(string $column): string
    {
        // Hem MySQL/TiDB hem sqlite hem pgsql DATE()/date() destekler;
        // güvenli olması için driver guard tutuyoruz.
        $driver = DB::connection()->getDriverName();
        return $driver === 'sqlite' ? "date($column)" : "DATE($column)";
    }

    /**
     * Authenticated provider için Appointment sorgusunu skoplar.
     * Başka sağlayıcının verisi sızmaz.
     */
    private function scopeAppointments(User $user)
    {
        $query = Appointment::query();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner() || $user->isHospital()) {
            // clinic_id yoksa hiçbir şey dönmesin (veri sızıntısı önlemi)
            $query->where('clinic_id', $user->clinic_id ?? '__none__');
        }
        // superAdmin/saasAdmin → skop yok (tüm veri)

        return $query;
    }

    /**
     * PatientRecord sorgusunu provider'a skoplar.
     */
    private function scopeRecords(User $user)
    {
        $query = PatientRecord::query();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner() || $user->isHospital()) {
            $query->where('clinic_id', $user->clinic_id ?? '__none__');
        }

        return $query;
    }

    /**
     * GET /api/crm/reports/appointments
     * Durum dağılımı + son 30 gün zaman serisi + no-show oranı.
     */
    public function appointments(Request $request)
    {
        $user = $request->user();

        // ── Durum dağılımı ──
        $statusRows = (clone $this->scopeAppointments($user))
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
        $statusDistribution = [];
        foreach ($statuses as $s) {
            $statusDistribution[] = [
                'status' => $s,
                'count'  => (int) ($statusRows[$s] ?? 0),
            ];
        }

        $total       = array_sum(array_column($statusDistribution, 'count'));
        $noShowCount = (int) ($statusRows['no_show'] ?? 0);
        $noShowRate  = $total > 0 ? round(($noShowCount / $total) * 100, 1) : 0;

        // ── Son 30 gün zaman serisi (appointment_date bazlı) ──
        $dateExpr = $this->dateExpr('appointment_date');
        $since    = now()->subDays(29)->startOfDay()->toDateString();

        $seriesRows = (clone $this->scopeAppointments($user))
            ->where('appointment_date', '>=', $since)
            ->select(DB::raw("$dateExpr as day"), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw($dateExpr))
            ->orderBy('day')
            ->pluck('count', 'day');

        // 30 günlük tam seri (boş günler 0)
        $timeseries = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = now()->subDays($i)->toDateString();
            $timeseries[] = [
                'date'  => $d,
                'count' => (int) ($seriesRows[$d] ?? 0),
            ];
        }

        return response()->json([
            'status_distribution' => $statusDistribution,
            'total'               => $total,
            'no_show_count'       => $noShowCount,
            'no_show_rate'        => $noShowRate,
            'timeseries'          => $timeseries,
        ]);
    }

    /**
     * GET /api/crm/reports/patients
     * Toplam hasta + bu ay yeni hasta + (varsa) şehir dağılımı.
     * Hasta = bu provider ile randevusu olan role_id='patient' kullanıcılar.
     */
    public function patients(Request $request)
    {
        $user = $request->user();

        // Bu provider ile ilişkili (en az 1 randevu) hasta id'leri
        $patientIds = (clone $this->scopeAppointments($user))
            ->whereNotNull('patient_id')
            ->distinct()
            ->pluck('patient_id');

        $totalPatients = $patientIds->count();

        // Bu ay yeni hasta (kayıt tarihi bu ay olan, ilişkili hastalar)
        $newThisMonth = 0;
        $cityDistribution = [];

        if ($totalPatients > 0) {
            $newThisMonth = User::whereIn('id', $patientIds)
                ->where('role_id', 'patient')
                ->where('created_at', '>=', now()->startOfMonth())
                ->count();

            // Şehir dağılımı (city_id var; isim için cities tablosuna join denenir, yoksa atla)
            $cityDistribution = User::whereIn('id', $patientIds)
                ->where('role_id', 'patient')
                ->whereNotNull('city_id')
                ->select('city_id', DB::raw('COUNT(*) as count'))
                ->groupBy('city_id')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'city_id' => $r->city_id,
                    'count'   => (int) $r->count,
                ])
                ->toArray();
        }

        return response()->json([
            'total_patients'    => $totalPatients,
            'new_this_month'    => $newThisMonth,
            'city_distribution' => $cityDistribution,
        ]);
    }

    /**
     * GET /api/crm/reports/services
     * En çok hizmet/tedavi türü.
     * PatientRecord.record_type (muayene tipi) + Appointment.appointment_type birleşik.
     * NOT: patient_records'ta `treatment_type` kolonu YOK; gerçek kolonlar kullanılır.
     */
    public function services(Request $request)
    {
        $user = $request->user();

        // ── Randevu tipi dağılımı (inPerson/online/phone) ──
        $appointmentTypes = (clone $this->scopeAppointments($user))
            ->whereNotNull('appointment_type')
            ->select('appointment_type', DB::raw('COUNT(*) as count'))
            ->groupBy('appointment_type')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'label' => $r->appointment_type,
                'count' => (int) $r->count,
            ])
            ->toArray();

        // ── Kayıt tipi dağılımı (record_type — examination vb.) ──
        $recordTypes = (clone $this->scopeRecords($user))
            ->whereNotNull('record_type')
            ->select('record_type', DB::raw('COUNT(*) as count'))
            ->groupBy('record_type')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'label' => $r->record_type,
                'count' => (int) $r->count,
            ])
            ->toArray();

        return response()->json([
            'appointment_types' => $appointmentTypes,
            'record_types'      => $recordTypes,
        ]);
    }
}
