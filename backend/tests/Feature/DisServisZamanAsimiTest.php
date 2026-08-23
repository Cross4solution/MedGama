<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Dış servis çağrılarında zaman aşımı — yapısal koruma.
 *
 * Uygulama beş dış servise çıkıyor: çeviri, Daily.co (görüntülü görüşme),
 * Deepgram (yazıya çevirme), Vasco (yapay zekâ) ve coğrafi arama. Bu
 * çağrıların hepsi İSTEK YOLUNDA: bir PHP-FPM işçisi yanıt gelene kadar
 * dolu kalıyor.
 *
 * Bunun bedeli ölçüldü. Toplu çeviri her kaydı sırayla dış servise
 * gönderiyordu; önbelleğe girmemiş 11 kayıt 6,2 saniye sürüyordu ve doğrulama
 * 50 kayda izin veriyordu. Az işçili bir sunucuda birkaç böyle istek havuzu
 * tüketiyor, akışın kendi istekleri zaman aşımına uğruyor ve KULLANICI
 * GÖNDERİLERİN KAYBOLDUĞUNU görüyor.
 *
 * Zaman aşımı verilmezse Laravel'in varsayılanı 30 saniyedir. Sessizdir:
 * kod çalışır, testler geçer, yalnızca dış servis yavaşladığı gün sunucu
 * kilitlenir — ve o gün sebebi aramak günler alır.
 *
 * Bu test bir hatayı değil bir KURALI koruyor: dışarı çıkan her çağrı kendi
 * zaman aşımını söylemeli.
 */
class DisServisZamanAsimiTest extends TestCase
{
    public function test_her_dis_cagri_zaman_asimi_belirtiyor(): void
    {
        $kok = base_path('app');
        $eksik = [];
        $tarananCagri = 0;

        $gezgin = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($kok));

        foreach ($gezgin as $dosya) {
            if (!$dosya->isFile() || $dosya->getExtension() !== 'php') {
                continue;
            }

            $satirlar = explode("\n", file_get_contents($dosya->getPathname()));

            foreach ($satirlar as $i => $satir) {
                if (!str_contains($satir, 'Http::')) {
                    continue;
                }

                // Yorum satırları hariç: bu kuralı ANLATAN açıklamalar da
                // aynı kelimeleri içeriyor.
                $kirpik = ltrim($satir);
                if (str_starts_with($kirpik, '//') || str_starts_with($kirpik, '*') || str_starts_with($kirpik, '/*')) {
                    continue;
                }

                $tarananCagri++;

                // Zincir birkaç satıra yayılabiliyor; noktalı virgüle kadar oku.
                $blok = '';
                for ($j = $i; $j < min($i + 8, count($satirlar)); $j++) {
                    $blok .= ' ' . $satirlar[$j];
                    if (str_contains($satirlar[$j], ';')) {
                        break;
                    }
                }

                if (!str_contains($blok, 'timeout(')) {
                    $eksik[] = str_replace($kok . '/', '', $dosya->getPathname()) . ':' . ($i + 1);
                }
            }
        }

        // Tarama çalışmıyorsa test boşuna yeşil olur.
        $this->assertGreaterThan(5, $tarananCagri, 'dış çağrı taraması çalışmıyor');

        $this->assertSame(
            [],
            $eksik,
            "Zaman aşımı belirtmeyen dış servis çağrısı var. Varsayılan 30 saniye\n"
            . "ve çağrı istek yolunda: dış servis yavaşladığında işçiler dolar ve\n"
            . "sayfa kullanılamaz hâle gelir. `Http::timeout(N)` ekleyin:\n  "
            . implode("\n  ", $eksik),
        );
    }

    public function test_toplu_ceviri_butcesi_makul_bir_deger(): void
    {
        // Bütçe bir işçinin ne kadar tutulabileceğini belirliyor. Çok büyük
        // olursa koruma anlamını yitirir; sıfır olursa çeviri hiç çalışmaz.
        $butce = (float) config('translation.batch_budget');

        $this->assertGreaterThan(0, $butce, 'bütçe sıfır — çeviri hiç çalışmaz');
        $this->assertLessThanOrEqual(15, $butce, 'bütçe çok yüksek — işçi uzun süre tutulabilir');
    }
}
