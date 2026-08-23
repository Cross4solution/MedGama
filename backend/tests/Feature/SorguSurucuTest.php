<?php

namespace Tests\Feature;

use App\Support\Sorgu;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Sürücüye göre değişen SQL parçaları.
 *
 * Bu sınıf zaten bir olaydan doğdu: PostgreSQL'e özgü `TO_CHAR` ve `ILIKE`
 * yazımları koda serpilmişti ve dokuz uç canlıda 500 veriyordu. Testlerde de
 * çalışmadıkları için hiç fark edilmemişti.
 *
 * Testler ifadeyi DİZGE OLARAK karşılaştırmıyor — o, kodu kendi kendine
 * doğrulamak olurdu. İfadeler gerçek veritabanında ÇALIŞTIRILIP çıkan değer
 * kontrol ediliyor. Böylece paket hangi sürücüyle koşulursa o sürücüde
 * doğrulanmış oluyor:
 *
 *     php artisan test                          → SQLite
 *     php artisan test -c phpunit.mysql.xml     → MySQL (canlıyla aynı aile)
 */
class SorguSurucuTest extends TestCase
{
    use RefreshDatabase;

    /** Bilinen bir tarihi veritabanına yazıp ifadeyi onun üzerinde çalıştırır. */
    private function ifadeyiCalistir(string $ifade, string $tarih): string
    {
        DB::table('users')->insert([
            'id'         => (string) \Illuminate\Support\Str::uuid(),
            'fullname'   => 'Sorgu Testi',
            'email'      => 'sorgu.testi.' . uniqid() . '@ornek.test',
            'password'   => bcrypt('x'),
            'role_id'    => 'patient',
            'user_level' => 1,
            'created_at' => $tarih,
            'updated_at' => $tarih,
        ]);

        return (string) DB::table('users')
            ->where('fullname', 'Sorgu Testi')
            ->selectRaw("{$ifade} as anahtar")
            ->value('anahtar');
    }

    public function test_ay_anahtari_dogru_uretiliyor(): void
    {
        // Yönetici raporları aylık gruplamayı buna dayandırıyor; yanlış bir
        // anahtar grafiği sessizce kaydırır.
        $this->assertSame(
            '2026-03',
            $this->ifadeyiCalistir(Sorgu::ayIfadesi('created_at'), '2026-03-17 10:30:00'),
        );
    }

    public function test_ay_anahtari_yil_sonunda_da_dogru(): void
    {
        $this->assertSame(
            '2026-12',
            $this->ifadeyiCalistir(Sorgu::ayIfadesi('created_at'), '2026-12-31 23:59:00'),
        );
    }

    public function test_hafta_anahtari_uretiliyor(): void
    {
        // Hafta tanımı sürücüler arasında farklı; ölçüt kesin sayı değil,
        // "YYYY-WW" biçiminde ve makul bir değer üretilmesi.
        $anahtar = $this->ifadeyiCalistir(Sorgu::haftaIfadesi('created_at'), '2026-03-17 10:30:00');

        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}$/', $anahtar, "hafta anahtarı biçimi bozuk: {$anahtar}");
        $this->assertStringStartsWith('2026', $anahtar);
    }

    public function test_benzer_isleci_buyuk_kucuk_harf_duyarsiz(): void
    {
        // Asıl mesele bu: PostgreSQL'de LIKE duyarlı, ILIKE gerekli. Yanlış
        // işleç arama sonuçlarını sessizce boşaltır.
        DB::table('users')->insert([
            'id'         => (string) \Illuminate\Support\Str::uuid(),
            'fullname'   => 'Buyuk Harf Testi',
            'email'      => 'buyuk.harf.' . uniqid() . '@ornek.test',
            'password'   => bcrypt('x'),
            'role_id'    => 'patient',
            'user_level' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $bulunan = DB::table('users')
            ->where('fullname', Sorgu::benzer(), '%buyuk harf%')
            ->count();

        $this->assertSame(1, $bulunan, 'küçük harfle arama büyük harfli kaydı bulamadı');
    }

    public function test_benzer_isleci_gecerli_bir_sql_isleci(): void
    {
        // Yanlış bir işleç adı sorguyu sözdizimi hatasıyla düşürür; bu test
        // onu çalıştırarak doğruluyor.
        $this->assertContains(Sorgu::benzer(), ['like', 'ilike']);

        DB::table('users')->where('fullname', Sorgu::benzer(), '%hicbirsey%')->count();
    }

    public function test_surucuye_ozgu_sql_yalniz_bu_sinifta(): void
    {
        // Sınıfın var oluş sebebi bu kural. `TO_CHAR`/`ILIKE` başka bir yere
        // yazılırsa bir sürücüde sessizce çalışmaz — canlıda dokuz ucu
        // düşüren hata tam olarak buydu.
        $kok = base_path('app');
        $kusurlu = [];

        $gezgin = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($kok));

        foreach ($gezgin as $dosya) {
            if (!$dosya->isFile() || $dosya->getExtension() !== 'php') {
                continue;
            }

            $yol = $dosya->getPathname();

            if (str_ends_with($yol, 'Support/Sorgu.php')) {
                continue;
            }

            foreach (explode("\n", file_get_contents($yol)) as $i => $satir) {
                $kirpik = ltrim($satir);

                // Yorum satırları hariç: bu kuralı ANLATAN açıklamalar da
                // aynı kelimeleri içeriyor.
                if (str_starts_with($kirpik, '//') || str_starts_with($kirpik, '*') || str_starts_with($kirpik, '/*')) {
                    continue;
                }

                if (preg_match("/TO_CHAR\(|'ilike'|\bILIKE\b/i", $satir)) {
                    $kusurlu[] = str_replace(base_path() . '/', '', $yol) . ':' . ($i + 1);
                }
            }
        }

        $this->assertSame(
            [],
            $kusurlu,
            "Sürücüye özgü SQL, Sorgu sınıfı dışında kullanılmış. Bir sürücüde\n"
            . "sessizce çalışmaz — Sorgu::benzer() / Sorgu::ayIfadesi() kullanın:\n  "
            . implode("\n  ", $kusurlu),
        );
    }
}
