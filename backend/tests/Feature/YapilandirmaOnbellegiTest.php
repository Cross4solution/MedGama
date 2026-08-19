<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Yapılandırma önbelleği güvenliği.
 *
 * `php artisan config:cache` çalıştığında Laravel .env dosyasını artık
 * okumaz; yapılandırma dosyalarının DIŞINDA kalan her env() çağrısı null
 * döner. Bu sessiz bir kırılmadır: kod hata vermez, yalnızca ayar yokmuş gibi
 * davranır — TURN bilgisi kaybolur ve görüşme kurulamaz, ihlal bildirimi
 * hiçbir yere gitmez, çeviri sağlayıcısı varsayılana düşer.
 *
 * Bu yüzden env() yalnızca config/ altında çağrılabilir. Test bunu bekçi
 * olarak tutuyor: yeni bir env() eklenirse burada yakalanır.
 */
class YapilandirmaOnbellegiTest extends TestCase
{
    public function test_config_disinda_env_cagrisi_yok(): void
    {
        $kok = base_path();
        $klasorler = ['app', 'routes', 'bootstrap', 'database'];

        $bulunanlar = [];

        foreach ($klasorler as $klasor) {
            $yol = $kok . DIRECTORY_SEPARATOR . $klasor;
            if (!is_dir($yol)) {
                continue;
            }

            $gezgin = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($yol));
            foreach ($gezgin as $dosya) {
                if (!$dosya->isFile() || $dosya->getExtension() !== 'php') {
                    continue;
                }

                foreach (file($dosya->getPathname()) as $no => $satir) {
                    // Yorum satırlarında geçen env() açıklama amaçlıdır.
                    $kirpik = ltrim($satir);
                    if (str_starts_with($kirpik, '//') || str_starts_with($kirpik, '*') || str_starts_with($kirpik, '#')) {
                        continue;
                    }
                    if (preg_match('/(?<![\w>$])env\s*\(/', $satir)) {
                        $bulunanlar[] = $klasor . '/' . $dosya->getFilename() . ':' . ($no + 1);
                    }
                }
            }
        }

        $this->assertSame(
            [],
            $bulunanlar,
            "config/ dışında env() çağrısı var. Yapılandırma önbelleğe alındığında bunlar null döner:\n- "
                . implode("\n- ", $bulunanlar)
        );
    }
}
