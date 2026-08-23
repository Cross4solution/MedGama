<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Finans dışa aktarımı (CSV).
 *
 * Bulunan açık: FORMÜL ENJEKSİYONU. Elektronik tablo programları `=`, `+`,
 * `-`, `@`, sekme ve satır başı ile başlayan hücreleri formül sayar. Bu
 * dosyadaki alanların bir kısmını HASTA kendisi yazıyor — adı soyadı.
 *
 * Adını `=HYPERLINK("http://kotu.site","Fatura")` yapan biri, kliniğin
 * dışa aktarmayı açmasını bekler. Eski Excel sürümlerinde DDE ile komut
 * çalıştırmaya kadar gider. Kurban, dosyayı açan klinik; hasta yalnızca
 * kayıt formunu doldurmuş oluyor.
 *
 * Virgül, tırnak ve satır sonu zaten kaçırılıyordu; eksik olan buydu.
 *
 * İkinci ölçüt biçimin kendisi: adında virgül olan bir hasta satırı
 * kaydırırsa dışa aktarma sessizce bozulur — muhasebe yanlış dosyayla
 * çalışır ve bunu fark etmez.
 */
class FinansDisaAktarimTest extends TestCase
{
    use RefreshDatabase;

    private User $klinik;

    protected function setUp(): void
    {
        parent::setUp();
        $this->klinik = $this->crmliKlinikSahibi();
    }

    /** CRM aboneliği açık bir klinik sahibi — dışa aktarma o kapının arkasında. */
    private function crmliKlinikSahibi(): User
    {
        $sahip = User::factory()->create(['role_id' => 'clinicOwner', 'user_level' => 3]);

        $klinik = Clinic::factory()->create([
            'owner_id'       => $sahip->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        return $sahip->fresh();
    }

    private function faturaKes(string $hastaAdi): Invoice
    {
        $hasta = User::factory()->patient()->create(['fullname' => $hastaAdi]);

        return app(BillingService::class)->createInvoice($this->klinik, [
            'patient_id' => $hasta->id,
            'items'      => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 1000]],
            'currency'   => 'TRY',
        ]);
    }

    private function disaAktar(): string
    {
        $yanit = $this->actingAs($this->klinik, 'sanctum')
            ->get('/api/finance/export')
            ->assertOk();

        return $yanit->getContent();
    }

    /**
     * Dosyadaki HER hücreyi ayrıştırılmış hâliyle döndürür.
     *
     * Ham dizgede aramak yanıltıcı: `=HYPERLINK("a","b")` virgül içerdiği
     * için tırnaklanıyor ve `,=HYPERLINK` diye aranınca bulunmuyor —
     * ama Excel önce tırnağı ÇÖZÜYOR, sonra `=` görüp formül sayıyor.
     * Ölçüt, hücrenin çözülmüş değeri.
     */
    private function hucreler(): array
    {
        $hucreler = [];

        foreach (array_filter(explode("\n", $this->disaAktar())) as $satir) {
            foreach (str_getcsv(trim($satir, "\r")) as $hucre) {
                $hucreler[] = $hucre;
            }
        }

        return $hucreler;
    }

    public function test_formul_gibi_gorunen_ad_formul_olarak_cikmiyor(): void
    {
        // ASIL AÇIK.
        $this->faturaKes('=HYPERLINK("http://kotu.site","Fatura")');

        $hucreler = $this->hucreler();

        foreach ($hucreler as $hucre) {
            $this->assertStringStartsNotWith(
                '=',
                $hucre,
                'hücre formülle başlıyor, elektronik tablo bunu çalıştırır: ' . $hucre,
            );
        }

        $this->assertNotEmpty(
            array_filter($hucreler, fn ($h) => str_contains($h, 'HYPERLINK')),
            'ad tamamen kaybolmuş',
        );
    }

    public function test_dort_tehlikeli_baslangic_karakteri_de_etkisiz(): void
    {
        foreach (['=1+1', '+1+1', '-1+1', '@SUM(A1)'] as $ad) {
            $this->faturaKes($ad);
        }

        foreach ($this->hucreler() as $hucre) {
            if ($hucre === '') {
                continue;
            }

            $this->assertNotContains(
                $hucre[0],
                ['=', '+', '-', '@', "\t", "\r"],
                "hücre tehlikeli bir karakterle başlıyor: {$hucre}",
            );
        }
    }

    public function test_virgullu_ad_satiri_kaydirmiyor(): void
    {
        // Biçim ölçütü: sütun sayısı her satırda aynı kalmalı.
        $this->faturaKes('Kaya, Ayşe');

        $satirlar = array_values(array_filter(explode("\n", $this->disaAktar())));

        $this->assertGreaterThanOrEqual(2, count($satirlar), 'dışa aktarma veri satırı içermiyor');

        $basliktakiSutun = count(str_getcsv($satirlar[0]));

        foreach (array_slice($satirlar, 1) as $i => $satir) {
            $this->assertCount(
                $basliktakiSutun,
                str_getcsv($satir),
                'satır ' . ($i + 2) . ' sütun sayısı tutmuyor — dosya kaymış',
            );
        }
    }

    public function test_tirnakli_ad_dosyayi_bozmuyor(): void
    {
        $this->faturaKes('Ayşe "Küçük" Kaya');

        $satirlar = array_values(array_filter(explode("\n", $this->disaAktar())));
        $alanlar = str_getcsv($satirlar[1]);

        $this->assertContains('Ayşe "Küçük" Kaya', $alanlar, 'tırnaklı ad doğru çözülmüyor');
    }

    public function test_normal_ad_bozulmadan_cikiyor(): void
    {
        // Ters uç: kaçış her adın başına bir işaret koyarsa çıktı okunmaz olur.
        $this->faturaKes('Ayşe Kaya');

        $satirlar = array_values(array_filter(explode("\n", $this->disaAktar())));

        $this->assertContains('Ayşe Kaya', str_getcsv($satirlar[1]), 'normal ad değiştirilmiş');
    }

    public function test_sayisal_alanlar_metne_donusmuyor(): void
    {
        // Tutarlar sayı olarak kalmalı; tek tırnak eklenirse muhasebe
        // programı onları metin okur ve toplam alamaz.
        $this->faturaKes('Ayşe Kaya');

        $satirlar = array_values(array_filter(explode("\n", $this->disaAktar())));
        $alanlar = str_getcsv($satirlar[1]);

        $this->assertContains('1000.00', $alanlar, 'tutar alanı bozulmuş');
        foreach ($alanlar as $alan) {
            $this->assertStringNotContainsString("'1000", $alan, 'sayısal alana kaçış eklenmiş');
        }
    }

    public function test_baska_klinigin_faturalari_disa_aktarilmiyor(): void
    {
        // Dışa aktarma tüm faturalara açılırsa tek istekle bütün platformun
        // gelir verisi çıkar.
        $this->faturaKes('Benim Hastam');

        $digerKlinik = $this->crmliKlinikSahibi();
        $digerHasta = User::factory()->patient()->create(['fullname' => 'Yabanci Hasta']);
        app(BillingService::class)->createInvoice($digerKlinik, [
            'patient_id' => $digerHasta->id,
            'items'      => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 500]],
            'currency'   => 'TRY',
        ]);

        $csv = $this->disaAktar();

        $this->assertStringContainsString('Benim Hastam', $csv);
        $this->assertStringNotContainsString('Yabanci Hasta', $csv, 'başka kliniğin faturası dışa aktarıldı');
    }
}
