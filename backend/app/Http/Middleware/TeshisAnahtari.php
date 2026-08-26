<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Teşhis uçlarının ortak kapısı.
 *
 * Bu kontrolün beş ayrı kopyası vardı ve üçü aynı deliği taşıyordu: anahtar
 * boşken karşılaştırma GEÇİYORDU.
 *
 *     hash_equals('', (string) null) === true
 *     '' !== ''                       === false   // `?key=` ile
 *
 * `INIT_DB_KEY` varsayılanı depoda yazılı bir sabitken bu görünmüyordu; sabit
 * kaldırılıp varsayılan boşaltılınca (1992650) üç uç sessizce açıldı. Yani
 * güvenliği artıran bir değişiklik, tek bir yerde toplanmamış olduğu için
 * başka üç yeri açtı.
 *
 * Kural: anahtar TANIMSIZSA uç yok gibi davranır. Kapatmayı unutmanın bedeli
 * açık kalmak olmamalı — `demo.enabled` ve init-db için verilen kararın aynısı.
 */
class TeshisAnahtari
{
    public function handle(Request $request, Closure $next): Response
    {
        $anahtar = (string) config('app.init_db_key');

        // 403 değil 404: ucun VARLIĞI bile bilgi verir.
        if ($anahtar === '') {
            abort(404);
        }

        if (!hash_equals($anahtar, (string) $request->query('key'))) {
            abort(404);
        }

        return $next($request);
    }
}
