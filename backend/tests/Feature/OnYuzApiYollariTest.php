<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Ön yüz API istemcisindeki yollar gerçekten var mı.
 *
 * `src/lib/api.js` 277 çağrı tanımlıyor. Bir yol yanlış yazılırsa ya da arka
 * uçta rota adı değişirse istek 404 döner — ve bu SESSİZDİR: çağrıların
 * çoğu `catch` ile yutuluyor, ekran boş liste ya da hiçbir tepki gösteriyor.
 * Kullanıcı özelliğin çalışmadığını görür, kimse sebebini bilmez.
 *
 * Tarama iki tarafı karşılaştırıyor: istemcideki yollar ile kayıtlı rotalar.
 * Şablon değişkenleri (`${id}`) ve rota parametreleri (`{id}`) eşleştiriliyor.
 *
 * Test arka uçta duruyor çünkü rota listesi yalnız burada var.
 */
class OnYuzApiYollariTest extends TestCase
{
    /**
     * Arka uçta KARŞILIĞI OLMAYAN, bilinen istemci yolları.
     *
     * İkisi de ölçüldü: `api.js` tanımlıyor, hiçbir ekran ÇAĞIRMIYOR ve arka
     * uçta rota yok. Yani bugün kırık bir şey yok — ama şube atama ekranını
     * yazan kişi bunları çağırdığında 404 alacak ve sebebi görünmeyecek.
     *
     * Liste bilerek küçük: buraya yeni bir yol eklemek, "bu uç henüz yazılmadı"
     * demenin açık yolu. Sessizce büyümesin diye test ediliyor.
     */
    private const YAZILMAMIS = [
        'branches/X/assign-clinic',
        'branches/X/assign-doctor',

        // Google ile giriş: ön yüzde üç ekranda kablolanmış (LoginPage,
        // DoctorLogin, LoginForm) ama arka uçta rota YOK — ölçüldü.
        //
        // Bugün UYKUDA: `REACT_APP_GOOGLE_CLIENT_ID` tanımsız ve kod
        // `if (!clientId) return;` ile çıkıyor, düğme hiç kurulmuyor. O
        // değişken tanımlandığı an akış açılıyor ve `if (!resp.ok) return;`
        // yüzünden SESSİZCE başarısız oluyor: kullanıcı Google penceresini
        // tamamlıyor, sonra hiçbir şey olmuyor — hata bile görmüyor.
        //
        // Ya uç yazılmalı ya arayüz kaldırılmalı; anahtar tanımlanmadan ÖNCE.
        'login/google',
    ];

    /** `api.js` içindeki çağrı yollarını çıkarır. */
    private function istemciYollari(): array
    {
        $dosya = base_path('../src/lib/api.js');

        if (!is_file($dosya)) {
            $this->markTestSkipped('src/lib/api.js bulunamadı (arka uç tek başına kopyalanmış olabilir).');
        }

        preg_match_all(
            '/api\.(?:get|post|put|patch|delete)\(\s*[`\'"]([^`\'"]+)[`\'"]/',
            file_get_contents($dosya),
            $eslesme,
        );

        $hamYollar = $eslesme[1];

        // Ekranlardaki HAM `fetch` çağrıları da taranıyor.
        //
        // İlk hâli yalnız `api.js` içindeki `api.get/post/...` çağrılarına
        // bakıyordu ve Google giriş ucunu KAÇIRDI: o çağrı bir ekranda,
        // `fetch(API_BASE + '/api/login/google')` biçiminde duruyor.
        foreach (['screens/*.jsx', 'components/auth/*.jsx'] as $desen) {
            foreach (glob(base_path('../src/' . $desen)) as $ekran) {
                preg_match_all(
                    '#[\'"](/api/[a-zA-Z0-9\-_/]+)[\'"]#',
                    file_get_contents($ekran),
                    $ekranEslesme,
                );
                $hamYollar = array_merge($hamYollar, $ekranEslesme[1]);
            }
        }

        $yollar = [];

        foreach ($hamYollar as $ham) {
            $yol = ltrim(explode('?', $ham)[0], '/');
            $yol = preg_replace('#^api/#', '', $yol);
            // Şablon değişkeni: `/doctors/${id}/reviews` → `doctors/X/reviews`
            $yol = preg_replace('/\$\{[^}]*\}/', 'X', $yol);

            if ($yol !== '') {
                $yollar[$yol] = true;
            }
        }

        return array_keys($yollar);
    }

    /** Kayıtlı `api/...` rotalarının eşleştirme kalıpları. */
    private function rotaKaliplari(): array
    {
        $kaliplar = [];

        foreach (Route::getRoutes() as $rota) {
            if (!str_starts_with($rota->uri(), 'api/')) {
                continue;
            }

            $govde = substr($rota->uri(), 4);
            $kaliplar[] = '#^' . preg_replace('/\\\{[^}]+\\\}/', '[^/]+', preg_quote($govde, '#')) . '$#';
        }

        return array_unique($kaliplar);
    }

    public function test_istemcideki_her_yol_bir_rotaya_karsilik_geliyor(): void
    {
        $yollar = $this->istemciYollari();
        $kaliplar = $this->rotaKaliplari();

        // Tarama çalışmıyorsa test boşuna yeşil olur.
        $this->assertGreaterThan(150, count($yollar), 'api.js taraması çalışmıyor');
        $this->assertGreaterThan(100, count($kaliplar), 'rota taraması çalışmıyor');

        $eslesmeyen = [];

        foreach ($yollar as $yol) {
            foreach ($kaliplar as $kalip) {
                if (preg_match($kalip, $yol)) {
                    continue 2;
                }
            }

            if (!in_array($yol, self::YAZILMAMIS, true)) {
                $eslesmeyen[] = $yol;
            }
        }

        $this->assertSame(
            [],
            $eslesmeyen,
            "Ön yüz, arka uçta olmayan bir uca istek atıyor. 404 döner ve çağrı\n"
            . "`catch` ile yutulduğu için ekranda sessizce hiçbir şey olmaz:\n  "
            . implode("\n  ", $eslesmeyen),
        );
    }

    public function test_yazilmamis_listesi_gercekten_yazilmamis(): void
    {
        // Uç sonradan yazıldığında liste küçülmeli; ölü kayıtlar listeyi
        // zamanla anlamsız bir muafiyet torbasına çevirir.
        $kaliplar = $this->rotaKaliplari();
        $artikVar = [];

        foreach (self::YAZILMAMIS as $yol) {
            foreach ($kaliplar as $kalip) {
                if (preg_match($kalip, $yol)) {
                    $artikVar[] = $yol;
                    break;
                }
            }
        }

        $this->assertSame(
            [],
            $artikVar,
            'Bu uçlar artık yazılmış; YAZILMAMIS listesinden çıkarın: ' . implode(', ', $artikVar),
        );
    }
}
