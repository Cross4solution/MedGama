<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\CrmTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Rota rol listesi, denetleyicinin dallandığı rollerle HİZALI kalmalı.
 *
 * `ReportController::scopeAppointments()` şöyle:
 *
 *     isDoctor()                      → doctor_id = ben
 *     isClinicOwner() || isHospital() → clinic_id = benim kliniğim
 *     (aksi hâlde)                    → SÜZGEÇ YOK
 *
 * Son dal süper yönetici içindir ve `crm/reports` rota grubu
 * `role:doctor,clinicOwner,hospital,superAdmin,saasAdmin` taşıdığı için
 * başkası oraya düşemiyor. Yani bu kod güvenli — ama güvenliği KENDİNDEN
 * değil, rota listesinden geliyor.
 *
 * Aynı kod biçimi `contact-messages` içinde SIZINTIYDI, çünkü orada rota
 * grubunun rol süzgeci yoktu ve hasta da o son dala düşüyordu (2edc25d).
 *
 * Bu ölçüt iki şeyi birden tutuyor: davranışı (yabancı rol veri görmüyor) ve
 * hizalanmayı (rota listesine denetleyicinin kapsamadığı bir rol eklenirse
 * kırmızı yanar — yeni rol sessizce süzgeçsiz dala düşer).
 */
class RolListesiHizalamasiTest extends TestCase
{
    use RefreshDatabase;

    /** Denetleyicinin AÇIKÇA kapsadığı roller + yöneticiler. */
    private const KAPSANAN = ['doctor', 'clinicOwner', 'hospital', 'superAdmin', 'saasAdmin'];

    private User $sahip;
    private Clinic $klinik;
    private User $yabanciSahip;

    protected function setUp(): void
    {
        parent::setUp();

        [$this->sahip, $this->klinik] = $this->klinikKur();
        [$this->yabanciSahip] = $this->klinikKur();
    }

    /** @return array{0: User, 1: Clinic} */
    private function klinikKur(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create([
            'owner_id'       => $sahip->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $sahip->forceFill([
            'clinic_id'      => $klinik->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        return [$sahip, $klinik];
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_rapor_rotasi_kapsanmayan_rol_kabul_etmiyor(): void
    {
        $rotalar = (string) file_get_contents(base_path('routes/api.php'));

        preg_match(
            "#prefix\('crm/reports'\)->middleware\(\[[^\]]*'role:([a-zA-Z,]+)'#",
            $rotalar,
            $eslesme,
        );

        $this->assertNotEmpty($eslesme, 'crm/reports rol süzgeci okunamadı — bu ölçüt güncellenmeli');

        $izinli = explode(',', $eslesme[1]);
        $fazlalik = array_diff($izinli, self::KAPSANAN);

        $this->assertSame(
            [],
            array_values($fazlalik),
            'rota listesine denetleyicinin kapsamadığı rol eklenmiş: o rol süzgeçsiz dala düşer',
        );
    }

    public function test_baska_klinigin_raporu_gorunmuyor(): void
    {
        $hekim = User::factory()->doctor()->create([
            'clinic_id'   => $this->klinik->id,
            'is_verified' => true,
        ]);

        \App\Models\Appointment::factory()->create([
            'doctor_id'        => $hekim->id,
            'patient_id'       => User::factory()->patient()->create()->id,
            'clinic_id'        => $this->klinik->id,
            'appointment_type' => 'online',
            'status'           => 'completed',
        ]);

        $yanit = $this->olarak($this->yabanciSahip)
            ->getJson('/api/crm/reports/services')
            ->assertOk()
            ->json();

        $toplam = collect($yanit['appointment_types'] ?? [])->sum('count');

        $this->assertSame(0, (int) $toplam, 'başka kliniğin randevuları raporda sayılıyor');
    }

    public function test_hasta_rapor_ucuna_giremiyor(): void
    {
        // Rol süzgecinin gerçekten bağlı olduğunun kanıtı: yukarıdaki hizalama
        // ölçütü yalnız listeyi okuyor, bu ölçüt listenin uygulandığını görüyor.
        $this->olarak(User::factory()->patient()->create())
            ->getJson('/api/crm/reports/services')
            ->assertStatus(403);
    }

    public function test_etiket_suzgecleri_baska_klinigin_etiketlerini_vermiyor(): void
    {
        $hekim = User::factory()->doctor()->create([
            'clinic_id'   => $this->klinik->id,
            'is_verified' => true,
        ]);

        CrmTag::create([
            'doctor_id'  => $hekim->id,
            'patient_id' => User::factory()->patient()->create()->id,
            'clinic_id'  => $this->klinik->id,
            'tag'        => 'gizli-etiket',
            'created_by' => $hekim->id,
        ]);

        $icerik = $this->olarak($this->yabanciSahip)
            ->getJson('/api/crm/patients/filters')
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString(
            'gizli-etiket',
            $icerik,
            'başka kliniğin hasta etiketleri süzgeç listesinde görünüyor',
        );
    }

    public function test_bildirim_sayaci_yalnizca_kendi_bildirimlerini_sayiyor(): void
    {
        $kullanici = User::factory()->patient()->create();

        $this->assertSame(
            0,
            (int) $this->olarak($kullanici)
                ->getJson('/api/notifications/unread-count')
                ->assertOk()
                ->json('unread_count'),
            'başkasının bildirimleri sayılıyor',
        );
    }
}
