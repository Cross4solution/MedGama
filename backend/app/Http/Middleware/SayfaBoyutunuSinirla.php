<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * `per_page` üst sınırı — tek istekte tüm tablonun çekilmesini engeller.
 *
 * Otuza yakın liste ucu `per_page` parametresini istemciden olduğu gibi
 * `paginate()` içine veriyordu. Ölçüldü: `?per_page=100000` dört uçta da
 * kabul edildi ve MedStream ucu KİMLİK DOĞRULAMASI İSTEMİYOR — yani herkes
 * tek istekle yüz bin gönderi sorgulatabiliyordu. İki ayrı sonuç:
 *
 *  • Bellek. Yüz bin kayıt, ilişkileriyle birlikte, küçük bir konteynerde
 *    süreci düşürür. Saldırı sayılmaz bile; tek bir merak yeter.
 *  • Toplu veri. Sayfalama bir yavaşlatma katmanıdır; kalkınca hekim ve
 *    klinik listesinin tamamı tek çağrıda dışarı çıkar.
 *
 * Sınır uçlara tek tek yazılmadı: unutulan bir uç sessizce açık kalır ve
 * sonradan eklenen uçlar da kendiliğinden korunmalı.
 *
 * Tavan 1000, çünkü uygulamanın kendisi o kadarını istiyor: tedavi
 * sayfaları hekim ve klinik listesinin tamamını `per_page=1000` ile
 * çekiyor. Ölçülen en büyük gerçek kullanım bu; daha düşük bir tavan
 * çalışan sayfaları bozardı.
 */
class SayfaBoyutunuSinirla
{
    public const UST_SINIR = 1000;

    public function handle(Request $request, Closure $next): Response
    {
        $ham = $request->input('per_page');

        // Parametre yoksa dokunma: ucun kendi varsayılanı geçerli kalsın.
        if ($ham === null || $ham === '') {
            return $next($request);
        }

        $sayi = filter_var($ham, FILTER_VALIDATE_INT);

        // Sayı olmayan değer (`per_page=abc`) sıfıra çevrilip sayfalamayı
        // bozmasın diye en küçük geçerli değere çekiliyor.
        if ($sayi === false || $sayi < 1) {
            $sayi = 1;
        }

        $request->merge(['per_page' => min($sayi, self::UST_SINIR)]);

        return $next($request);
    }
}
