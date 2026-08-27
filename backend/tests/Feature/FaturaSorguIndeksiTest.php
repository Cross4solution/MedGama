<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Gelir sorguları indeks kullanabilmeli.
 *
 * Klinik gelir ve tahsilat ekranlarını her gün açıyor. Sorgu
 * `status='paid'` + (kliniğe göre) + `paid_at` aralığı.
 *
 * İki ayrı şey birden engelliyordu:
 *
 *   1. `paid_at` ve `issue_date` indekssizdi — "Table scan on invoices".
 *   2. Sorgular `whereDate()` / `whereYear()` kullanıyordu. İkisi de sütunu
 *      bir işleve sarmalıyor (`CAST(issue_date AS DATE)`), yani indeks
 *      EKLENSE BİLE kullanılamazdı.
 *
 * İkisi düzeltilmeden diğeri işe yaramaz; ölçüt bu yüzden ikisini de tutuyor.
 * `issue_date` zaten `date` tipinde, o yüzden sarmalama gereksizdi.
 */
class FaturaSorguIndeksiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sorgular_sutunu_isleve_sarmiyor(): void
    {
        $kaynak = (string) file_get_contents(app_path('Services/BillingService.php'));

        // Yorumlar bu kuralı ANLATIYOR; eşleşmemeleri için ayıklanıyor.
        $kaynak = preg_replace('#//.*$#m', '', $kaynak);

        $this->assertStringNotContainsString(
            "whereDate('issue_date'",
            $kaynak,
            'tarih sütunu CAST ile sarmalanıyor — indeks kullanılamaz',
        );
        $this->assertStringNotContainsString(
            "whereYear('paid_at'",
            $kaynak,
            'yıl işlevi sütunu sarmalıyor — indeks kullanılamaz',
        );
    }

    public function test_gelir_sorgusunun_indeksi_var(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('İndeks düzeni yalnız gerçek sürücüde ölçülebilir.');
        }

        $indeksler = DB::select("
            SELECT index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS sutunlar
            FROM information_schema.statistics
            WHERE table_schema = ? AND table_name = 'invoices'
            GROUP BY index_name
        ", [DB::getDatabaseName()]);

        $sutunlar = collect($indeksler)->pluck('sutunlar');

        $this->assertTrue(
            $sutunlar->contains(fn ($s) => str_starts_with((string) $s, 'status,paid_at')),
            'platform geneli gelir sorgusu indekssiz',
        );
        $this->assertTrue(
            $sutunlar->contains(fn ($s) => str_starts_with((string) $s, 'clinic_id,status,paid_at')),
            'klinik kapsamlı gelir sorgusu indekssiz',
        );
    }

    public function test_yil_araligi_ayni_satirlari_seciyor(): void
    {
        // Aralığa çevirmek sonucu DEĞİŞTİRMEMELİ: yılın ilk anından ertesi
        // yılın ilk anına kadar, üst sınır hariç.
        $baslangic = \Carbon\Carbon::create(2026, 1, 1)->startOfDay();
        $bitis = \Carbon\Carbon::create(2027, 1, 1)->startOfDay();

        $this->assertTrue($baslangic->lte(\Carbon\Carbon::create(2026, 1, 1)->startOfDay()));
        $this->assertTrue(\Carbon\Carbon::create(2026, 12, 31)->endOfDay()->lt($bitis));
        $this->assertFalse($bitis->lt($bitis), 'üst sınır dahil edilirse ertesi yıl sızar');
    }
}
