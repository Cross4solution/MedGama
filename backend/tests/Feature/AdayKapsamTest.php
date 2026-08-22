<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Satış adaylarını kim görebiliyor.
 *
 * LeadController sistemdeki en büyük test edilmemiş dosyaydı (473 satır) ve
 * içinde potansiyel hastaların adı, telefonu, e-postası ve şifrelenmiş notları
 * duruyor. İki ayrı kapsam kuralı var ve ikisi de tek satırlık koşullara
 * dayanıyor:
 *
 *   • Satışçı YALNIZCA kendisine atanan adayları görür.
 *   • Kimse başka kliniğin adaylarını göremez.
 *
 * İkisi de sessizce kırılabilecek türden: kural gevşerse ekran daha çok kayıt
 * gösterir, hata vermez.
 */
class AdayKapsamTest extends TestCase
{
    use RefreshDatabase;

    /** CRM'i açık bir klinik — kapı kliniğin aboneliğine bakıyor. */
    private function klinik(): Clinic
    {
        $klinik = Clinic::factory()->create();
        $klinik->forceFill([
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        return $klinik;
    }

    private function aday(Clinic $klinik, ?User $atanan, string $ad): Lead
    {
        return Lead::create([
            'clinic_id'   => $klinik->id,
            'assigned_to' => $atanan?->id,
            'full_name'   => $ad,
            'email'       => strtolower($ad) . '@ornek.test',
            'phone'       => '+900000000000',
            'source'      => 'other',
            'stage'       => 'new',
        ]);
    }

    // ── Satışçı kapsamı ──────────────────────────────────────────────

    public function test_satisci_yalnizca_kendi_adaylarini_listeliyor(): void
    {
        $klinik = $this->klinik();
        $satisci = User::factory()->salesperson()->create(['clinic_id' => $klinik->id]);
        $digerSatisci = User::factory()->salesperson()->create(['clinic_id' => $klinik->id]);

        $this->aday($klinik, $satisci, 'BENIM-ADAYIM');
        $this->aday($klinik, $digerSatisci, 'DIGERININ-ADAYI');

        $govde = $this->actingAs($satisci, 'sanctum')
            ->getJson('/api/crm/leads')
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('BENIM-ADAYIM', $govde);
        $this->assertStringNotContainsString(
            'DIGERININ-ADAYI',
            $govde,
            'Satışçı başka satışçının adayını görüyor',
        );
    }

    public function test_satisci_kendine_atanmamis_adayi_acamiyor(): void
    {
        $klinik = $this->klinik();
        $satisci = User::factory()->salesperson()->create(['clinic_id' => $klinik->id]);
        $digerSatisci = User::factory()->salesperson()->create(['clinic_id' => $klinik->id]);

        $baskasininAdayi = $this->aday($klinik, $digerSatisci, 'GIZLI-ADAY');

        // Kimliği bilse bile açamamalı: listeyi süzmek tek başına yetmez.
        $this->actingAs($satisci, 'sanctum')
            ->getJson("/api/crm/leads/{$baskasininAdayi->id}")
            ->assertForbidden();
    }

    public function test_satisci_baskasinin_adayini_degistiremiyor(): void
    {
        $klinik = $this->klinik();
        $satisci = User::factory()->salesperson()->create(['clinic_id' => $klinik->id]);
        $digerSatisci = User::factory()->salesperson()->create(['clinic_id' => $klinik->id]);

        $aday = $this->aday($klinik, $digerSatisci, 'DOKUNULMAZ');

        $this->actingAs($satisci, 'sanctum')
            ->putJson("/api/crm/leads/{$aday->id}", ['full_name' => 'DEGISTIRILDI'])
            ->assertForbidden();

        $this->assertSame('DOKUNULMAZ', $aday->fresh()->full_name);
    }

    public function test_satisci_satisci_yonetemiyor(): void
    {
        $klinik = $this->klinik();
        $satisci = User::factory()->salesperson()->create(['clinic_id' => $klinik->id]);

        // Satışçı yönetimi klinik sahibine ait; satışçı kendine ekip kuramaz.
        $this->actingAs($satisci, 'sanctum')
            ->getJson('/api/crm/salespeople')
            ->assertForbidden();
    }

    // ── Klinik kapsamı ───────────────────────────────────────────────

    public function test_klinik_baska_kliniginin_adayini_listelemiyor(): void
    {
        $klinik = $this->klinik();
        $sahip = User::factory()->clinicOwner()->create(['clinic_id' => $klinik->id]);
        $klinik->update(['owner_id' => $sahip->id]);

        $digerKlinik = $this->klinik();
        $this->aday($digerKlinik, null, 'BASKA-KLINIK-ADAYI');
        $this->aday($klinik, null, 'KENDI-ADAYIM');

        $govde = $this->actingAs($sahip, 'sanctum')
            ->getJson('/api/crm/leads')
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('KENDI-ADAYIM', $govde);
        $this->assertStringNotContainsString(
            'BASKA-KLINIK-ADAYI',
            $govde,
            'Klinik başka kliniğin adaylarını görüyor',
        );
    }

    public function test_klinik_baska_kliniginin_adayini_silemiyor(): void
    {
        $klinik = $this->klinik();
        $sahip = User::factory()->clinicOwner()->create(['clinic_id' => $klinik->id]);
        $klinik->update(['owner_id' => $sahip->id]);

        $digerKlinik = $this->klinik();
        $aday = $this->aday($digerKlinik, null, 'BASKA-KLINIK');

        $this->actingAs($sahip, 'sanctum')
            ->deleteJson("/api/crm/leads/{$aday->id}")
            ->assertForbidden();

        $this->assertNotNull(Lead::find($aday->id), 'Başka kliniğin adayı silinmiş');
    }

    public function test_hasta_aday_ucuna_hic_giremiyor(): void
    {
        $hasta = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/crm/leads')
            ->assertForbidden();
    }
}
