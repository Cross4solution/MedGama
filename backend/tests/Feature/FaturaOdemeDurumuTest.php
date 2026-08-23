<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fatura ödeme durumu — "ödendi" gerçekten ödendi mi.
 *
 * Bulunan hata: durum, tutar YENİDEN HESAPLANMADAN ÖNCE yazılıyordu.
 * Ölçülen dizi:
 *
 *   1000 TL fatura → "ödendi" işaretle → ödenen 1000, durum paid
 *   sonra %20 KDV  → toplam 1200,        ödenen 1000, durum HÂLÂ paid
 *
 * Fatura 200 TL alacakla birlikte ödenmiş görünüyordu. Daha kötüsü,
 * `getOutstandingBalances` yalnız `pending`/`partial` faturalara baktığı için
 * bu 200 TL alacak listesinden de düşüyordu: klinik parayı sessizce
 * kaybediyordu. Aynı şey tek istekte `status=paid` ile `tax_rate` birlikte
 * gönderilince de oluyordu.
 *
 * Ölçülen ama DEĞİŞTİRİLMEYEN bir şey: `paid_amount` kuralında üst sınır yok,
 * 1000 TL'lik faturaya 999999 yazılabiliyor. Bu bilinçli bir karar
 * (FaturaHesaplamaTest: "yuvarlama ya da elle giriş yüzünden fazla ödeme
 * olabiliyor", kalan sıfırda tutuluyor). Fazladan bir sıfırın görünmez
 * kalması riski müşterinin kararı; burada tek taraflı değiştirilmedi.
 */
class FaturaOdemeDurumuTest extends TestCase
{
    use RefreshDatabase;

    private BillingService $servis;
    private User $klinik;

    protected function setUp(): void
    {
        parent::setUp();
        $this->servis = app(BillingService::class);
        $this->klinik = User::factory()->create(['role_id' => 'clinicOwner']);
    }

    private function fatura(float $tutar = 1000): Invoice
    {
        $hasta = User::factory()->patient()->create();

        return $this->servis->createInvoice($this->klinik, [
            'patient_id' => $hasta->id,
            'items'      => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => $tutar]],
            'currency'   => 'TRY',
        ]);
    }

    public function test_tutar_sonradan_artarsa_fatura_odenmis_kalmiyor(): void
    {
        // ASIL REGRESYON.
        $fatura = $this->fatura(1000);
        $this->servis->updateInvoice($fatura, ['status' => 'paid']);

        $this->assertSame('paid', $fatura->fresh()->status);

        $this->servis->updateInvoice($fatura, ['tax_rate' => 20]);
        $fatura->refresh();

        $this->assertSame(1200.0, (float) $fatura->grand_total);
        $this->assertSame(1000.0, (float) $fatura->paid_amount);
        $this->assertSame('partial', $fatura->status, 'tutar arttı ama fatura hâlâ ödenmiş görünüyor');
        $this->assertSame(200.0, $fatura->remainingAmount());
    }

    public function test_odenmemis_fatura_alacak_listesinde_gorunuyor(): void
    {
        // Durumun yanlış kalmasının PARA karşılığı bu: fatura listeden düşünce
        // kimse o 200 TL'yi istemiyor.
        $fatura = $this->fatura(1000);
        $this->servis->updateInvoice($fatura, ['status' => 'paid']);
        $this->servis->updateInvoice($fatura, ['tax_rate' => 20]);

        $alacaklar = $this->servis->getOutstandingBalances($this->klinik);

        $this->assertNotEmpty($alacaklar, 'ödenmemiş 200 TL alacak listesine hiç girmedi');
        $this->assertSame(200.0, (float) $alacaklar[0]['total_owed']);
    }

    public function test_ayni_istekte_odendi_ve_kdv_birlikte_gelirse_de_dogru(): void
    {
        $fatura = $this->fatura(1000);

        $this->servis->updateInvoice($fatura, ['status' => 'paid', 'tax_rate' => 20]);
        $fatura->refresh();

        $this->assertSame('partial', $fatura->status);
        $this->assertSame(200.0, $fatura->remainingAmount());
    }

    public function test_odeme_tarihi_odenmemis_faturada_temizleniyor(): void
    {
        // Raporlar `paid_at` üzerinden aylık tahsilat sayıyor; tarih kalırsa
        // tahsil edilmemiş para tahsil edilmiş gibi raporlanır.
        $fatura = $this->fatura(1000);
        $this->servis->updateInvoice($fatura, ['status' => 'paid']);
        $this->assertNotNull($fatura->fresh()->paid_at);

        $this->servis->updateInvoice($fatura, ['tax_rate' => 20]);

        $this->assertNull($fatura->fresh()->paid_at, 'ödenmemiş faturada ödeme tarihi kaldı');
    }

    public function test_tam_odeme_hala_odendi_sayiliyor(): void
    {
        // Ters uç: kural fazla sıkı olursa hiçbir fatura kapanmaz ve bunu
        // yalnız "ödenmiş kalmasın" testleriyle fark edemezdik.
        $fatura = $this->fatura(1000);

        $this->servis->updateInvoice($fatura, ['paid_amount' => 1000]);
        $fatura->refresh();

        $this->assertSame('paid', $fatura->status);
        $this->assertNotNull($fatura->paid_at);
        $this->assertSame(0.0, $fatura->remainingAmount());
    }

    public function test_kismi_odeme_partial_oluyor(): void
    {
        $fatura = $this->fatura(1000);

        $this->servis->updateInvoice($fatura, ['paid_amount' => 400]);

        $this->assertSame('partial', $fatura->fresh()->status);
        $this->assertSame(600.0, $fatura->fresh()->remainingAmount());
    }

    public function test_odeme_geri_alinirsa_bekleyene_donuyor(): void
    {
        $fatura = $this->fatura(1000);
        $this->servis->updateInvoice($fatura, ['paid_amount' => 400]);

        $this->servis->updateInvoice($fatura, ['paid_amount' => 0]);

        $this->assertSame('pending', $fatura->fresh()->status);
    }

    public function test_iptal_edilen_fatura_tutarla_yeniden_acilmiyor(): void
    {
        // İptal bir ödeme durumu değil; tutar onu belirlememeli.
        $fatura = $this->fatura(1000);

        $this->servis->updateInvoice($fatura, ['status' => 'cancelled', 'paid_amount' => 0]);

        $this->assertSame('cancelled', $fatura->fresh()->status);
    }
}
