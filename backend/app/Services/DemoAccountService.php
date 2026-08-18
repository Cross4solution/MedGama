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

            if ($rolId === 'patient') {
                $this->hastaVerisiKur($kullanici);
            } else {
                $this->crmeHazirla($kullanici);
                $this->ornekVeriKur($kullanici);
            }

            return $kullanici->fresh();
        });
    }

    private function hesapAc(string $rolId, string $eposta): User
    {
        $doktorMu = $rolId === 'doctor';
        $hastaMi  = $rolId === 'patient';

        $kullanici = User::create([
            'fullname'          => $doktorMu ? 'Dr. Demo Hekim' : ($hastaMi ? 'Demo Hasta' : 'Demo Klinik Yönetimi'),
            'username'          => $doktorMu ? 'demo_hekim' : ($hastaMi ? 'demo_hasta' : 'demo_klinik'),
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

    /**
     * Hasta demosu: randevu, fatura, okunmamış mesaj ve bildirim.
     *
     * Hastanın gördüğü ekranların hepsi dolu gelsin — boş bir akışta
     * rozetleri, faturayı ve randevu kartını denemek mümkün değil.
     */
    private function hastaVerisiKur(User $hasta): void
    {
        // Karşı taraf gerekiyor: randevuyu veren ve mesajı yazan hekim.
        $doktor = $this->hazirla('doctor');
        if (!$doktor) {
            return;
        }

        // Bir kez kurulur; her girişte yeni randevu/mesaj üretmek birkaç
        // günde anlamsız bir yığın bırakıyor.
        if (Appointment::where('patient_id', $hasta->id)->exists()) {
            return;
        }

        $plan = [
            [now()->addHours(5),  'online',   'confirmed'],
            [now()->addDays(3),   'inPerson', 'pending'],
            [now()->subDays(9),   'inPerson', 'completed'],
        ];

        foreach ($plan as [$an, $tur, $durum]) {
            Appointment::create([
                'patient_id'       => $hasta->id,
                'doctor_id'        => $doktor->id,
                'clinic_id'        => $doktor->clinic_id,
                'created_by'       => $hasta->id,
                'appointment_type' => $tur,
                'appointment_date' => $an->toDateString(),
                'appointment_time' => $an->format('H:i'),
                'starts_at'        => $an->copy()->utc(),
                'timezone'         => 'Europe/Istanbul',
                'status'           => $durum,
            ]);
        }

        $this->hastaFaturasi($hasta, $doktor);
        $this->hastaSohbeti($hasta, $doktor);
        $this->hastaBildirimleri($hasta);
    }

    /** Faturalar ekranı için ödenmiş ve bekleyen birer kayıt. */
    private function hastaFaturasi(User $hasta, User $doktor): void
    {
        foreach ([['paid', 1450.00, -9], ['pending', 890.00, -1]] as [$durum, $tutar, $gun]) {
            $fatura = Invoice::create([
                'invoice_number' => Invoice::generateInvoiceNumber(),
                'patient_id'     => $hasta->id,
                'doctor_id'      => $doktor->id,
                'clinic_id'      => $doktor->clinic_id,
                'subtotal'       => $tutar,
                'tax_rate'       => 0,
                'tax_amount'     => 0,
                'discount_amount' => 0,
                'grand_total'    => $tutar,
                'paid_amount'    => $durum === 'paid' ? $tutar : 0,
                'currency'       => 'EUR',
                'status'         => $durum,
                'issue_date'     => now()->addDays($gun)->toDateString(),
                'due_date'       => now()->addDays($gun + 14)->toDateString(),
                'paid_at'        => $durum === 'paid' ? now()->addDays($gun) : null,
            ]);

            \App\Models\InvoiceItem::create([
                'invoice_id'  => $fatura->id,
                'description' => $durum === 'paid' ? 'Kardiyoloji muayenesi' : 'Kontrol muayenesi ve EKG',
                'quantity'    => 1,
                'unit_price'  => $tutar,
                'total_price' => $tutar,
            ]);
        }
    }

    /** Menüdeki mesaj rozetinin görünmesi için okunmamış iki mesaj. */
    private function hastaSohbeti(User $hasta, User $doktor): void
    {
        $sohbet = \App\Models\ChatConversation::create([
            'user_one_id'            => $doktor->id,
            'user_two_id'            => $hasta->id,
            'last_message_at'        => now()->subMinutes(4),
            'last_message_content'   => 'Tahlil sonuçlarınız elime ulaştı, birlikte bakalım.',
            'last_message_type'      => 'text',
            'last_message_sender_id' => $doktor->id,
            'is_active'              => true,
        ]);

        $mesajlar = [
            ['Merhaba, randevunuz için hazırlık notlarını gönderiyorum.', 12],
            ['Tahlil sonuçlarınız elime ulaştı, birlikte bakalım.', 4],
        ];

        foreach ($mesajlar as [$metin, $dakika]) {
            \App\Models\ChatMessage::create([
                'conversation_id' => $sohbet->id,
                'sender_id'       => $doktor->id,
                'message_type'    => 'text',
                'content'         => $metin,
                'read_at'         => null, // okunmamış: rozet bunun için var
                'created_at'      => now()->subMinutes($dakika),
                'updated_at'      => now()->subMinutes($dakika),
            ]);
        }
    }

    /** Zil rozetinin görünmesi için okunmamış bildirimler. */
    private function hastaBildirimleri(User $hasta): void
    {
        $kayitlar = [
            ['appointment_confirmed', 'Randevunuz onaylandı', 'Dr. Demo Hekim randevunuzu onayladı.', '/patient/appointments'],
            ['invoice_issued', 'Faturanız hazır', 'Kontrol muayenesi faturanız düzenlendi.', '/patient/invoices'],
            ['new_chat_message', 'Yeni mesaj', 'Dr. Demo Hekim size bir mesaj gönderdi.', '/doctor-chat'],
        ];

        foreach ($kayitlar as $i => [$tip, $baslik, $metin, $yol]) {
            DB::table('notifications')->insert([
                'id'              => (string) Str::uuid(),
                'type'            => 'App\\Notifications\\DemoNotification',
                'notifiable_type' => User::class,
                'notifiable_id'   => $hasta->id,
                'data'            => json_encode([
                    'type'    => $tip,
                    'title'   => $baslik,
                    'message' => $metin,
                    'link'    => $yol,
                ], JSON_UNESCAPED_UNICODE),
                'read_at'         => null,
                'created_at'      => now()->subMinutes(($i + 1) * 7),
                'updated_at'      => now()->subMinutes(($i + 1) * 7),
            ]);
        }
    }
}
