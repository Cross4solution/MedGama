<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Hasta kartına erişim sınırı.
 *
 * Hasta kartı uçları kimliği doğrulanmış herkese açıktı: bir doktor, hiç
 * görmediği bir hastanın adını, e-postasını, zaman çizelgesini ve tıbbi
 * özetini yalnızca kimliğini bilerek okuyabiliyordu. Randevu ve belge uçları
 * bunu zaten engelliyordu; hasta kartı atlanmıştı.
 *
 * KVKK, GDPR (Md. 9) ve HIPAA üçü de sağlık verisine erişimi tedavi
 * ilişkisiyle sınırlıyor. Bu testler o sınırı yerinde tutuyor.
 */
class PatientAccessBoundaryTest extends TestCase
{
    use RefreshDatabase;

    private User $kendiDoktoru;
    private User $yabanciDoktor;
    private User $hasta;

    protected function setUp(): void
    {
        parent::setUp();

        // Kliniğe bağlı doktorda abonelik KLİNİĞİN üzerinde aranıyor.
        $klinik = Clinic::factory()->create([
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        // Her iki doktorun da CRM aboneliği var: aksi hâlde crm.access ara
        // katmanı zaten 403 döner ve test, sınamak istediğimiz erişim
        // kuralına hiç ulaşmadan "geçer".
        $this->kendiDoktoru = User::factory()->doctor()->create([
            'clinic_id' => $klinik->id,
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $this->yabanciDoktor = User::factory()->doctor()->create([
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $this->hasta = User::factory()->patient()->create();

        // İlişkiyi kuran şey randevu.
        Appointment::factory()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $this->kendiDoktoru->id,
            'clinic_id'  => $klinik->id,
            'status'     => 'completed',
        ]);
    }

    /** @return string[] Hasta kartının tüm okuma uçları. */
    private function uclar(): array
    {
        $id = $this->hasta->id;

        return [
            "/api/crm/patients/{$id}",
            "/api/crm/patients/{$id}/timeline",
            "/api/crm/patients/{$id}/summary",
            "/api/crm/patients/{$id}/documents",
        ];
    }

    public function test_tedavi_eden_doktor_hasta_kartini_acabilir(): void
    {
        Sanctum::actingAs($this->kendiDoktoru);

        foreach ($this->uclar() as $uc) {
            $this->getJson($uc)->assertOk();
        }
    }

    /** En kritik sınır: ilişkisi olmayan doktor hiçbirini açamamalı. */
    public function test_yabanci_doktor_hasta_kartina_erisemez(): void
    {
        Sanctum::actingAs($this->yabanciDoktor);

        foreach ($this->uclar() as $uc) {
            $this->getJson($uc)->assertStatus(403);
        }
    }

    /** Etiket ve süreç aşaması yazma da aynı sınıra tabi. */
    public function test_yabanci_doktor_hastaya_etiket_veya_asama_yazamaz(): void
    {
        Sanctum::actingAs($this->yabanciDoktor);
        $id = $this->hasta->id;

        $this->postJson("/api/crm/patients/{$id}/tags", ['tag' => 'vip'])->assertStatus(403);
        $this->postJson("/api/crm/patients/{$id}/stage", ['stage' => 'treatment'])->assertStatus(403);
    }

    /** Hastanın kendi kaydına başka bir hasta erişememeli. */
    public function test_hasta_baska_hastanin_kartini_acamaz(): void
    {
        Sanctum::actingAs(User::factory()->patient()->create());

        foreach ($this->uclar() as $uc) {
            $this->getJson($uc)->assertStatus(403);
        }
    }

    /** Kliniğin sahibi, kliniğinde randevusu olan hastayı görebilir. */
    public function test_klinik_sahibi_kendi_kliniginin_hastasini_gorebilir(): void
    {
        $klinik = Clinic::factory()->create([
            'owner_id' => null,
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $sahip = User::factory()->create([
            'role_id'   => 'clinicOwner',
            'clinic_id' => $klinik->id,
            'is_active' => true,
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $hasta2 = User::factory()->patient()->create();
        Appointment::factory()->create([
            'patient_id' => $hasta2->id,
            'doctor_id'  => $this->kendiDoktoru->id,
            'clinic_id'  => $klinik->id,
        ]);

        Sanctum::actingAs($sahip);
        $this->getJson("/api/crm/patients/{$hasta2->id}")->assertOk();

        // Başka kliniğin hastasını göremez.
        $this->getJson("/api/crm/patients/{$this->hasta->id}")->assertStatus(403);
    }
}
