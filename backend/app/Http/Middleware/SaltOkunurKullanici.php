<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Salt okunur işaretli hesap hiçbir şeyi DEĞİŞTİREMEZ.
 *
 * Tanıtım hesabı için var: müşteri paneli gezsin, ama gösterim sırasında
 * yanlışlıkla bir hastayı silmesin, bir faturayı iptal etmesin, bir hekimin
 * doğrulamasını kaldırmasın.
 *
 * Kural yöntem düzeyinde: GET/HEAD/OPTIONS geçer, gerisi 403. Uçlara tek tek
 * yazılmıyor — öyle olsaydı bugün korunan bir liste yarın eklenen bir uçla
 * eksik kalırdı ve kimse fark etmezdi. Tek istisna çıkış yapmak; kendi
 * oturumunu kapatmak bir veri değişikliği değil ve kapalı olsa hesap
 * oturumda kilitli kalırdı.
 *
 * `api` yığınının tamamına takılı olduğu için kısıt yalnız yönetim panelini
 * değil bütün uygulamayı kapsıyor: salt okunur bir hesap MedStream'de gönderi
 * de paylaşamaz, mesaj da yazamaz.
 */
class SaltOkunurKullanici
{
    /** Yazma sayılmayan uçlar. */
    private const MUAF_YOLLAR = [
        'api/auth/logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $kullanici = $request->user();

        if (!$kullanici || !$kullanici->salt_okunur) {
            return $next($request);
        }

        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        foreach (self::MUAF_YOLLAR as $yol) {
            if ($request->is($yol)) {
                return $next($request);
            }
        }

        // Mesaj isteğin diline göre: panel yabancı bir müşteriye
        // gösterildiğinde arayüz İngilizceyken hatanın Türkçe çıkması,
        // hatayı okunamaz kılıyordu.
        $turkce = app()->getLocale() === 'tr';

        return response()->json([
            'success' => false,
            'message' => $turkce
                ? 'Bu hesap yalnızca görüntüleme içindir; değişiklik yapamaz.'
                : 'This account is view-only and cannot make changes.',
            'code'    => 'SALT_OKUNUR_HESAP',
        ], 403);
    }
}
