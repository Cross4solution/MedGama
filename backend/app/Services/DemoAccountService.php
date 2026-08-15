<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Invoice;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Demo hesaplarını ve örnek verisini kurar.
 *
 * Amaç: CRM'i denemek için hiçbir hazırlık gerekmesin — bağlantıya tıklayan
 * kişi dolu bir ekrana düşsün. Boş bir CRM'de gösterilecek bir şey yok.
 *
 * Yalnızca ayarda adı geçen demo adreslerine dokunur. Bu adresler bu iş için
 * ayrılmıştır; gerçek bir kullanıcı hesabı bu yoldan asla oluşturulmaz ya da
 * değiştirilmez.
 *
 * Veri bir kez kurulur; sonraki girişlerde çoğaltılmaz, çünkü her tıklamada
 * yeni hasta üretmek birkaç günde anlamsız bir yığına dönüşür.
 */
class DemoAccountService
{
    private const SIFRE = 'DemoMedagama2026!';

    public function hazirla(string $rolId): ?User
    {
        $eposta = trim((string) (config('demo.accounts')[$rolId] ?? ''));
        if ($eposta === '') {
            return null;
        }

        return DB::transaction(function () use ($rolId, $eposta) {
            $kullanici = User::where('email', $eposta)->first();

            // Adres başka bir role aitse dokunmuyoruz: yanlış ayar yüzünden
            // bir hesabın rolünü değiştirmek onu tanınmaz hale getirirdi.
            if ($kullanici && $kullanici->role_id !== $rolId) {
                return null;
            }

            if (!$kullanici) {
                $kullanici = $this->hesapAc($rolId, $eposta);
            }

            $this->crmeHazirla($kullanici);
            $this->ornekVeriKur($kullanici);

            return $kullanici->fresh();
        });
    }

    private function hesapAc(string $rolId, string $eposta): User
    {
        $doktorMu = $rolId === 'doctor';

        $kullanici = User::create([
            'fullname'          => $doktorMu ? 'Dr. Demo Hekim' : 'Demo Klinik Yönetimi',
            'username'          => $doktorMu ? 'demo_hekim' : 'demo_klinik',
            'email'             => $eposta,
            'password'          => bcrypt(self::SIFRE),
            'role_id'           => $rolId,
            'is_active'         => true,
            'is_demo'           => true,
            'is_verified'       => true,
            'email_verified_at' => now(),
            'country'           => 'TR',
        ]);

        if ($doktorMu) {
            DoctorProfile::updateOrCreate(
                ['user_id' => $kullanici->id],
                [
                    'title'                => 'Kardiyoloji Uzmanı',
                    'biography'            => 'Demo hesabı — CRM denemesi için oluşturuldu.',
                    'onboarding_completed' => true,
                    'online_consultation'  => true,
                    'timezone'             => 'Europe/Istanbul',
                ],
            );
        } else {
            $klinik = Clinic::create([
                'owner_id'             => $kullanici->id,
                'codename'             => 'demo-klinik-' . Str::lower(Str::random(6)),
                'name'                 => 'Demo Klinik',
                'fullname'             => 'Demo Klinik',
                'address'              => 'Demo Mah. Deneme Cad. No:1, İstanbul',
                'phone'                => '+90 212 000 0000',
                'biography'            => 'Demo hesabı — CRM denemesi için oluşturuldu.',
                'onboarding_completed' => true,
                'timezone'             => 'Europe/Istanbul',
            ]);

            $kullanici->clinic_id = $klinik->id;
            $kullanici->save();
        }

        return $kullanici;
    }

    /** CRM aboneliğe ve doğrulamaya bakıyor; kapalıysa kilitli ekran açılır. */
    private function crmeHazirla(User $kullanici): void
    {
        $kullanici->forceFill([
            'is_demo'             => true,
            'is_verified'         => true,
            'verification_status' => 'approved',
            'is_crm_active'       => true,
            'crm_expires_at'      => now()->addYear(),
        ])->save();

        $klinik = $kullanici->ownedClinic ?? $kullanici->clinic;
        if ($klinik) {
            $klinik->forceFill([
                'is_crm_active'  => true,
                'crm_expires_at' => now()->addYear(),
            ])->save();
        }
    }

