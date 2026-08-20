<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Üretim ortamında yolu tamamen kapatır.
 *
 * API dokümantasyonu için kullanılıyor: canlıda /api/documentation ve /docs
 * herkese açıktı, yani platformun bütün uçları, parametreleri ve veri
 * yapıları saldırgana hazır bir harita olarak sunuluyordu. Saldırının ilk
 * adımı keşiftir.
 *
 * 403 yerine 404 dönüyor: "burada bir şey var ama giremiyorsun" demek, o
 * şeyin varlığını doğrulamak olur. 404 hiçbir şey söylemez.
 */
class UretimdeKapat
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('production')) {
            abort(404);
        }

        return $next($request);
    }
}
