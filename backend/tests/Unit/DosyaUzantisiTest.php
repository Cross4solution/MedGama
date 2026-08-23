<?php

namespace Tests\Unit;

use App\Support\DosyaUzantisi;
use Illuminate\Http\UploadedFile;
use PHPUnit\Framework\TestCase;

/**
 * Diske yazılan uzantı.
 *
 * Bulunan açık: tür denetimi dosyanın İÇERİĞİNDEN türetilen MIME'a bakıyor,
 * ama uzantı istemcinin verdiği ADDAN alınıyordu. İkisi bağlı olmadığı için
 * denetimi geçen bir dosya istediği uzantıyla yazılabiliyordu:
 *
 *     içerik: geçerli PNG   (MIME image/png → kabul)
 *     ad:     "seyler.html"
 *     disk:   storage/app/public/contact-messages/<id>/<uuid>.html
 *
 * O dizin HERKESE AÇIK ve doğrudan URL ile sunuluyor; web sunucusu içerik
 * türünü uzantıdan belirlediği için tarayıcı sayfayı HTML olarak işler.
 * Sonuç: kendi alan adınızda, kimlik doğrulaması gerektirmeyen, saldırganın
 * yazdığı bir sayfa. Kimlik avı için hazır zemin.
 *
 * Yükleme çalışıyor, denetim "geçti" diyor, hiçbir kayıt düşmüyor.
 */
class DosyaUzantisiTest extends TestCase
{
    /** İçeriği gerçekten o türde olan bir dosya üretir. */
    private function dosya(string $ad, string $icerik, string $bildirilenMime): UploadedFile
    {
        $yol = tempnam(sys_get_temp_dir(), 'uzt');
        file_put_contents($yol, $icerik);

        // Son parametre `test: true`: Symfony gerçek yüklemeyi taklit eder ve
        // MIME'ı yine İÇERİKTEN türetir.
        return new UploadedFile($yol, $ad, $bildirilenMime, null, true);
    }

    private function png(string $ad): UploadedFile
    {
        return $this->dosya($ad, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        ), 'image/png');
    }

    public function test_uzanti_icerikten_geliyor_adtan_degil(): void
    {
        // ASIL AÇIK.
        $this->assertSame('png', DosyaUzantisi::guvenli($this->png('seyler.html')));
        $this->assertSame('png', DosyaUzantisi::guvenli($this->png('seyler.svg')));
        $this->assertSame('png', DosyaUzantisi::guvenli($this->png('seyler.php')));
    }

    public function test_dogru_adli_dosya_da_dogru_uzantiyi_aliyor(): void
    {
        // Ters uç: kural her şeyi `bin` yaparsa görseller kırılır.
        $this->assertSame('png', DosyaUzantisi::guvenli($this->png('gercek.png')));
    }

    public function test_pdf_taniniyor(): void
    {
        $pdf = $this->dosya('rapor.html', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n", 'application/pdf');

        $this->assertSame('pdf', DosyaUzantisi::guvenli($pdf));
    }

    public function test_bilinmeyen_tur_cagiranin_yedegine_dusuyor(): void
    {
        $bilinmeyen = $this->dosya('veri.bin', "\x00\x01\x02rastgele", 'application/octet-stream');

        $this->assertSame('mp4', DosyaUzantisi::guvenli($bilinmeyen, 'mp4'));
    }

    public function test_yedek_uzanti_da_denetleniyor(): void
    {
        // Çağıran yanlışlıkla istemciden gelen bir değeri yedek olarak
        // verirse açık geri gelirdi.
        $bilinmeyen = $this->dosya('veri.bin', "\x00\x01\x02rastgele", 'application/octet-stream');

        foreach (['html', 'HTML', 'svg', 'php', 'phtml', 'js', 'exe', 'xml'] as $tehlikeli) {
            $this->assertSame(
                'bin',
                DosyaUzantisi::guvenli($bilinmeyen, $tehlikeli),
                "tehlikeli yedek uzantı geçti: {$tehlikeli}",
            );
        }
    }

    public function test_bicimsiz_yedek_temizleniyor(): void
    {
        $bilinmeyen = $this->dosya('veri.bin', "\x00\x01\x02rastgele", 'application/octet-stream');

        foreach (['', '...', '../../etc', 'a b c'] as $bicimsiz) {
            $uzanti = DosyaUzantisi::guvenli($bilinmeyen, $bicimsiz);

            $this->assertMatchesRegularExpression('/^[a-z0-9]{1,8}$/', $uzanti, "bozuk uzantı üretildi: {$uzanti}");
        }
    }

    public function test_uretilen_uzanti_her_zaman_guvenli_bicimde(): void
    {
        // Ölçüt: uzantı hiçbir durumda yol ayracı, nokta ya da denetim
        // karakteri içermemeli — dosya yolu ondan kuruluyor.
        foreach (['a.html', '../../evil.php', "ad\r\n.png", 'x'] as $ad) {
            $uzanti = DosyaUzantisi::guvenli($this->png($ad));

            $this->assertMatchesRegularExpression('/^[a-z0-9]{1,8}$/', $uzanti, "güvensiz uzantı: {$uzanti}");
        }
    }
}
