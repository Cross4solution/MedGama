<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Herkese açık uçlara önbellek başlığı ekler.
 *
 * Rotalar Laravel'in kendi SetCacheHeaders biçimini kullanıyor:
 * `cache.headers:public;max_age=60`. Laravel middleware parametrelerini
 * YALNIZCA virgülden ayırır, dolayısıyla bu ifadenin tamamı tek parametre
 * olarak gelir. Noktalı virgül burada çözülmezse tür "public" ile eşleşmez ve
 * yanıt no-store olarak çıkar — herkese açık veriler CDN'de hiç tutulmaz,
 * her ziyaretçi isteği PHP'ye ve veritabanına kadar iner.
 */
class CacheHeaders
{
    public function handle(Request $request, Closure $next, string $secenekler = 'private'): Response
    {
        $response = $next($request);

        [$tur, $ayarlar] = $this->coz($secenekler);

        // Bu middleware hem genel API yığınında (varsayılan: private) hem de
        // herkese açık rotalarda ayrıca duruyor. Yanıt aşaması içten dışa
        // döndüğü için genel olan EN SON çalışır ve rotanın kararını ezerdi.
        // Rota açıkça "herkese açık" dediyse dışarıdaki geçer.
        if ($tur === 'private' && $request->attributes->get('onbellek_politikasi') === 'acik') {
            return $response;
        }

        // Yalnızca GET/HEAD önbelleklenebilir; yazan istekler her zaman no-store.
        if ($tur !== 'private' && !$request->isMethodCacheable()) {
            $tur = 'private';
        }

        // Kimliği doğrulanmış isteğin yanıtı kişiye özeldir: aynı adresi
        // paylaşsa bile CDN'de tutulup başkasına verilmemeli.
        if ($tur !== 'private' && $request->user()) {
            $tur = 'private';
        }

        if ($tur === 'public' || $tur === 'static') {
            $request->attributes->set('onbellek_politikasi', 'acik');
        }

        if ($tur === 'public') {
            $tarayici = (int) ($ayarlar['max_age'] ?? 120);
            $cdn      = (int) ($ayarlar['s_maxage'] ?? max($tarayici, 300));
            $response->headers->set(
                'Cache-Control',
                "public, max-age={$tarayici}, s-maxage={$cdn}, stale-while-revalidate=600"
            );
            $this->dileGoreAyristir($response);
        } elseif ($tur === 'static') {
            $tarayici = (int) ($ayarlar['max_age'] ?? 3600);
            $response->headers->set(
                'Cache-Control',
                "public, max-age={$tarayici}, s-maxage=86400, stale-while-revalidate=3600"
            );
        } else {
            $response->headers->set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        }

        return $response;
    }

    /**
     * Paylaşılan önbelleğe "bu yanıt DİLE göre değişir" der.
     *
     * Yanıt gövdesi `Accept-Language`'e göre gerçekten değişiyor: göreli
     * zamanlar ve uzmanlık adları kullanıcının dilinde dönüyor. Ölçüldü —
     * aynı uç, aynı adres:
     *
     *     Accept-Language: tr → "1 gün önce"
     *     Accept-Language: de → "vor 1 Tag"
     *
     * `Vary` başlığı bunu söylemiyordu (yalnız `Accept-Encoding, Origin`).
     * Bugün zararı yok çünkü CDN bu yanıtları hiç önbelleklemiyor (ölçüldü:
     * `cf-cache-status: DYNAMIC` — Cloudflare API JSON'unu varsayılan olarak
     * tutmuyor). Ama önbellek AÇILDIĞI an — ki gecikmeyi düşürmek için
     * yapılacak ilk şey o — Türk kullanıcının yanıtı Alman kullanıcıya
     * servis edilir. Yanlış dil, uçtan, herkese.
     *
     * Önbellek açılmadan ÖNCE söylenmeli; sonra söylemek geç kalır.
     */
    private function dileGoreAyristir(Response $response): void
    {
        $mevcut = array_filter(array_map(
            'trim',
            explode(',', (string) $response->headers->get('Vary', ''))
        ));

        foreach ($mevcut as $deger) {
            if (strcasecmp($deger, 'Accept-Language') === 0) {
                return;
            }
        }

        $mevcut[] = 'Accept-Language';
        $response->headers->set('Vary', implode(', ', $mevcut));
    }

    /**
     * "public;max_age=60" → ['public', ['max_age' => '60']]
     *
     * @return array{0:string,1:array<string,string>}
     */
    private function coz(string $secenekler): array
    {
        $parcalar = array_filter(array_map('trim', explode(';', $secenekler)), fn ($p) => $p !== '');
        $tur = array_shift($parcalar) ?: 'private';

        $ayarlar = [];
        foreach ($parcalar as $parca) {
            if (!str_contains($parca, '=')) {
                $ayarlar[str_replace('-', '_', $parca)] = true;
                continue;
            }
            [$anahtar, $deger] = explode('=', $parca, 2);
            $ayarlar[str_replace('-', '_', trim($anahtar))] = trim($deger);
        }

        return [$tur, $ayarlar];
    }
}
