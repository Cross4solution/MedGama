<?php

namespace Tests\Unit;

use App\Support\DosyaBasligi;
use PHPUnit\Framework\TestCase;

/**
 * İndirme başlığındaki dosya adı.
 *
 * Bulunan hata: ad başlığa `addslashes` ile konuyordu. O yalnız tırnak, ters
 * bölü ve NUL kaçırır. ASCII dışı karakter ham UTF-8 olarak başlığa giriyor
 * ve tarayıcı bozuk okuyordu:
 *
 *     "Kan tahlili şubat.pdf"  →  hastanın diskinde "Kan tahlili ÅŸubat.pdf"
 *
 * Türkçe bir üründe bu olağan durum, istisna değil. Hata sessiz: indirme
 * çalışıyor, sadece dosyanın adı bozuk.
 *
 * Satır sonu da `addslashes`'ten geçiyordu. Gerçek başlık enjeksiyonunu
 * PHP'nin `header()` fonksiyonu engelliyor, ama o noktada indirme tamamen
 * kırılıyor — savunmayı alt katmana bırakmak kırılgan.
 */
class DosyaBasligiTest extends TestCase
{
    public function test_turkce_ad_utf8_olarak_kodlaniyor(): void
    {
        $baslik = DosyaBasligi::uret('attachment', 'Kan tahlili şubat.pdf');

        // RFC 5987: asıl ad `filename*` içinde, yüzde kodlu.
        $this->assertStringContainsString("filename*=utf-8''", $baslik);
        $this->assertStringContainsString('%C5%9Fubat', $baslik, 'ş harfi kodlanmamış');
        $this->assertStringNotContainsString('şubat', $baslik, 'ham UTF-8 başlığa sızdı');
    }

    public function test_eski_tarayicilar_icin_okunur_ascii_yedek_var(): void
    {
        // `filename*` okumayan tarayıcıya bu ad gider. Genel bir ada düşmek
        // yerine Türkçe harfler ASCII karşılığına çevriliyor: hasta hangi
        // belgeyi indirdiğini adından anlayabilmeli.
        $baslik = DosyaBasligi::uret('attachment', 'Kan tahlili şubat.pdf');

        $this->assertStringContainsString('Kan_tahlili_subat.pdf', $baslik);
    }

    public function test_satir_sonu_baslige_giremiyor(): void
    {
        $baslik = DosyaBasligi::uret('attachment', "rapor\r\nX-Injected: evet.pdf");

        $this->assertStringNotContainsString("\r", $baslik);
        $this->assertStringNotContainsString("\n", $baslik);
        $this->assertStringNotContainsString('X-Injected: evet', $baslik);
    }

    public function test_tirnak_ve_ters_boluler_baslikta_kalmiyor(): void
    {
        // Tırnak, `filename="..."` dizgesini erkenden kapatıp geri kalanını
        // ayrı bir parametre gibi gösterebilirdi.
        $baslik = DosyaBasligi::uret('attachment', 'a"b\\c.pdf');

        $this->assertStringNotContainsString('a"b', $baslik);
    }

    public function test_tamamen_ascii_disi_ad_genel_yedege_dusuyor(): void
    {
        // Yedek boş kalırsa Symfony istisna atar ve indirme 500 verir.
        $baslik = DosyaBasligi::uret('attachment', 'مستند.pdf');

        $this->assertStringContainsString('filename=dosya.pdf', $baslik);
        $this->assertStringContainsString("filename*=utf-8''", $baslik);
    }

    public function test_uzantisiz_ve_bos_ad_cokmuyor(): void
    {
        $this->assertStringContainsString('filename=dosya', DosyaBasligi::uret('attachment', 'مستند'));
        $this->assertStringContainsString('filename=dosya', DosyaBasligi::uret('attachment', '...'));
    }

    public function test_inline_turu_korunuyor(): void
    {
        // Sohbet ekleri gömülü gösteriliyor; `attachment`'a çevirmek görselleri
        // sohbetten indirme kutusuna düşürürdü.
        $this->assertStringStartsWith('inline;', DosyaBasligi::uret('inline', 'görsel.png'));
        $this->assertStringStartsWith('attachment;', DosyaBasligi::uret('attachment', 'görsel.png'));
    }

    public function test_cok_uzun_ad_kirpilliyor(): void
    {
        $uzun = str_repeat('a', 400) . '.pdf';
        $baslik = DosyaBasligi::uret('attachment', $uzun);

        // Yedek kırpılıyor; asıl ad `filename*` içinde tam duruyor.
        $this->assertLessThan(200, strlen(explode(';', $baslik)[1]));
    }

    public function test_baslik_gecerli_bir_http_deger(): void
    {
        // Ölçüt: başlık değerinde denetim karakteri olmamalı.
        foreach (['Kan tahlili şubat.pdf', "a\r\nb.pdf", 'مستند.pdf', 'a"b.pdf', '../../etc/passwd'] as $ad) {
            $baslik = DosyaBasligi::uret('attachment', $ad);

            $this->assertSame(
                0,
                preg_match('/[\x00-\x1F\x7F]/', $baslik),
                "denetim karakteri içeriyor: {$ad}",
            );
        }
    }

    public function test_baslik_elle_kurulmuyor(): void
    {
        // Kural iki yerde ayrı ayrı yazılmıştı ve ikisi de aynı şekilde
        // yanlıştı. Biri geri kopyalanırsa o yol sessizce bozuk ada döner.
        $kok = dirname(__DIR__, 2) . '/app';
        $kusurlu = [];

        $gezgin = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($kok));

        foreach ($gezgin as $dosya) {
            if (!$dosya->isFile() || $dosya->getExtension() !== 'php') {
                continue;
            }

            if (str_ends_with($dosya->getPathname(), 'Support/DosyaBasligi.php')) {
                continue;
            }

            foreach (explode("\n", file_get_contents($dosya->getPathname())) as $i => $satir) {
                // Sabit, sunucu tarafından üretilen adlar sorun değil; sorun
                // kullanıcı adının elle başlığa konması.
                if (preg_match('/Content-Disposition.*(addslashes|\$)/', $satir)
                    && !str_contains($satir, 'DosyaBasligi')) {
                    $kusurlu[] = str_replace($kok . '/', '', $dosya->getPathname()) . ':' . ($i + 1);
                }
            }
        }

        $this->assertSame(
            [],
            $kusurlu,
            "Content-Disposition elle kuruluyor — DosyaBasligi::uret() kullanın:\n  " . implode("\n  ", $kusurlu),
        );
    }
}
