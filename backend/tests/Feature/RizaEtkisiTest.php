<?php

namespace Tests\Feature;

use App\Models\ConsentRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Rızanın geri çekilmesinin ETKİSİ.
 *
 * Rıza kayıtları tutuluyordu ama hiçbir yerde sorgulanmıyordu. Kayıt
 * akışından geçmiş gerçek bir kullanıcıda ölçülen dizi:
 *
 *     DELETE /api/consents/health_data_processing  → 200 "Consent withdrawn."
 *     PUT    /api/auth/profile/medical-history     → 200  (yazmaya devam)
 *     GET    /api/patient-documents                → 200  (okumaya devam)
 *
 * Kullanıcı sağlık verisinin işlenmesine rızasını geri çekiyor, sistem
 * geri çekildiğini onaylıyor, işleme aynen sürüyor. KVKK ve GDPR md.7(3)
 * geri almayı vermek kadar kolay olmaya VE işlemeyi durdurmaya bağlıyor.
 * Hata sessiz: her uç 200 dönüyor, hiçbir şey ters görünmüyor.
 *
 * İkinci hata aynı akışta: `revoke()` üç ayrı sonucu tek `false` olarak
 * döndürüyordu. Aktif kaydı olmayan bir kullanıcı, GERİ ALINABİLİR bir onayı
 * geri almaya çalıştığında "bu onay hizmetin verilebilmesi için zorunludur"
 * yanıtını alıyordu — hukuki bir konuda yanlış bilgi.
 *
 * KAPSAM NOTU: engel yalnızca kullanıcının KENDİ sağlık verisi uçlarında.
 * Randevu ve klinik akışları kapsam dışı; orada işlemenin dayanağı
 * sözleşmenin ifası. Hangi özelliklerin "sağlık verisi işleme" sayılacağı
 * hukuki bir karar — burada uygulamanın kendi tanımı esas alındı.
 */
class RizaEtkisiTest extends TestCase
{
    use RefreshDatabase;

    private function kayitliHasta(string $eposta = 'riza@ornek.test'): User
    {
        $this->postJson('/api/auth/register', [
            'fullname'              => 'Rıza Testi',
            'email'                 => $eposta,
            'password'              => 'Qz8#vRt2mKp5wLx9',
            'password_confirmation' => 'Qz8#vRt2mKp5wLx9',
            'role_id'               => 'patient',
            'date_of_birth'         => '1990-01-01',
            'health_data_consent'   => true,
        ])->assertSuccessful();

        app('auth')->forgetGuards();

        return User::where('email', $eposta)->firstOrFail();
    }

    // ── Geri çekmenin etkisi ──

    public function test_riza_geri_cekilince_saglik_verisi_yazilamiyor(): void
    {
        $hasta = $this->kayitliHasta();

        $this->actingAs($hasta, 'sanctum')
            ->deleteJson('/api/consents/health_data_processing')
            ->assertOk();

        app('auth')->forgetGuards();

        $this->actingAs($hasta, 'sanctum')
            ->putJson('/api/auth/profile/medical-history', ['conditions' => ['astım']])
            ->assertForbidden()
            ->assertJsonPath('code', 'HEALTH_CONSENT_WITHDRAWN');
    }

    public function test_riza_geri_cekilince_saglik_belgeleri_okunamiyor(): void
    {
        $hasta = $this->kayitliHasta();

        $this->actingAs($hasta, 'sanctum')
            ->deleteJson('/api/consents/health_data_processing')
            ->assertOk();

        app('auth')->forgetGuards();

        $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/patient-documents')
            ->assertForbidden();
    }

    public function test_riza_yeniden_verilince_erisim_geri_geliyor(): void
    {
        // Ters uç: geri çekme kalıcı bir kilit olsaydı kullanıcı fikrini
        // değiştiremezdi — bu da rızayı geri almayı cezaya çevirirdi.
        $hasta = $this->kayitliHasta();

        $this->actingAs($hasta, 'sanctum')->deleteJson('/api/consents/health_data_processing')->assertOk();
        app('auth')->forgetGuards();

        $this->actingAs($hasta, 'sanctum')->postJson('/api/consents/health_data_processing')->assertOk();
        app('auth')->forgetGuards();

        $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/patient-documents')
            ->assertOk();
    }

    public function test_rizasi_duran_kullanici_etkilenmiyor(): void
    {
        $hasta = $this->kayitliHasta();

        $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/patient-documents')
            ->assertOk();
    }

    public function test_riza_sisteminden_onceki_hesap_kilitlenmiyor(): void
    {
        // Kaydı hiç olmayan hesaplar rıza sisteminden önce açılmış olabilir.
        // Onları engellemek, geri çekmemiş insanları cezalandırmak olurdu.
        $eski = User::factory()->patient()->create();

        $this->assertSame(0, ConsentRecord::where('user_id', $eski->id)->count());

        $this->actingAs($eski, 'sanctum')
            ->getJson('/api/patient-documents')
            ->assertOk();
    }

    // ── Geri alma yanıtları ──

    public function test_zorunlu_riza_geri_alinamiyor(): void
    {
        $hasta = $this->kayitliHasta();

        $this->actingAs($hasta, 'sanctum')
            ->deleteJson('/api/consents/privacy_policy')
            ->assertStatus(422);
    }

    public function test_bilinmeyen_tip_ayri_mesaj_veriyor(): void
    {
        // Eskiden bilinmeyen bir tip de "hizmet için zorunludur" diyordu.
        $hasta = $this->kayitliHasta();

        $this->actingAs($hasta, 'sanctum')
            ->deleteJson('/api/consents/uydurma_tip')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Unknown consent type.');
    }

    public function test_aktif_kaydi_olmayan_geri_alinabilir_riza_hata_vermiyor(): void
    {
        // ASIL YANLIŞ BİLGİ: geri alınabilir bir onay, yalnızca aktif kaydı
        // yok diye "hizmet için zorunludur" yanıtı alıyordu.
        $hasta = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')
            ->deleteJson('/api/consents/marketing_communications')
            ->assertOk();
    }

    // ── Kayıt bütünlüğü ──

    public function test_geri_alma_gecmisi_siliniyor_degil_isaretleniyor(): void
    {
        // İspat yükümlülüğü: kimin neyi ne zaman onayladığı ve geri çektiği
        // silinmemeli.
        $hasta = $this->kayitliHasta();

        $this->actingAs($hasta, 'sanctum')->deleteJson('/api/consents/health_data_processing')->assertOk();

        $kayit = ConsentRecord::where('user_id', $hasta->id)
            ->where('type', 'health_data_processing')->firstOrFail();

        $this->assertNotNull($kayit->granted_at, 'onay tarihi silinmiş');
        $this->assertNotNull($kayit->revoked_at, 'geri alma işaretlenmemiş');
    }

    public function test_kullanici_baskasinin_rizasini_gormuyor(): void
    {
        $hasta = $this->kayitliHasta('bir@ornek.test');
        $digeri = $this->kayitliHasta('iki@ornek.test');

        $yanit = $this->actingAs($hasta, 'sanctum')->getJson('/api/consents/history')->assertOk();

        $kimlikler = collect($yanit->json('data'))->pluck('id');
        $digerininKayitlari = ConsentRecord::where('user_id', $digeri->id)->pluck('id');

        $this->assertEmpty(
            $kimlikler->intersect($digerininKayitlari),
            'başka kullanıcının rıza kayıtları görünüyor',
        );
    }
}
