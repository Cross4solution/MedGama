<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * En hassas dosyaları kim indirebiliyor.
 *
 * Sistemde on beşe yakın dosya indirme ucu var; yalnızca ikisinin erişim
 * sınırı test ediliyordu (fatura PDF'i ve sohbet eki türü). Buradaki iki uç
 * taşıdıkları içerik yüzünden ayrı önemde:
 *
 *   • REÇETE PDF'i — hastanın tanısı ve ilaçları.
 *   • KLİNİK DOĞRULAMA BELGESİ — ruhsat, diploma, kimlik taraması.
 *
 * Kurallar kodda doğru yazılmış (reçeteyi yalnızca muayeneyi yapan doktor,
 * belgeyi yalnızca klinik sahibi ya da yönetici alabiliyor). Testleri yoktu;
 * bu dosya onları sabitliyor — ileride bir düzenleme kuralı gevşetirse
 * sessizce geçmesin.
 */
class HassasDosyaErisimTest extends TestCase
{
    use RefreshDatabase;

    /**
     * CRM aboneliği açık doktor.
     *
     * İki incelik var, ikisi de sessizce 403'e yol açıyor:
     *
     * 1. `is_crm_active` ve `crm_expires_at` bilerek `fillable` DIŞINDA —
     *    kullanıcı kendi profilini güncelleyerek abonelik kazanamasın diye.
     *    Fabrikaya parametre olarak verilince sessizce yok sayılıyorlar.
     *
     * 2. Kliniğe bağlı doktor KENDİ aboneliğini değil, KLİNİĞİN aboneliğini
     *    kullanıyor. Doktorun kaydına abonelik yazmak hiçbir kapıyı açmıyor.
     */
    private function crmliDoktor(Clinic $klinik): User
    {
        $klinik->forceFill([
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        return User::factory()->doctor()->create([
            'clinic_id'   => $klinik->id,
            'is_verified' => true,
        ]);
    }

    /** @return array{0: PatientRecord, 1: User, 2: User, 3: Clinic} muayene, doktor, hasta, klinik */
    private function muayeneKur(): array
    {
        $klinik = Clinic::factory()->create();
        $doktor = $this->crmliDoktor($klinik);
        $hasta = User::factory()->patient()->create();

        // Fabrika varsayılanı rastgele bir belge türü seçiyor; reçete ucu
        // yalnızca "examination" türündeki kayıtları görüyor.
        $muayene = PatientRecord::factory()->create([
            'doctor_id'   => $doktor->id,
            'patient_id'  => $hasta->id,
            'clinic_id'   => $klinik->id,
            'record_type' => 'examination',
        ]);

        return [$muayene, $doktor, $hasta, $klinik];
    }

    // ── Reçete PDF'i ─────────────────────────────────────────────────

    public function test_muayeneyi_yapan_doktor_receteyi_indirebiliyor(): void
    {
        [$muayene, $doktor] = $this->muayeneKur();

        $this->actingAs($doktor, 'sanctum')
            ->get("/api/crm/examinations/{$muayene->id}/prescription-pdf")
            ->assertOk();
    }

    public function test_yabanci_doktor_baskasinin_recetesini_indiremiyor(): void
    {
        [$muayene] = $this->muayeneKur();

        $yabanciDoktor = $this->crmliDoktor(Clinic::factory()->create());

        // Doktor olmak yetmiyor; O muayeneyi yapan doktor olmak gerekiyor.
        $yanit = $this->actingAs($yabanciDoktor, 'sanctum')
            ->get("/api/crm/examinations/{$muayene->id}/prescription-pdf");

        $this->assertContains(
            $yanit->getStatusCode(),
            [403, 404],
            'Yabancı doktor başka bir hastanın reçetesini indirebiliyor',
        );
    }

    public function test_hasta_crm_recete_ucunu_kullanamiyor(): void
    {
        [$muayene, , $hasta] = $this->muayeneKur();

        // Uç CRM tarafında; hasta rolü buraya hiç girmemeli.
        $yanit = $this->actingAs($hasta, 'sanctum')
            ->get("/api/crm/examinations/{$muayene->id}/prescription-pdf");

        $this->assertContains($yanit->getStatusCode(), [403, 404]);
    }

    public function test_oturumsuz_recete_indirilemiyor(): void
    {
        [$muayene] = $this->muayeneKur();

        $this->getJson("/api/crm/examinations/{$muayene->id}/prescription-pdf")
            ->assertUnauthorized();
    }

    // ── Klinik doğrulama belgesi ─────────────────────────────────────

    public function test_baska_kliniginin_sahibi_dogrulama_belgesini_indiremiyor(): void
    {
        $klinik = Clinic::factory()->create();
        $sahip = User::factory()->clinicOwner()->create(['clinic_id' => $klinik->id]);
        $klinik->update(['owner_id' => $sahip->id]);

        $digerKlinik = Clinic::factory()->create();
        $digerSahip = User::factory()->clinicOwner()->create(['clinic_id' => $digerKlinik->id]);
        $digerKlinik->update(['owner_id' => $digerSahip->id]);

        // Kimlik ve ruhsat taraması taşıyan uç: kimliği bilinse bile başka
        // kliniğin sahibine açılmamalı.
        $yanit = $this->actingAs($digerSahip, 'sanctum')
            ->get("/api/clinic-verifications/{$klinik->id}/document/license_document");

        $this->assertContains(
            $yanit->getStatusCode(),
            [403, 404],
            'Başka kliniğin sahibi doğrulama belgesine erişebiliyor',
        );
    }

    public function test_dogrulama_belgesi_oturumsuz_indirilemiyor(): void
    {
        $klinik = Clinic::factory()->create();

        $this->getJson("/api/clinic-verifications/{$klinik->id}/document/license_document")
            ->assertUnauthorized();
    }

    public function test_tanimsiz_belge_alani_reddediliyor(): void
    {
        $klinik = Clinic::factory()->create();
        $sahip = User::factory()->clinicOwner()->create(['clinic_id' => $klinik->id]);
        $klinik->update(['owner_id' => $sahip->id]);

        // Alan adı beyaz listeden geliyor; serbest metin kabul edilirse
        // dosya sisteminde gezinmeye açılır.
        $this->actingAs($sahip, 'sanctum')
            ->get("/api/clinic-verifications/{$klinik->id}/document/../../.env")
            ->assertNotFound();
    }
}
