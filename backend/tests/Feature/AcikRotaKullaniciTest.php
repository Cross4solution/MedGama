<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Kalıcı savunma: auth ara katmanı olmayan bir rota, denetleyicisinde
 * kullanıcıya bakmamalı.
 *
 * Gerçek olay (/api/translation/status): rota düz açık bırakılmıştı, ama
 * denetleyici $request->user() okuyordu. Jeton gönderilse bile o null
 * geliyordu; uç 401 vermediği için hata sessizdi ve GİRİŞ YAPMIŞ HERKESE
 * "içerik çevirisi kapalı" diyordu. Tercih doğru kaydediliyor, ekran hiç
 * öğrenemiyordu.
 *
 * Bir uç hem misafire açık olup hem kullanıcıya bakacaksa çözüm
 * `optional.auth`: 401 vermez ama jeton varsa kullanıcıyı çözer.
 *
 * Bu test bilinçli olarak KAYNAK KODU okuyor. Rotayı tek tek çağırmak
 * her ucun kendi verisini kurmayı gerektirirdi; aranan şey davranış değil,
 * yapısal bir tutarsızlık.
 */
class AcikRotaKullaniciTest extends TestCase
{
    /**
     * Rotayı kullanıcı çözebilen ara katmanlar.
     *
     * Hem ham takma adlar hem sınıf adları listede: gatherMiddleware() takma
     * adı ('auth:sanctum') olduğu gibi döndürüyor, route:list ise sınıfa
     * çözüyor. Yalnız sınıf adlarına bakmak korunan rotaları kusurlu sayar.
     */
    private const KORUMA = [
        'auth',                // auth:sanctum + optional.auth (ikisi de çözer)
        'signed',              // imzalı bağlantı: kimlik bağlantının içinde
        'verified',
        'Authenticate',
        'OptionalAuth',
        'ValidateSignature',
        'EnsureEmailIsVerified',
    ];

    /**
     * Bilinerek muaf tutulanlar.
     *
     * Buraya bir rota eklemek, "bu uç kullanıcıyı okuyor ama null gelmesi
     * SORUN DEĞİL" demektir — yani null hâli için doğru bir davranışı var.
     * Gerekçesiz ekleme yapılmamalı.
     */
    private const MUAF = [
        // Giriş/kayıt: kullanıcıyı kendisi üretir, isteğin sahibi yoktur.
        'api/login',
        'api/register',
    ];

    public function test_acik_rotalar_kullaniciya_bakmiyor(): void
    {
        $kusurlu = [];

        foreach (Route::getRoutes() as $rota) {
            $uri = $rota->uri();

            if (in_array($uri, self::MUAF, true)) {
                continue;
            }

            foreach ($rota->gatherMiddleware() as $ara) {
                foreach (self::KORUMA as $k) {
                    if (str_contains((string) $ara, $k)) {
                        continue 3;
                    }
                }
            }

            $govde = $this->denetleyiciGovdesi($rota->getActionName());

            if ($govde !== null && preg_match('/\$request->user\(\)|auth\(\)->user\(\)|Auth::user\(\)/', $govde)) {
                $kusurlu[] = $rota->methods()[0] . ' ' . $uri . '  →  ' . $rota->getActionName();
            }
        }

        $this->assertSame(
            [],
            $kusurlu,
            "Auth ara katmanı olmayan rota kullanıcıya bakıyor; \$request->user() daima null gelir.\n"
            . "Misafire de açık kalması gerekiyorsa 'optional.auth' ekleyin:\n  "
            . implode("\n  ", $kusurlu),
        );
    }

    /** "Sinif@metot" biçimindeki eylemin gövde kaynağını döndürür. */
    private function denetleyiciGovdesi(string $eylem): ?string
    {
        if (!str_contains($eylem, '@')) {
            return null; // kapanış rotası: kaynağı bu yolla okunmuyor
        }

        [$sinif, $metot] = explode('@', $eylem, 2);

        if (!class_exists($sinif) || !method_exists($sinif, $metot)) {
            return null;
        }

        $yansima = new ReflectionMethod($sinif, $metot);
        $dosya = $yansima->getFileName();

        if (!$dosya || !is_readable($dosya)) {
            return null;
        }

        $satirlar = file($dosya);
        $bas = $yansima->getStartLine() - 1;
        $son = $yansima->getEndLine();

        return implode('', array_slice($satirlar, $bas, $son - $bas));
    }
}
