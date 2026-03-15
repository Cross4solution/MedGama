<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\DoctorReview;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ClinicManagerService
{
    private const PLATFORM_COMMISSION_RATE = 0.15;

    // ══════════════════════════════════════════════
    //  RESOLVE CLINIC ID (strict scoping)
    // ══════════════════════════════════════════════

    /**
     * Resolve the clinic ID for the current manager.
     * clinicOwner → ownedClinic or clinic_id
     * hospital   → all clinic IDs under hospital
     */
    public function resolveClinicId(User $user): ?string
    {
        if ($user->role_id === 'clinicOwner') {
            return $user->ownedClinic?->id ?? $user->clinic_id;
        }
        return null;
    }

    public function resolveClinicIds(User $user): array
    {
        if ($user->role_id === 'clinicOwner') {
            $id = $this->resolveClinicId($user);
            return $id ? [$id] : [];
        }
        if ($user->role_id === 'hospital') {
            return Clinic::where('hospital_id', $user->hospital_id)->pluck('id')->toArray();
        }
        return [];
    }

    /**
     * Assert manager has access to this clinic.
     */
    public function authorizeManager(User $user): void
    {
        if (in_array($user->role_id, ['superAdmin', 'saasAdmin'])) return;
        if (!in_array($user->role_id, ['clinicOwner', 'hospital'])) {
            abort(403, 'Only clinic owners or hospital managers can access this resource');
        }
        $ids = $this->resolveClinicIds($user);
        if (empty($ids)) {
            abort(403, 'No clinic associated with your account');
        }
    }

    // ══════════════════════════════════════════════
    //  DASHBOARD OVERVIEW
    // ══════════════════════════════════════════════

    public function overview(User $user): array
    {
        $clinicIds = $this->resolveClinicIds($user);

        // Doctor count
        $doctorCount = User::where('role_id', 'doctor')
            ->whereIn('clinic_id', $clinicIds)
            ->count();

        // Appointment stats
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $totalAppointments = Appointment::whereIn('clinic_id', $clinicIds)->count();
        $todayAppointments = Appointment::whereIn('clinic_id', $clinicIds)
            ->whereDate('appointment_date', $today)->count();
        $monthAppointments = Appointment::whereIn('clinic_id', $clinicIds)
            ->whereBetween('appointment_date', [$startOfMonth, $endOfMonth])->count();

        // Status breakdown
        $statusBreakdown = Appointment::whereIn('clinic_id', $clinicIds)
            ->whereBetween('appointment_date', [$startOfMonth, $endOfMonth])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Occupancy rate: completed / (completed + confirmed + no_show) for this month
        $completed = ($statusBreakdown['completed'] ?? 0);
        $confirmed = ($statusBreakdown['confirmed'] ?? 0);
        $noShow    = ($statusBreakdown['no_show'] ?? 0);
        $possible  = $completed + $confirmed + $noShow;
        $occupancyRate = $possible > 0 ? round(($completed / $possible) * 100, 1) : 0;

        // Revenue
        $totalRevenue = (float) Invoice::whereIn('clinic_id', $clinicIds)
            ->where('status', 'paid')->sum('grand_total');
        $monthRevenue = (float) Invoice::whereIn('clinic_id', $clinicIds)
            ->where('status', 'paid')
            ->whereDate('paid_at', '>=', $startOfMonth)
            ->whereDate('paid_at', '<=', $endOfMonth)
            ->sum('grand_total');
        $pendingAmount = (float) Invoice::whereIn('clinic_id', $clinicIds)
            ->whereIn('status', ['pending', 'partial'])
            ->sum(DB::raw('grand_total - paid_amount'));

        // Patient count (unique patients with appointments)
        $patientCount = Appointment::whereIn('clinic_id', $clinicIds)
            ->distinct('patient_id')->count('patient_id');

        // Weekly appointment trend (last 4 weeks)
        $weekStart = Carbon::now()->subWeeks(3)->startOfWeek();
        $weeklyTrend = Appointment::whereIn('clinic_id', $clinicIds)
            ->where('appointment_date', '>=', $weekStart)
            ->select(
                DB::raw("TO_CHAR(appointment_date, 'IYYY-IW') as week"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw("TO_CHAR(appointment_date, 'IYYY-IW')"))
            ->orderBy('week')
            ->get()
            ->toArray();

        // Clinic info
        $clinic = Clinic::with('owner:id,fullname,email')->find($clinicIds[0] ?? null);

        return [
            'clinic' => $clinic ? [
                'id'   => $clinic->id,
                'name' => $clinic->name ?? $clinic->fullname,
                'owner' => $clinic->owner?->fullname,
            ] : null,
            'doctor_count'        => $doctorCount,
            'patient_count'       => $patientCount,
            'total_appointments'  => $totalAppointments,
            'today_appointments'  => $todayAppointments,
            'month_appointments'  => $monthAppointments,
            'status_breakdown'    => $statusBreakdown,
            'occupancy_rate'      => $occupancyRate,
            'total_revenue'       => round($totalRevenue, 2),
            'month_revenue'       => round($monthRevenue, 2),
            'pending_amount'      => round($pendingAmount, 2),
            'weekly_trend'        => $weeklyTrend,
        ];
    }

    // ══════════════════════════════════════════════
    //  DOCTOR MANAGEMENT
    // ══════════════════════════════════════════════

    /**
     * List doctors belonging to the clinic(s).
     */
    public function doctors(User $user, array $filters = []): array
    {
        $clinicIds = $this->resolveClinicIds($user);

        $query = User::where('role_id', 'doctor')
            ->whereIn('clinic_id', $clinicIds)
            ->with(['doctorProfile', 'clinic:id,name,fullname']);

        if (!empty($filters['search'])) {
            $s = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($s) {
                $q->where('fullname', 'ilike', $s)->orWhere('email', 'ilike', $s);
            });
        }

        $doctors = $query->orderBy('fullname')
            ->paginate($filters['per_page'] ?? 15)
            ->toArray();

        // Enrich with stats
        $doctorIds = collect($doctors['data'])->pluck('id')->toArray();
        $appointmentStats = $this->doctorAppointmentStats($doctorIds);
        $revenueStats = $this->doctorRevenueStats($doctorIds);
        $reviewStats = $this->doctorReviewStats($doctorIds);

        foreach ($doctors['data'] as &$doc) {
            $doc['stats'] = [
                'appointments' => $appointmentStats[$doc['id']] ?? ['total' => 0, 'completed' => 0, 'month' => 0],
                'revenue'      => $revenueStats[$doc['id']] ?? ['total' => 0, 'month' => 0],
                'reviews'      => $reviewStats[$doc['id']] ?? ['count' => 0, 'avg_rating' => 0],
            ];
        }

        return $doctors;
    }

    /**
     * Get a single doctor's detailed performance.
     */
    public function doctorDetail(User $user, string $doctorId): array
    {
        $clinicIds = $this->resolveClinicIds($user);

        $doctor = User::where('role_id', 'doctor')
            ->whereIn('clinic_id', $clinicIds)
            ->with(['doctorProfile', 'clinic:id,name,fullname'])
            ->findOrFail($doctorId);

        $startOfMonth = Carbon::now()->startOfMonth();

        // Appointment stats
        $totalAppts = Appointment::where('doctor_id', $doctorId)->whereIn('clinic_id', $clinicIds)->count();
        $monthAppts = Appointment::where('doctor_id', $doctorId)->whereIn('clinic_id', $clinicIds)
            ->whereDate('appointment_date', '>=', $startOfMonth)->count();
        $completedAppts = Appointment::where('doctor_id', $doctorId)->whereIn('clinic_id', $clinicIds)
            ->where('status', 'completed')->count();

        // Revenue
        $totalRevenue = (float) Invoice::where('doctor_id', $doctorId)->whereIn('clinic_id', $clinicIds)
            ->where('status', 'paid')->sum('grand_total');
        $monthRevenue = (float) Invoice::where('doctor_id', $doctorId)->whereIn('clinic_id', $clinicIds)
            ->where('status', 'paid')->whereDate('paid_at', '>=', $startOfMonth)->sum('grand_total');

        // Reviews
        $reviews = DoctorReview::where('doctor_id', $doctorId)->visible()
            ->with('patient:id,fullname,avatar')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();
        $avgRating = DoctorReview::where('doctor_id', $doctorId)->visible()->avg('rating');
        $reviewCount = DoctorReview::where('doctor_id', $doctorId)->visible()->count();

        // Monthly revenue trend (last 6 months)
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $revenueTrend = Invoice::where('doctor_id', $doctorId)->whereIn('clinic_id', $clinicIds)
            ->where('status', 'paid')
            ->where('paid_at', '>=', $sixMonthsAgo)
            ->select(
                DB::raw("TO_CHAR(paid_at, 'YYYY-MM') as period"),
                DB::raw('SUM(grand_total) as revenue')
            )
            ->groupBy(DB::raw("TO_CHAR(paid_at, 'YYYY-MM')"))
            ->orderBy('period')
            ->get()
            ->toArray();

        return [
            'doctor' => $doctor->toArray(),
            'appointments' => [
                'total'     => $totalAppts,
                'month'     => $monthAppts,
                'completed' => $completedAppts,
            ],
            'revenue' => [
                'total' => round($totalRevenue, 2),
                'month' => round($monthRevenue, 2),
                'trend' => $revenueTrend,
            ],
            'reviews' => [
                'avg_rating'   => round((float) $avgRating, 1),
                'review_count' => $reviewCount,
                'recent'       => $reviews->toArray(),
            ],
        ];
    }

    /**
     * Add an existing doctor to the clinic (assign clinic_id).
     */
    public function addDoctor(User $manager, string $doctorId): User
    {
        $clinicId = $this->resolveClinicId($manager);
        $doctor = User::where('role_id', 'doctor')->findOrFail($doctorId);

        if ($doctor->clinic_id && $doctor->clinic_id !== $clinicId) {
            abort(422, 'This doctor is already assigned to another clinic');
        }

        $doctor->update(['clinic_id' => $clinicId]);
        return $doctor->fresh(['doctorProfile', 'clinic:id,name,fullname']);
    }

    /**
     * Remove a doctor from the clinic (unset clinic_id).
     */
    public function removeDoctor(User $manager, string $doctorId): void
    {
        $clinicIds = $this->resolveClinicIds($manager);
        $doctor = User::where('role_id', 'doctor')
            ->whereIn('clinic_id', $clinicIds)
            ->findOrFail($doctorId);

        $doctor->update(['clinic_id' => null]);
    }

    /**
     * Update a doctor's operating hours (via DoctorProfile).
     */
    public function updateDoctorHours(User $manager, string $doctorId, array $operatingHours): DoctorProfile
    {
        $clinicIds = $this->resolveClinicIds($manager);
        $doctor = User::where('role_id', 'doctor')
            ->whereIn('clinic_id', $clinicIds)
            ->findOrFail($doctorId);

        $profile = $doctor->doctorProfile ?? DoctorProfile::create(['user_id' => $doctor->id]);
        $profile->update(['operating_hours' => $operatingHours]);

        return $profile->fresh();
    }

    // ══════════════════════════════════════════════
    //  CLINIC FINANCIALS
    // ══════════════════════════════════════════════

    public function financials(User $user, array $filters = []): array
    {
        $clinicIds = $this->resolveClinicIds($user);
        $currency = $filters['currency'] ?? null;

        $baseQuery = Invoice::whereIn('clinic_id', $clinicIds)->whereNull('deleted_at');
        $paidQuery = (clone $baseQuery)->where('status', 'paid');

        if ($currency) {
            $baseQuery->where('currency', $currency);
            $paidQuery->where('currency', $currency);
        }

        $totalInvoices = (clone $baseQuery)->count();
        $grossRevenue  = (float) (clone $paidQuery)->sum('grand_total');
        $commission    = round($grossRevenue * self::PLATFORM_COMMISSION_RATE, 2);
        $netPayout     = round($grossRevenue - $commission, 2);

        $pendingData = (clone $baseQuery)->whereIn('status', ['pending', 'partial'])
            ->select(DB::raw('COUNT(*) as cnt'), DB::raw('SUM(grand_total - paid_amount) as total'))
            ->first();

        // Monthly breakdown (last 12 months)
        $monthStart = Carbon::now()->subMonths(11)->startOfMonth();
        $monthly = (clone $paidQuery)->where('paid_at', '>=', $monthStart)
            ->select(
                DB::raw("TO_CHAR(paid_at, 'YYYY-MM') as period"),
                DB::raw('SUM(grand_total) as gross'),
                DB::raw('COUNT(*) as invoice_count')
            )
            ->groupBy(DB::raw("TO_CHAR(paid_at, 'YYYY-MM')"))
            ->orderBy('period')
            ->get()
            ->map(function ($row) {
                $gross = round((float) $row->gross, 2);
                return [
                    'period'        => $row->period,
                    'gross'         => $gross,
                    'commission'    => round($gross * self::PLATFORM_COMMISSION_RATE, 2),
                    'net'           => round($gross * (1 - self::PLATFORM_COMMISSION_RATE), 2),
                    'invoice_count' => (int) $row->invoice_count,
                ];
            });

        // Revenue per doctor
        $doctorRevenue = Invoice::whereIn('invoices.clinic_id', $clinicIds)
            ->where('invoices.status', 'paid')
            ->whereNull('invoices.deleted_at')
            ->when($currency, fn($q, $c) => $q->where('invoices.currency', $c))
            ->join('users', 'invoices.doctor_id', '=', 'users.id')
            ->select(
                'invoices.doctor_id',
                'users.fullname',
                'users.avatar',
                DB::raw('SUM(invoices.grand_total) as total_revenue'),
                DB::raw('COUNT(*) as invoice_count')
            )
            ->groupBy('invoices.doctor_id', 'users.fullname', 'users.avatar')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(fn($r) => [
                'doctor_id'     => $r->doctor_id,
                'fullname'      => $r->fullname,
                'avatar'        => $r->avatar,
                'total_revenue' => round((float) $r->total_revenue, 2),
                'commission'    => round((float) $r->total_revenue * self::PLATFORM_COMMISSION_RATE, 2),
                'net'           => round((float) $r->total_revenue * (1 - self::PLATFORM_COMMISSION_RATE), 2),
                'invoice_count' => (int) $r->invoice_count,
            ]);

        return [
            'total_invoices'   => $totalInvoices,
            'gross_revenue'    => round($grossRevenue, 2),
            'commission_rate'  => self::PLATFORM_COMMISSION_RATE,
            'commission'       => $commission,
            'net_payout'       => $netPayout,
            'pending_count'    => (int) ($pendingData->cnt ?? 0),
            'pending_amount'   => round((float) ($pendingData->total ?? 0), 2),
            'monthly'          => $monthly->values()->toArray(),
            'doctor_revenue'   => $doctorRevenue->values()->toArray(),
        ];
    }

    // ══════════════════════════════════════════════
    //  HELPERS — batch stats
    // ══════════════════════════════════════════════

    private function doctorAppointmentStats(array $doctorIds): array
    {
        if (empty($doctorIds)) return [];

        $startOfMonth = Carbon::now()->startOfMonth();

        $rows = Appointment::whereIn('doctor_id', $doctorIds)
            ->select(
                'doctor_id',
                DB::raw('COUNT(*) as total'),
                DB::raw("COUNT(*) FILTER (WHERE status = 'completed') as completed"),
                DB::raw("COUNT(*) FILTER (WHERE appointment_date >= '{$startOfMonth->toDateString()}') as month")
            )
            ->groupBy('doctor_id')
            ->get();

        $result = [];
        foreach ($rows as $r) {
            $result[$r->doctor_id] = [
                'total'     => (int) $r->total,
                'completed' => (int) $r->completed,
                'month'     => (int) $r->month,
            ];
        }
        return $result;
    }

    private function doctorRevenueStats(array $doctorIds): array
    {
        if (empty($doctorIds)) return [];

        $startOfMonth = Carbon::now()->startOfMonth();

        $rows = Invoice::whereIn('doctor_id', $doctorIds)
            ->where('status', 'paid')
            ->select(
                'doctor_id',
                DB::raw('SUM(grand_total) as total'),
                DB::raw("SUM(CASE WHEN paid_at >= '{$startOfMonth->toDateString()}' THEN grand_total ELSE 0 END) as month")
            )
            ->groupBy('doctor_id')
            ->get();

        $result = [];
        foreach ($rows as $r) {
            $result[$r->doctor_id] = [
                'total' => round((float) $r->total, 2),
                'month' => round((float) $r->month, 2),
            ];
        }
        return $result;
    }

    private function doctorReviewStats(array $doctorIds): array
    {
        if (empty($doctorIds)) return [];

        $rows = DoctorReview::whereIn('doctor_id', $doctorIds)
            ->where('is_visible', true)
            ->select(
                'doctor_id',
                DB::raw('COUNT(*) as count'),
                DB::raw('AVG(rating) as avg_rating')
            )
            ->groupBy('doctor_id')
            ->get();

        $result = [];
        foreach ($rows as $r) {
            $result[$r->doctor_id] = [
                'count'      => (int) $r->count,
                'avg_rating' => round((float) $r->avg_rating, 1),
            ];
        }
        return $result;
    }
}
