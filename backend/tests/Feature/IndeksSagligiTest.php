<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Şema sağlığı — indeksler.
 *
 * Her indeksin bir bedeli var ve o bedel YAZMADA ödeniyor: her INSERT ve her
 * UPDATE bütün indeksleri güncelliyor. Okumaya katkısı olmayan bir indeks
 * saf maliyettir.
 *
 * Ölçüldüğünde 303 indeksin 32'si böyleydi — ya birebir kopya ya da daha
 * geniş bir indeksin öneki. `appointments` gibi sıcak bir tabloda
 * `appointment_date` ve `status` iki ayrı adla iki kez indekslenmişti;
 * muhtemelen iki göç aynı işi ayrı ayrı yapmış. Kimse fark etmez, çünkü
 * hiçbir şey bozulmaz — yalnız her yazma biraz daha yavaşlar.
 *
 * Ölçüt YALNIZ MySQL'de anlamlı: SQLite indeksleri farklı üretiyor ve canlıda
 * TiDB (MySQL protokolü) var.
 */
class IndeksSagligiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('İndeks düzeni yalnız gerçek sürücüde ölçülebilir.');
        }
    }

    /** @return array<int, array{tablo: string, indeks: string, sutunlar: string}> */
    private function indeksler(): array
    {
        return DB::select("
            SELECT table_name AS tablo, index_name AS indeks, non_unique AS benzersizDegil,
                   GROUP_CONCAT(column_name ORDER BY seq_in_index) AS sutunlar
            FROM information_schema.statistics
            WHERE table_schema = ?
            GROUP BY table_name, index_name, non_unique
        ", [DB::getDatabaseName()]);
    }

    public function test_ayni_sutun_kumesi_iki_kez_indekslenmiyor(): void
    {
        $gruplar = [];
        foreach ($this->indeksler() as $i) {
            $gruplar[$i->tablo . '|' . $i->sutunlar][] = $i->indeks;
        }

        $kopyalar = [];
        foreach ($gruplar as $anahtar => $adlar) {
            if (count($adlar) > 1) {
                $kopyalar[] = $anahtar . ' → ' . implode(', ', $adlar);
            }
        }

        $this->assertSame([], $kopyalar, "Aynı sütun kümesi birden çok kez indekslenmiş:\n  " . implode("\n  ", $kopyalar));
    }

    public function test_daha_genis_bir_indeksin_oneki_olan_indeks_yok(): void
    {
        // Önek olan indeks hiçbir sorguya katkı sağlamaz: veritabanı geniş
        // olanı zaten kullanabiliyor. Benzersizlik kısıtları hariç — onlar
        // performans için değil, bir kural taşıyor.
        $hepsi = $this->indeksler();
        $fazla = [];

        foreach ($hepsi as $a) {
            if (!$a->benzersizDegil) {
                continue;
            }

            foreach ($hepsi as $b) {
                if ($a->tablo !== $b->tablo || $a->indeks === $b->indeks) {
                    continue;
                }

                if (str_starts_with((string) $b->sutunlar, $a->sutunlar . ',')) {
                    $fazla[] = "{$a->tablo}.{$a->indeks} ({$a->sutunlar}) ⊂ {$b->indeks}";
                    break;
                }
            }
        }

        $this->assertSame([], $fazla, "Daha geniş bir indeksin öneki olan indeksler:\n  " . implode("\n  ", $fazla));
    }

    public function test_saglik_denetim_kaydi_kaynak_uzerinden_indeksli(): void
    {
        /*
         * Klinik analitiği bu tabloyu `resource_type` + `resource_id` +
         * tarih aralığıyla sorguluyor. İndeks yokken EXPLAIN "Table scan"
         * diyordu.
         *
         * Tablo sağlık verisine her erişimde büyüyor, yani asla küçülmüyor.
         * Bugün üç yüz satırda fark edilmez; milyonlarda ekranı durdurur.
         */
        $indeksler = collect($this->indeksler())
            ->where('tablo', 'health_data_audit_logs')
            ->pluck('sutunlar');

        $kaynakla = $indeksler->first(
            fn ($sutunlar) => str_starts_with((string) $sutunlar, 'resource_type,resource_id'),
        );

        $this->assertNotNull(
            $kaynakla,
            'health_data_audit_logs kaynak üzerinden indekssiz — analitik ekranı tam tablo tarıyor',
        );
    }
}
