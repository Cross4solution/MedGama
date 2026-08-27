<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Randevu listeleri sıralamayı indeksten almalı, elle sıralamamalı.
 *
 * Hacim testinde bulundu ve tek başına bu testi haklı çıkarıyor: 8 MB'lık
 * geliştirme verisinde her şey hızlıydı, 1.000.000 randevuda hekimin kendi
 * listesi — ürünün en sık açılan ekranı — 813 ms sürdü.
 *
 * Sebep indeks yokluğu değil, YANLIŞ indeks. Sorgu `doctor_id`'ye göre
 * süzüp `created_at`'e göre sıralıyor; mevcut indeks `(doctor_id,
 * appointment_date)` olduğu için veritabanı 9.954 satırı okuyup belleğe
 * alıyor, elle sıralıyor, ilk 20'sini veriyordu. 9.934 satır boşa okunuyordu.
 *
 * `(doctor_id, deleted_at, created_at)` ile satırlar zaten sıralı geliyor ve
 * yirmi satır okunup duruluyor: 813 ms → 9 ms.
 *
 * Ölçüt sütun sırasını tutuyor, yalnız indeksin varlığını değil. Sıra bozulursa
 * indeks durur ama sıralamaya hiçbir katkısı kalmaz — ve yavaşlama sessizdir:
 * hiçbir şey hata vermez, ekran yalnız gitgide geç açılır.
 */
class RandevuListesiSiralamaIndeksiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('İndeks düzeni yalnız gerçek sürücüde ölçülebilir.');
        }
    }

    /** @return array<string,string> indeks adı → sütunlar */
    private function indeksler(): array
    {
        $satirlar = DB::select("
            SELECT index_name AS ad, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS sutunlar
            FROM information_schema.statistics
            WHERE table_schema = ? AND table_name = 'appointments'
            GROUP BY index_name
        ", [DB::getDatabaseName()]);

        return collect($satirlar)->pluck('sutunlar', 'ad')->all();
    }

    public static function listeler(): array
    {
        return [
            'hekimin listesi'  => ['doctor_id'],
            'hastanın listesi' => ['patient_id'],
            'kliniğin listesi' => ['clinic_id'],
        ];
    }

    /** @dataProvider listeler */
    public function test_liste_siralamasi_indeksten_geliyor(string $sutun): void
    {
        $beklenen = "{$sutun},deleted_at,created_at";

        $this->assertContains(
            $beklenen,
            array_values($this->indeksler()),
            "`{$sutun}` listesi sıralamayı indeksten alamıyor. Veritabanı bütün "
            . "satırları okuyup elle sıralar; bu hacim büyüdükçe sessizce yavaşlar.",
        );
    }

    public function test_siralama_sutunu_indeksin_SONUNDA(): void
    {
        /*
         * Sıra önemli: `(created_at, doctor_id, deleted_at)` gibi bir indeks
         * de "var" görünür ama işe yaramaz — süzgeç sütunları önce gelmeli,
         * sıralama sütunu sonra. Bu ölçüt indeksin varlığını değil, DOĞRU
         * sırada olduğunu tutuyor.
         */
        foreach (['doctor_id', 'patient_id', 'clinic_id'] as $sutun) {
            $uygun = collect($this->indeksler())->contains(
                fn ($sutunlar) => str_starts_with((string) $sutunlar, $sutun)
                    && str_ends_with((string) $sutunlar, 'created_at'),
            );

            $this->assertTrue($uygun, "`{$sutun}` indeksinde sıralama sütunu sonda değil");
        }
    }
}
