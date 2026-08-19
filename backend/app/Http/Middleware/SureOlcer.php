<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Geçici teşhis: bir isteğin ne kadarı veritabanında geçti?
 *
 * Kara kutu ölçümle bir uçta ~200 ms'nin nerede harcandığı bulunamadı;
 * sorguda mı yoksa PHP'de mi geçtiğini ancak sunucunun içinden görmek
 * mümkün. Bu katman yalnızca SAYI üretir — sorgu metni, parametre veya
 * herhangi bir hasta verisi yanıta yazılmaz.
 *
 * Ortam değişkeni olmadan tamamen kapalıdır ve kapalıyken hiçbir dinleyici
 * bağlamaz. TESLİMDEN ÖNCE KALDIRILACAK.
 */
class SureOlcer
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!config('app.timing_header')) {
            return $next($request);
        }

        $sorguSayisi = 0;
        $sorguMs     = 0.0;

        DB::listen(function (QueryExecuted $olay) use (&$sorguSayisi, &$sorguMs) {
            $sorguSayisi++;
            $sorguMs += $olay->time;
        });

        $basladi = microtime(true);
        $yanit   = $next($request);
        $toplamMs = (microtime(true) - $basladi) * 1000;

        $yanit->headers->set('Server-Timing', sprintf(
            'db;dur=%.1f, app;dur=%.1f, total;dur=%.1f',
            $sorguMs,
            max(0, $toplamMs - $sorguMs),
            $toplamMs,
        ));
        $yanit->headers->set('X-Sorgu-Sayisi', (string) $sorguSayisi);

        return $yanit;
    }
}
