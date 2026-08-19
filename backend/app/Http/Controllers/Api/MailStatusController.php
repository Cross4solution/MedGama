<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * E-posta yapılandırmasının canlıda ne gördüğünü bildirir.
 *
 * Neden var: e-posta gönderimi sunucuda sessizce başarısız olduğunda dışarıdan
 * bakınca çalışıyor gibi görünüyor ve barındırma ortamında kabuk erişimi yoksa
 * sebebi öğrenmenin yolu kalmıyor. Tahminle ilerlemek yerine sunucunun okuduğu
 * ayarı doğrudan soruyoruz.
 *
 * HİÇBİR ŞEY GÖNDERMEZ ve gizli değer döndürmez: anahtarın yalnızca tanımlı
 * olup olmadığını ve son dört karakterini bildirir. Böylece "Render değişkeni
 * aldı mı" sorusu, sır sızdırmadan yanıtlanır.
 *
 * Teslimden önce kaldırılmalı.
 */
class MailStatusController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (!hash_equals((string) config('app.init_db_key'), (string) $request->query('key'))) {
            abort(404);
        }

        $anahtar = (string) config('services.resend.key');

        // Sürücü çözümlenebiliyor mu: paket eksikse Laravel burada patlar ve
        // "Unsupported mail transport" der — asıl bilmek istediğimiz bu.
        $surucuHazir = true;
        $surucuHatasi = null;
        try {
            app('mail.manager')->mailer(config('mail.default'));
        } catch (\Throwable $e) {
            $surucuHazir = false;
            $surucuHatasi = $e->getMessage();
        }

        $durum = [
            'mailer'          => config('mail.default'),
            'from_address'    => config('mail.from.address'),
            'from_name'       => config('mail.from.name'),
            'resend_key_set'  => $anahtar !== '',
            'resend_key_tail' => $anahtar !== '' ? '…' . substr($anahtar, -4) : null,
            'driver_ready'    => $surucuHazir,
            'driver_error'    => $surucuHatasi,
            'queue'           => config('queue.default'),
        ];

        // Gönderim yeteneği kaldırıldı. Yapılandırmanın çalıştığı kanıtlandı,
        // dolayısıyla artık gereği yok — ve bu uç, varsayılanı depoda yazılı
        // olan bir anahtarla korunuyor: sunucuda INIT_DB_KEY ayarlanmamışsa
        // depoyu okuyan herkes buradan istediği adrese posta gönderebilirdi.
        // Teşhis için okuma yeter; gönderim bir saldırgana verilecek şey değil.

        return response()->json($durum);
    }
}
