<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Teşhis uçları anahtarsız açılmamalı.
 *
 * Depoda beş teşhis ucu var ve hepsi aynı anahtara bakıyor:
 *
 *     /system/init-db          şema onarımı (göç + tohum)
 *     /system/init-db-status   göç günlüğü ve tablo sayıları
 *     /system/mail-status      posta yapılandırması, Resend anahtarının son 4'ü
 *     /system/mail-preview     her şablondan örnek e-posta GÖNDERİR
 *     /system/broadcast-status yayın sürücüsü yapılandırması
 *
 * Kontrolün beş ayrı kopyası vardı ve üçü aynı deliği taşıyordu:
 *
 *     hash_equals('', (string) null) === true      // anahtarsız istek
 *     '' !== ''                       === false     // `?key=` ile
 *
 * `INIT_DB_KEY` varsayılanı depoda yazılı bir sabitken bu görünmüyordu. O sabiti
 * kaldırıp varsayılanı boşaltmak (1992650) init-db'yi kapatırken diğer üçünü
 * SESSİZCE AÇTI — güvenliği artıran bir değişikliğin, tek yerde toplanmamış
 * olduğu için başka üç yeri açması.
 *
 * Kontrol artık tek bir ara katmanda (`teshis.anahtari`) ve kural şu: anahtar
 * tanımsızsa uç yok gibi davranır.
 */
class TeshisUclariTest extends TestCase
{
    use RefreshDatabase;

    private const UCLAR = [
        '/api/system/init-db',
        '/api/system/init-db-status',
        '/api/system/mail-status',
        '/api/system/mail-preview',
        '/api/system/broadcast-status',
    ];

    public function test_anahtar_tanimsizken_hicbiri_acilmiyor(): void
    {
        config(['app.init_db_key' => '']);

        foreach (self::UCLAR as $uc) {
            // Üç biçim de denenmeli: anahtarsız, boş anahtarlı, rastgele.
            foreach (['', '?key=', '?key=rastgele'] as $ek) {
                $yanit = $this->getJson($uc . $ek);

                // 429 da reddetme: `mail-preview` dakikada üç istekle sınırlı
                // ve bu ölçütün kendisi sınırı tüketiyor. Ölçülen şey ucun
                // İÇERİ ALMAMASI; hangi kapının önce kapandığı değil.
                $this->assertContains(
                    $yanit->status(),
                    [403, 404, 429],
                    "$uc$ek anahtar tanımsızken içeri alıyor",
                );
            }
        }
    }

    public function test_yanlis_anahtar_reddediliyor(): void
    {
        config(['app.init_db_key' => 'dogru-anahtar']);

        foreach (self::UCLAR as $uc) {
            foreach (['', '?key=', '?key=yanlis'] as $ek) {
                $this->assertContains(
                    $this->getJson($uc . $ek)->status(),
                    [403, 404, 429],
                    "$uc$ek yanlış anahtarla içeri alıyor",
                );
            }
        }
    }

    public function test_kontrolun_kopyasi_kalmadi(): void
    {
        // Beş kopya olması sorunun kendisiydi: biri düzeltilirken diğerleri
        // geride kaldı. Denetleyicilerde artık kopya olmamalı.
        foreach ([
            'app/Http/Controllers/Api/MailStatusController.php',
            'app/Http/Controllers/Api/MailPreviewController.php',
            'app/Http/Controllers/Api/BroadcastStatusController.php',
        ] as $dosya) {
            $kaynak = (string) file_get_contents(base_path($dosya));

            $this->assertStringNotContainsString(
                'init_db_key',
                $kaynak,
                "$dosya anahtar kontrolünün kendi kopyasını tutuyor",
            );
        }
    }

    public function test_uc_rotalari_ara_katmani_tasiyor(): void
    {
        // Kopyalar kaldırıldığına göre ara katmanın gerçekten bağlı olması şart;
        // aksi halde uçlar tamamen korumasız kalırdı.
        $rotalar = (string) file_get_contents(base_path('routes/api.php'));

        foreach (['mail-status', 'mail-preview', 'broadcast-status'] as $uc) {
            $konum = strpos($rotalar, $uc);

            $this->assertNotFalse($konum, "$uc rotası bulunamadı");
            $this->assertStringContainsString(
                'teshis.anahtari',
                substr($rotalar, $konum, 260),
                "$uc rotası anahtar ara katmanını taşımıyor",
            );
        }
    }
}