    /**
     * Örnek hastalar, randevular ve bir fatura. Ekranların boş kalmaması için
     * yeterli; gerçek bir kliniğin verisini taklit etmeye çalışmıyor.
     */
    private function ornekVeriKur(User $saglayici): void
    {
        $doktorId = $saglayici->role_id === 'doctor' ? $saglayici->id : null;
        $klinik   = $saglayici->ownedClinic ?? $saglayici->clinic;

        // Klinik sahibi için randevuları taşıyacak bir hekim gerekiyor.
        if (!$doktorId && $klinik) {
            $doktorId = $this->klinikHekimi($klinik, $saglayici)->id;
        }

        if (!$doktorId) {
            return;
        }

        // Zaten kurulduysa tekrar üretme.
        if (Appointment::where('doctor_id', $doktorId)->exists()) {
            return;
        }

        $hastalar = collect([
            ['Ayşe Yıldız',   'demo-hasta-1@medagama.test'],
            ['Mehmet Aydın',  'demo-hasta-2@medagama.test'],
            ['Elif Korkmaz',  'demo-hasta-3@medagama.test'],
        ])->map(fn ($h) => User::firstOrCreate(
            ['email' => $h[1]],
            [
                'fullname'          => $h[0],
                'username'          => Str::slug($h[0], '_') . '_' . Str::lower(Str::random(4)),
                'password'          => bcrypt(self::SIFRE),
                'role_id'           => 'patient',
                'is_active'         => true,
                'is_demo'           => true,
                'is_verified'       => true,
                'email_verified_at' => now(),
                'country'           => 'TR',
            ],
        ));

        // Geçmiş, yaklaşan ve gelmedi — üç durum da ekranlarda görünsün.
        $plan = [
            [$hastalar[0], now()->addHours(3),  'online',   'confirmed'],
            [$hastalar[1], now()->addDays(2),   'inPerson', 'confirmed'],
            [$hastalar[2], now()->subDays(4),   'inPerson', 'completed'],
            [$hastalar[0], now()->subDays(11),  'inPerson', 'no_show'],
        ];

        foreach ($plan as [$hasta, $an, $tur, $durum]) {
            $yerel = $an->copy()->setTimezone('Europe/Istanbul');
            Appointment::create([
                'patient_id'       => $hasta->id,
                'doctor_id'        => $doktorId,
                'clinic_id'        => $klinik?->id,
                'created_by'       => $hasta->id,
                'appointment_type' => $tur,
                'appointment_date' => $yerel->toDateString(),
                'appointment_time' => $yerel->format('H:i'),
                'starts_at'        => $an,
                'timezone'         => 'Europe/Istanbul',
                'status'           => $durum,
                'is_active'        => true,
                'patient_medical_snapshot' => "Bilinen Durumlar / Alerjiler: Penisilin alerjisi\nKullanılan İlaçlar: Metformin 1000mg",
            ]);
        }

        // Tamamlanan randevuya bir muayene kaydı.
        PatientRecord::create([
            'patient_id'     => $hastalar[2]->id,
            'doctor_id'      => $doktorId,
            'clinic_id'      => $klinik?->id,
            'record_type'    => 'examination',
            // Muayene kaydında dosya yok ama kolon zorunlu.
            'file_url'       => '',
            'upload_date'    => now()->subDays(4)->toDateString(),
            'diagnosis_note' => 'Üst solunum yolu enfeksiyonu; istirahat ve sıvı önerildi.',
            'vitals'         => ['Tansiyon' => '120/80', 'Nabız' => '76', 'Ateş' => '36.8'],
            'prescriptions'  => [['name' => 'Parasetamol 500mg', 'dosage' => 'Günde 3 kez']],
            'is_active'      => true,
        ]);

        Invoice::create([
            'invoice_number' => 'DEMO-' . Str::upper(Str::random(6)),
            'patient_id'     => $hastalar[2]->id,
            'doctor_id'      => $doktorId,
            'clinic_id'      => $klinik?->id,
            'subtotal'       => 1500,
            'grand_total'    => 1500,
            'paid_amount'    => 1500,
            'currency'       => 'TRY',
            'status'         => 'paid',
            'issue_date'     => now()->subDays(4)->toDateString(),
            'paid_at'        => now()->subDays(4),
        ]);
    }

    /** Klinik demosunda randevuları taşıyacak hekim. */
    private function klinikHekimi(Clinic $klinik, User $sahip): User
    {
        $mevcut = User::where('clinic_id', $klinik->id)->where('role_id', 'doctor')->first();
        if ($mevcut) {
            return $mevcut;
        }

        $hekim = User::create([
            'fullname'          => 'Dr. Demo Klinik Hekimi',
            'username'          => 'demo_klinik_hekim_' . Str::lower(Str::random(4)),
            'email'             => 'demo-klinik-hekim@medagama.test',
            'password'          => bcrypt(self::SIFRE),
            'role_id'           => 'doctor',
            'clinic_id'         => $klinik->id,
            'is_active'         => true,
            'is_demo'           => true,
            'is_verified'       => true,
            'email_verified_at' => now(),
            'country'           => 'TR',
        ]);

        DoctorProfile::updateOrCreate(
            ['user_id' => $hekim->id],
            ['title' => 'Dahiliye Uzmanı', 'onboarding_completed' => true, 'timezone' => 'Europe/Istanbul'],
        );

        return $hekim;
    }
}
