<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Gelir istatistikleri.
 *
 * Bu uç para birimi başına on bir ayrı toplama sorgusu çalıştırıyordu; hepsi
 * tek koşullu toplama sorgusunda birleştirildi. Buradaki asıl risk hız değil
 * DOĞRULUK: yanlış birleştirilmiş bir toplam, kliniğe yanlış gelir gösterir.
 *
 * Bu yüzden testler tek tek her alanı elle hesaplanmış beklenen değerle
 * karşılaştırıyor.
 */
class GelirIstatistikleriTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;
    private Clinic $klinik;

    protected function setUp(): void
    {
        parent::setUp();
        $this->klinik = Clinic::factory()->create();
        $this->doktor = User::factory()->doctor()->create(['clinic_id' => $this->klinik->id]);
    }

    private function fatura(array $ozel): Invoice
    {
        static $sira = 0;
        $sira++;

        return Invoice::create(array_merge([
            'invoice_number' => 'GT-' . $sira,
            'patient_id'     => User::factory()->patient()->create()->id,
            'doctor_id'      => $this->doktor->id,
            'clinic_id'      => $this->klinik->id,
            'subtotal'       => 100,
            'grand_total'    => 100,
            'paid_amount'    => 0,
            'currency'       => 'EUR',
            'status'         => 'pending',
            'issue_date'     => now()->toDateString(),
        ], $ozel));
    }

    private function istatistik(?string $paraBirimi = null): array
    {
        return app(BillingService::class)->getStats($this->doktor, $paraBirimi);
    }

    public function test_tum_alanlar_dogru_hesaplaniyor(): void
    {
        $this->fatura(['status' => 'paid',    'grand_total' => 300, 'paid_amount' => 300, 'paid_at' => now()]);
        $this->fatura(['status' => 'paid',    'grand_total' => 200, 'paid_amount' => 200, 'paid_at' => now()->subMonths(2)]);
        $this->fatura(['status' => 'pending', 'grand_total' => 150]);
        $this->fatura(['status' => 'partial', 'grand_total' => 100, 'paid_amount' => 40]);
        $this->fatura(['status' => 'pending', 'grand_total' => 50, 'due_date' => now()->subDays(5)->toDateString()]);

        $s = $this->istatistik('EUR');

        $this->assertSame(5, $s['total_invoices']);
        $this->assertSame(500.0, $s['total_revenue']);          // 300 + 200
        $this->assertSame(300.0, $s['monthly_revenue']);        // yalnızca bu ay
        $this->assertSame(300.0, $s['today_revenue']);          // yalnızca bugün
        $this->assertSame(200.0, $s['pending_amount']);         // 150 + 50
        $this->assertSame(40.0,  $s['partial_paid']);
        $this->assertSame(60.0,  $s['partial_remaining']);      // 100 − 40
        $this->assertSame(300.0, $s['expected_revenue']);       // 150 + 50 + 100
        $this->assertSame(260.0, $s['receivable_amount']);      // 150 + 50 + 60
        $this->assertSame(1,     $s['overdue_count']);          // vadesi geçen tek fatura
    }

    public function test_para_birimleri_birbirine_karismiyor(): void
    {
        $this->fatura(['currency' => 'EUR', 'status' => 'paid', 'grand_total' => 100, 'paid_amount' => 100, 'paid_at' => now()]);
        $this->fatura(['currency' => 'TRY', 'status' => 'paid', 'grand_total' => 900, 'paid_amount' => 900, 'paid_at' => now()]);
        $this->fatura(['currency' => 'TRY', 'status' => 'pending', 'grand_total' => 500]);

        $eur = $this->istatistik('EUR');
        $try = $this->istatistik('TRY');

        // Euro ile lira toplanırsa klinik gerçekte olmayan bir gelir görür.
        $this->assertSame(100.0, $eur['total_revenue']);
        $this->assertSame(1, $eur['total_invoices']);

        $this->assertSame(900.0, $try['total_revenue']);
        $this->assertSame(2, $try['total_invoices']);
        $this->assertSame(500.0, $try['pending_amount']);

        $this->assertSame(['EUR', 'TRY'], $eur['available_currencies']);

        $ozet = collect($eur['by_currency'])->keyBy('currency');
        $this->assertSame(100.0, $ozet['EUR']['total_revenue']);
        $this->assertSame(900.0, $ozet['TRY']['total_revenue']);
        $this->assertSame(500.0, $ozet['TRY']['receivable_amount']);
    }

    public function test_baska_doktorun_faturasi_sayilmiyor(): void
    {
        $yabanci = User::factory()->doctor()->create();

        $this->fatura(['status' => 'paid', 'grand_total' => 100, 'paid_amount' => 100, 'paid_at' => now()]);
        $this->fatura(['status' => 'paid', 'grand_total' => 999, 'paid_amount' => 999, 'paid_at' => now(), 'doctor_id' => $yabanci->id, 'clinic_id' => null]);

        // Tek sorguya taşınırken rol kapsaması düşerse bir klinik başkasının
        // cirosunu görürdü.
        $this->assertSame(100.0, $this->istatistik('EUR')['total_revenue']);
    }

    public function test_faturasi_olmayan_bos_kabuk_donuyor(): void
    {
        $s = $this->istatistik();

        $this->assertSame([], $s['available_currencies']);
        $this->assertSame(0, $s['total_invoices']);
        $this->assertSame(0, $s['total_revenue']);
    }

    public function test_tek_sorguya_indi(): void
    {
        foreach (['EUR', 'TRY', 'USD'] as $cur) {
            $this->fatura(['currency' => $cur, 'status' => 'paid', 'grand_total' => 100, 'paid_amount' => 100, 'paid_at' => now()]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->istatistik('EUR');
        $sorgu = count(DB::getQueryLog());
        DB::disableQueryLog();

        // Üç para biriminde eskiden 21 sorgu çalışıyordu. Para birimi sayısı
        // arttıkça sorgu sayısı ARTMAMALI.
        $this->assertLessThanOrEqual(
            3,
            $sorgu,
            "Gelir istatistiği {$sorgu} sorgu çalıştırdı; tek toplama sorgusuna inmesi bekleniyordu.",
        );
    }
}
