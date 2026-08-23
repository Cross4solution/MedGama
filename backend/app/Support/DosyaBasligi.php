<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\HeaderUtils;

/**
 * İndirme başlığı (`Content-Disposition`) — tek karar noktası.
 *
 * Dosya adı kullanıcıdan geliyor ve HTTP başlığına giriyor. İki yerde şöyle
 * yazılmıştı:
 *
 *     'attachment; filename="' . addslashes($ad) . '"'
 *
 * `addslashes` yalnız tırnak, ters bölü ve NUL kaçırır. İki şey kaçırmaz:
 *
 *  • ASCII DIŞI KARAKTER. Başlık değerleri ASCII; Türkçe bir ad ham UTF-8
 *    olarak yazılınca tarayıcı bozuk okur. Hasta "Kan tahlili şubat.pdf"
 *    yerine "Kan tahlili ÅŸubat.pdf" indirir. Türkçe bir üründe bu istisna
 *    değil, olağan durum.
 *
 *  • SATIR SONU. `\r\n` içeren bir ad başlığı böler. Gerçek enjeksiyonu
 *    PHP'nin `header()` fonksiyonu engelliyor ama o noktada indirme
 *    tamamen kırılıyor; savunmayı alt katmana bırakmak kırılgan.
 *
 * Doğrusu RFC 6266/5987: ASCII bir `filename` ve UTF-8 kodlanmış
 * `filename*`. Symfony bunu zaten üretiyor.
 */
class DosyaBasligi
{
    /** Türkçe harflerin ASCII karşılığı — ad yedeğinde okunur kalsın diye. */
    private const HARFLER = [
        'ç' => 'c', 'Ç' => 'C', 'ğ' => 'g', 'Ğ' => 'G', 'ı' => 'i', 'İ' => 'I',
        'ö' => 'o', 'Ö' => 'O', 'ş' => 's', 'Ş' => 'S', 'ü' => 'u', 'Ü' => 'U',
    ];

    /**
     * `Content-Disposition` başlığı üretir.
     *
     * @param string $tur 'attachment' ya da 'inline'
     * @param string $ad  Kullanıcının verdiği dosya adı
     */
    public static function uret(string $tur, string $ad): string
    {
        $ad = self::temizle($ad);

        return HeaderUtils::makeDisposition($tur, $ad, self::asciiYedek($ad));
    }

    /**
     * Gösterilecek adı başlığa konabilir hâle getirir.
     *
     * Symfony `/` ve `\\` içeren bir adı REDDEDİYOR — istisna atıyor, yani
     * indirme 500 veriyor. Ad veritabanından geliyor ve orada ne olduğu
     * garanti değil; yolun yalnız son parçası alınıyor. Denetim karakterleri
     * de burada düşüyor: başlık değerinde yerleri yok.
     */
    private static function temizle(string $ad): string
    {
        $ad = str_replace('\\', '/', $ad);
        $ad = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $ad) ?? $ad;

        $parcalar = array_filter(explode('/', $ad), static fn ($p) => trim($p) !== '' && $p !== '.' && $p !== '..');
        $son = trim((string) end($parcalar));

        return $son !== '' ? $son : 'dosya';
    }

    /**
     * Adın ASCII yedeği.
     *
     * Eski tarayıcılar `filename*` okumaz; onlara bu ad gider. Symfony yedekte
     * `%`, `/` ve `\` kabul etmiyor — ad tamamen elenirse boş bir yedek
     * göndermek yerine genel bir ada düşülür.
     */
    private static function asciiYedek(string $ad): string
    {
        $yedek = strtr($ad, self::HARFLER);
        $yedek = preg_replace('/[^A-Za-z0-9._-]+/', '_', $yedek) ?? '';
        $yedek = trim($yedek, '_');

        // Yalnız uzantı kalmışsa ya da hiçbir şey kalmamışsa ad taşımıyor.
        if ($yedek === '' || str_starts_with($yedek, '.')) {
            $uzanti = pathinfo($ad, PATHINFO_EXTENSION);
            $uzanti = preg_replace('/[^A-Za-z0-9]/', '', $uzanti) ?? '';

            return $uzanti !== '' ? "dosya.{$uzanti}" : 'dosya';
        }

        // Çok uzun adlar bazı tarayıcılarda kırpılıyor; başlığı da şişiriyor.
        return mb_strimwidth($yedek, 0, 120, '');
    }
}
