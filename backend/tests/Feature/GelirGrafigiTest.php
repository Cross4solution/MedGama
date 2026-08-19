<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Gelir grafiği — günlük, haftalık, aylık.
 *
 * Haftalık görünüm canlıda veritabanı hatasıyla düşüyordu: sorgu
 * EXTRACT(ISOYEAR ...) kullanıyordu, o birim PostgreSQL'e özgü ve MySQL/TiDB
 * anlamıyor. Aylık görünüm de EXTRACT(MONTH ...) kullandığı için SQLite'ta
 * çalışmıyordu — yani test yazmak mümkün değildi ve hata bu yüzden yıllarca
 * görünmedi.
 *
 * Her iki toplama da artık güne göre yapılıyor (DATE(...) üç sürücüde de
 * aynı), gruplama PHP'de. Bu testler üç görünümün de çalıştığını ve
 * toplamların doğru olduğunu sabitliyor.
 */
class GelirGrafigiTest extends TestCase
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

    private function odenmisFatura(Carbon $odemeTarihi, float $tutar): void
    {
        static $sira = 0;
        $sira++;

        Invoice::create([
            'invoice_number' => 'GG-' . $sira,
            'patient_id'     => User::factory()->patient()->create()->id,
            'doctor_id'      => $this->doktor->id,
            'clinic_id'      => $this->klinik->id,
            'subtotal'       => $tutar,
            'grand_total'    => $tutar,
            'paid_amount'    => $tutar,
            'currency'       => 'EUR',
            'status'         => 'paid',
            'paid_at'        => $odemeTarihi,
            'issue_date'     => $odemeTarihi->toDateString(),
        ]);
    }

    private function grafik(string $donem): array
    {
        return app(BillingService::class)->getRevenueChart($this->doktor, $donem, null, 'EUR');
    }

    public function test_haftalik_gorunum_calisiyor(): void
    {
        $this->odenmisFatura(now(), 100);
        $this->odenmisFatura(now()->subWeeks(2), 250);

        $veri = $this->grafik('weekly');

        // Canlıda bu çağrı 500 veriyordu.
        $this->assertCount(12, $veri, 'Haftalık grafik 12 hafta döndürmeli.');
        $this->assertSame(350.0, array_sum(array_column($veri, 'total')));

        // İki fatura iki AYRI haftaya düşmeli, tek haftada toplanmamalı.
        $doluHaftalar = array_values(array_filter($veri, fn ($h) => $h['total'] > 0));
        $this->assertCount(2, $doluHaftalar);
        $this->assertSame([250.0, 100.0], array_column($doluHaftalar, 'total'));
    }

    public function test_haftalik_bos_haftalari_da_donduruyor(): void
    {
        $this->odenmisFatura(now(), 100);

        $veri = $this->grafik('weekly');

        // Eskiden yalnızca geliri olan haftalar dönüyordu; grafik boş
        // haftaları hiç göstermediği için eğri yanıltıcı oluyordu.
        $bosHafta = array_filter($veri, fn ($h) => $h['total'] === 0.0);
        $this->assertNotEmpty($bosHafta, 'Boş haftalar atlanıyor.');
        $this->assertCount(12, $veri);
    }

    public function test_aylik_gorunum_dogru_topluyor(): void
    {
        $ocak = Carbon::create((int) now()->format('Y'), 1, 15, 12);
        $this->odenmisFatura($ocak, 400);
        $this->odenmisFatura($ocak->copy()->addDays(2), 100);
        $this->odenmisFatura(Carbon::create((int) now()->format('Y'), 3, 10, 12), 700);

        $veri = collect($this->grafik('monthly'))->keyBy('month');

        $this->assertCount(12, $veri);
        $this->assertSame(500.0, $veri[1]['total']);   // ocak: 400 + 100
        $this->assertSame(0.0,   $veri[2]['total']);   // şubat boş
        $this->assertSame(700.0, $veri[3]['total']);
    }

    public function test_gunluk_gorunum_calisiyor(): void
    {
        $this->odenmisFatura(now(), 60);
        $this->odenmisFatura(now()->subDays(3), 40);

        $veri = $this->grafik('daily');

        $this->assertCount(30, $veri);
        $this->assertSame(100.0, array_sum(array_column($veri, 'total')));
    }

    public function test_baska_doktorun_geliri_grafige_girmiyor(): void
    {
        $yabanci = User::factory()->doctor()->create();

        $this->odenmisFatura(now(), 100);
        Invoice::create([
            'invoice_number' => 'GG-YABANCI', 'patient_id' => User::factory()->patient()->create()->id,
            'doctor_id' => $yabanci->id, 'clinic_id' => null, 'subtotal' => 5000, 'grand_total' => 5000,
            'paid_amount' => 5000, 'currency' => 'EUR', 'status' => 'paid', 'paid_at' => now(),
            'issue_date' => now()->toDateString(),
        ]);

        foreach (['daily', 'weekly', 'monthly'] as $donem) {
            $this->assertSame(
                100.0,
                array_sum(array_column($this->grafik($donem), 'total')),
                "{$donem}: başka doktorun geliri sızdı.",
            );
        }
    }
}
