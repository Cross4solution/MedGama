<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fatura aritmetiği ve ciro toplamları.
 *
 * Erişim sınırları ayrıca kapsanmış durumda; buradaki soru RAKAMLARIN
 * DOĞRU olup olmadığı. Yanlış bir toplam sessiz kalır: uç 200 döner, ekran
 * bir sayı gösterir, kimse bir şeyin bozuk olduğunu anlamaz — ama klinik
 * yanlış tutarı tahsil eder ya da alacağını göremez.
 *
 * İki ayrı katman var:
 *   • Tek fatura: ara toplam, KDV, indirim, kalan tutar
 *   • Toplamlar: tahsil edilen / bekleyen / alacak
 *
 * Toplamlar SQL tarafında CASE WHEN ile hesaplanıyor; tek faturanın doğru
 * olması toplamların da doğru olduğunu göstermez.
 */
class FaturaHesaplamaTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;
    private User $hasta;

    protected function setUp(): void
    {
        parent::setUp();

        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id, 'is_crm_active' => true]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $this->doktor = User::factory()->doctor()->create([
            'clinic_id'   => $klinik->id,
            'is_verified' => true,
        ]);
        $this->doktor->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        $this->hasta = User::factory()->patient()->create();
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function faturaKes(array $govde): Invoice
    {
        $yanit = $this->olarak($this->doktor)
            ->postJson('/api/crm/billing/invoices', array_merge([
                'patient_id' => $this->hasta->id,
                'items'      => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 100]],
            ], $govde))
            ->assertStatus(201);

        // Fatura YANITTAKİ kimlikle alınıyor. `latest('created_at')` aynı
        // saniyede kesilen faturalar arasında rastgele birini veriyordu ve
        // toplam testi yanlış faturaya ödeme işliyordu — kod değil test
        // yanlıştı; toplamlar ölçülünce doğru çıktı.
        $id = $yanit->json('invoice.id') ?? $yanit->json('id');
        $this->assertNotNull($id, 'fatura yanıtında kimlik yok');

        return Invoice::findOrFail($id);
    }

    // ── Tek fatura aritmetiği ──

    public function test_ara_toplam_kalemlerden_hesaplaniyor(): void
    {
        $fatura = $this->faturaKes([
            'items' => [
                ['description' => 'Muayene', 'quantity' => 2, 'unit_price' => 150],
                ['description' => 'Tahlil', 'quantity' => 3, 'unit_price' => 40],
            ],
        ]);

        // 2×150 + 3×40 = 420
        $this->assertSame(420.0, (float) $fatura->subtotal);
        $this->assertSame(420.0, (float) $fatura->grand_total);
    }

    public function test_kdv_orandan_hesaplaniyor(): void
    {
        $fatura = $this->faturaKes([
            'tax_rate' => 20,
            'items'    => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 200]],
        ]);

        $this->assertSame(40.0, (float) $fatura->tax_amount, 'KDV tutarı yanlış');
        $this->assertSame(240.0, (float) $fatura->grand_total, 'genel toplam yanlış');
    }

    public function test_indirim_toplamdan_dusuluyor(): void
    {
        $fatura = $this->faturaKes([
            'discount_amount' => 50,
            'items'           => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 200]],
        ]);

        $this->assertSame(150.0, (float) $fatura->grand_total);
    }

    public function test_ara_toplamdan_buyuk_indirim_negatif_toplam_uretmiyor(): void
    {
        // Negatif bir genel toplam ciroyu AŞAĞI çeker ve toplamlarda sessizce
        // başka faturaların gelirini yer.
        $fatura = $this->faturaKes([
            'discount_amount' => 500,
            'items'           => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 200]],
        ]);

        $this->assertSame(0.0, (float) $fatura->grand_total, 'genel toplam negatife düştü');
    }

    public function test_genel_toplam_istekten_alinmiyor(): void
    {
        // İstemci toplamı dikte edebilseydi fatura kalemleriyle tutarsız
        // olurdu; muhasebe kaydı olarak değersizleşir.
        $fatura = $this->faturaKes([
            'grand_total' => 1,
            'subtotal'    => 1,
            'items'       => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 300]],
        ]);

        $this->assertSame(300.0, (float) $fatura->grand_total, 'genel toplam istekten alındı');
    }

    public function test_kalan_tutar_odenen_kadar_azaliyor(): void
    {
        $fatura = $this->faturaKes([
            'items' => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 300]],
        ]);

        $this->olarak($this->doktor)
            ->putJson("/api/crm/billing/invoices/{$fatura->id}", ['paid_amount' => 100])
            ->assertOk();

        $fatura->refresh();
        $this->assertSame(200.0, $fatura->remainingAmount());
        $this->assertSame('partial', $fatura->status, 'kısmi ödeme durumu yanlış');
    }

    public function test_tam_odeme_faturayi_kapatiyor(): void
    {
        $fatura = $this->faturaKes([
            'items' => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 300]],
        ]);

        $this->olarak($this->doktor)
            ->putJson("/api/crm/billing/invoices/{$fatura->id}", ['paid_amount' => 300])
            ->assertOk();

        $fatura->refresh();
        $this->assertSame('paid', $fatura->status);
        $this->assertSame(0.0, $fatura->remainingAmount());
    }

    public function test_fazla_odeme_negatif_kalan_uretmiyor(): void
    {
        // Yuvarlama ya da elle giriş yüzünden fazla ödeme olabiliyor; kalan
        // eksiye düşerse alacak toplamı yanlış çıkar.
        $fatura = $this->faturaKes([
            'items' => [['description' => 'Muayene', 'quantity' => 1, 'unit_price' => 300]],
        ]);

        $this->olarak($this->doktor)
            ->putJson("/api/crm/billing/invoices/{$fatura->id}", ['paid_amount' => 400])
            ->assertOk();

        $this->assertSame(0.0, $fatura->refresh()->remainingAmount(), 'kalan tutar negatife düştü');
    }

    // ── Toplamlar ──

    public function test_ciro_toplamlari_elle_hesapla_uyusuyor(): void
    {
        // Toplamlar SQL'de CASE WHEN ile hesaplanıyor; tek faturanın doğru
        // olması bunu göstermez.
        $odenen = $this->faturaKes(['items' => [['description' => 'A', 'quantity' => 1, 'unit_price' => 500]]]);
        $this->olarak($this->doktor)
            ->putJson("/api/crm/billing/invoices/{$odenen->id}", ['paid_amount' => 500])->assertOk();

        $bekleyen = $this->faturaKes(['items' => [['description' => 'B', 'quantity' => 1, 'unit_price' => 300]]]);

        $kismi = $this->faturaKes(['items' => [['description' => 'C', 'quantity' => 1, 'unit_price' => 200]]]);
        $this->olarak($this->doktor)
            ->putJson("/api/crm/billing/invoices/{$kismi->id}", ['paid_amount' => 50])->assertOk();

        $stats = $this->olarak($this->doktor)
            ->getJson('/api/crm/billing/stats')->assertOk()->json();

        // ALANLARA bakılıyor, ham gövdede dizge aranmıyor: "450" bir kimlikte
        // ya da ilgisiz bir sayıda da geçebilir ve doğrulama tesadüfen geçer.
        $this->assertSame(500.0, (float) $stats['total_revenue'], 'tahsil edilen tutar yanlış');

        // Alacak = bekleyenin tamamı + kısmi olanın kalanı = 300 + 150
        $this->assertSame(450.0, (float) $stats['receivable_amount'], 'alacak toplamı yanlış');

        // Beklenen = henüz kapanmamış faturaların TAM tutarı = 300 + 200
        $this->assertSame(500.0, (float) $stats['expected_revenue'], 'beklenen ciro yanlış');

        $this->assertSame(3, (int) $stats['total_invoices'], 'fatura sayısı yanlış');
        $this->assertSame(50.0, (float) $stats['partial_paid'], 'kısmi ödenen yanlış');
        $this->assertNotNull($bekleyen->id);
    }

    public function test_iptal_edilen_fatura_ciroda_sayilmiyor(): void
    {
        // İptal edilen fatura toplamda kalırsa klinik olmayan bir geliri
        // görür.
        $fatura = $this->faturaKes(['items' => [['description' => 'Iptal', 'quantity' => 1, 'unit_price' => 777]]]);

        $this->olarak($this->doktor)
            ->deleteJson("/api/crm/billing/invoices/{$fatura->id}")
            ->assertOk();

        $stats = $this->olarak($this->doktor)->getJson('/api/crm/billing/stats')->assertOk()->json();

        $this->assertSame(0.0, (float) $stats['expected_revenue'], 'iptal edilen fatura beklenen ciroda kaldı');
        $this->assertSame(0, (int) $stats['total_invoices'], 'iptal edilen fatura sayımda kaldı');
    }

    public function test_baska_klinigin_faturasi_toplamlara_karismiyor(): void
    {
        // Kapsam hatası burada yanlış CİRO olarak görünür — sızıntıdan farklı
        // bir zarar, aynı kökten.
        $yabanciSahip = User::factory()->clinicOwner()->create();
        $yabanciKlinik = Clinic::factory()->create(['owner_id' => $yabanciSahip->id, 'is_crm_active' => true]);
        $yabanciDoktor = User::factory()->doctor()->create([
            'clinic_id'   => $yabanciKlinik->id,
            'is_verified' => true,
        ]);
        $yabanciDoktor->forceFill(['is_crm_active' => true])->save();

        $this->olarak($yabanciDoktor)
            ->postJson('/api/crm/billing/invoices', [
                'patient_id' => $this->hasta->id,
                'items'      => [['description' => 'Yabanci', 'quantity' => 1, 'unit_price' => 9999]],
            ])
            ->assertStatus(201);

        $stats = $this->olarak($this->doktor)->getJson('/api/crm/billing/stats')->assertOk()->json();

        $this->assertSame(0, (int) $stats['total_invoices'], 'başka kliniğin faturası sayıma karıştı');
        $this->assertSame(0.0, (float) $stats['expected_revenue'], 'başka kliniğin faturası ciroya karıştı');
    }
}
