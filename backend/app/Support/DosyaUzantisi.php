<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;

/**
 * Yüklenen dosyanın diske yazılacak uzantısı.
 *
 * Uzantı istemciden alınıyordu: `$file->getClientOriginalExtension()`. Tür
 * denetimi ise dosyanın İÇERİĞİNDEN türetilen MIME'a bakıyor. İkisi
 * birbirine bağlı değildi, dolayısıyla denetimi geçen bir dosya istediği
 * uzantıyla yazılabiliyordu:
 *
 *     içerik: geçerli bir PNG (MIME image/png → kabul)
 *     ad:     "seyler.html"
 *     disk:   storage/app/public/contact-messages/<id>/<uuid>.HTML
 *
 * Bu dosyalar HERKESE AÇIK diskte duruyor ve doğrudan URL ile sunuluyor.
 * Web sunucusu içerik türünü uzantıdan belirlediği için tarayıcı onu HTML
 * olarak işler: kendi alan adınızda barındırılan, kimlik doğrulaması
 * gerektirmeyen bir sayfa. Kimlik avı için hazır bir zemin.
 *
 * Uzantı artık DOĞRULANMIŞ MIME'dan türetiliyor; istemcinin verdiği ad
 * yalnızca gösterim için saklanıyor.
 */
class DosyaUzantisi
{
    /**
     * MIME → uzantı. Yalnızca uygulamanın kabul ettiği türler.
     *
     * Listede OLMAYAN bir MIME için çağıranın verdiği yedek kullanılır;
     * istemcinin adı hiçbir durumda uzantıyı belirlemez.
     */
    private const ESLEME = [
        'image/jpeg'      => 'jpg',
        'image/pjpeg'     => 'jpg',
        'image/png'       => 'png',
        'image/webp'      => 'webp',
        'image/gif'       => 'gif',
        'image/heic'      => 'heic',
        'image/heif'      => 'heif',
        'application/pdf' => 'pdf',

        'video/mp4'        => 'mp4',
        'video/quicktime'  => 'mov',
        'video/webm'       => 'webm',
        'video/x-matroska' => 'mkv',

        'audio/mpeg'  => 'mp3',
        'audio/wav'   => 'wav',
        'audio/x-wav' => 'wav',
        'audio/ogg'   => 'ogg',
        'audio/webm'  => 'weba',
        'audio/mp4'   => 'm4a',

        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',

        'application/dicom' => 'dcm',
        'text/plain'        => 'txt',
        'text/vtt'          => 'vtt',
    ];

    /**
     * Diske yazılacak güvenli uzantı.
     *
     * @param string $yedek Bilinmeyen MIME için kullanılacak uzantı.
     */
    public static function guvenli(UploadedFile $dosya, string $yedek = 'bin'): string
    {
        $mime = strtolower((string) $dosya->getMimeType());

        return self::ESLEME[$mime] ?? self::yedegiTemizle($yedek);
    }

    /**
     * Yedek uzantı da denetlenmeden geçmiyor: çağıran yanlışlıkla istemciden
     * gelen bir değeri yedek olarak verirse açık geri gelirdi.
     */
    private static function yedegiTemizle(string $yedek): string
    {
        $temiz = strtolower(preg_replace('/[^a-z0-9]/i', '', $yedek) ?? '');

        // Tarayıcının çalıştırdığı ya da işlediği her şey dışarıda.
        $yasakli = ['html', 'htm', 'xhtml', 'shtml', 'svg', 'xml', 'js', 'mjs',
            'php', 'phtml', 'php5', 'phar', 'sh', 'exe', 'bat', 'cmd', 'jsp', 'asp', 'aspx'];

        if ($temiz === '' || in_array($temiz, $yasakli, true)) {
            return 'bin';
        }

        return substr($temiz, 0, 8);
    }
}
