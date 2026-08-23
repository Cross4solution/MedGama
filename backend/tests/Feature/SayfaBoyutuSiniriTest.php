<?php

namespace Tests\Feature;

use App\Http\Middleware\SayfaBoyutunuSinirla;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * `per_page` üst sınırı.
 *
 * Otuza yakın liste ucu istemcinin verdiği `per_page` değerini doğrudan
 * `paginate()` içine geçiriyordu. Ölçüldü — dördü de kabul etti:
 *
 *     GET /api/medstream/posts?per_page=100000   → per_page 100000
 *     GET /api/notifications?per_page=100000     → per_page 100000
 *     GET /api/appointments?per_page=100000      → per_page 100000
 *     GET /api/clinics?per_page=100000           → per_page 100000
 *
 * MedStream ucu kimlik doğrulaması istemiyor: bunu yapmak için hesap bile
 * gerekmiyordu. İki sonuç — yüz bin kaydın ilişkileriyle belleğe alınması,
 * ve sayfalamanın toplu veri çekmeye karşı sağladığı sürtünmenin kalkması.
 *
 * Sınır ara katmanda, uçlarda değil: unutulan bir uç sessizce açık kalır ve
 * sonradan eklenen uçlar da kendiliğinden korunmalı.
 */
class SayfaBoyutuSiniriTest extends TestCase
{
    use RefreshDatabase;

    /** Yanıtın neresinde olursa olsun `per_page` değerini bulur. */
    private function boyut(array $govde): ?int
    {
        $bul = function ($dizi) use (&$bul) {
            foreach ($dizi as $anahtar => $deger) {
                if ($anahtar === 'per_page' && is_numeric($deger)) {
                    return (int) $deger;
                }
                if (is_array($deger) && ($sonuc = $bul($deger)) !== null) {
                    return $sonuc;
                }
            }

            return null;
        };

        return $bul($govde);
    }

    public function test_herkese_acik_akis_yuz_bin_kayit_vermiyor(): void
    {
        // Hesap gerekmiyor — sınır kalkarsa bu tek satır yeterliydi.
        $yanit = $this->getJson('/api/medstream/posts?per_page=100000')->assertOk();

        $this->assertSame(SayfaBoyutunuSinirla::UST_SINIR, $this->boyut($yanit->json()));
    }

    public function test_kimlikli_liste_uclari_da_sinirli(): void
    {
        $hasta = User::factory()->patient()->create();

        foreach (['/api/notifications', '/api/appointments'] as $uc) {
            $yanit = $this->actingAs($hasta, 'sanctum')->getJson($uc . '?per_page=100000')->assertOk();

            $this->assertSame(
                SayfaBoyutunuSinirla::UST_SINIR,
                $this->boyut($yanit->json()),
                "{$uc} sınırsız sayfa boyutu kabul ediyor",
            );
        }
    }

    public function test_uygulamanin_kendi_istedigi_boyut_bozulmuyor(): void
    {
        // Ters uç: tedavi sayfaları hekim ve klinik listesinin tamamını
        // `per_page=1000` ile çekiyor. Tavan bunun altına inerse çalışan
        // sayfalar sessizce eksik veriyle üretilir.
        $yanit = $this->getJson('/api/clinics?per_page=1000')->assertOk();

        $this->assertSame(1000, $this->boyut($yanit->json()));
    }

    public function test_makul_boyutlara_dokunulmuyor(): void
    {
        $yanit = $this->getJson('/api/clinics?per_page=20')->assertOk();

        $this->assertSame(20, $this->boyut($yanit->json()));
    }

    public function test_bozuk_deger_sayfalamayi_kirmiyor(): void
    {
        // `per_page=abc` ya da `0` sıfır boyutlu sayfalama demek olurdu:
        // Laravel bunu ya hata verir ya da tüm kayıtları döndürür.
        foreach (['abc', '0', '-5', '1e9'] as $deger) {
            $yanit = $this->getJson("/api/clinics?per_page={$deger}")->assertOk();
            $boyut = $this->boyut($yanit->json());

            $this->assertGreaterThanOrEqual(1, $boyut, "per_page={$deger} geçersiz boyut üretti");
            $this->assertLessThanOrEqual(SayfaBoyutunuSinirla::UST_SINIR, $boyut);
        }
    }

    public function test_sinir_api_yiginina_bagli(): void
    {
        // Yapısal koruma: ara katmanı yığından düşürmek tek satır ve davranış
        // testleri yalnız sınadıkları uçları korur.
        // Rota `api` grubunu adıyla taşıyor; sınıflar grubun içinde.
        $grup = app('router')->getMiddlewareGroups()['api'] ?? [];

        $this->assertContains(
            SayfaBoyutunuSinirla::class,
            $grup,
            'sayfa boyutu sınırı API yığınından düşmüş',
        );

        $rota = collect(Route::getRoutes())->first(fn ($r) => $r->uri() === 'api/clinics');
        $this->assertNotNull($rota, 'api/clinics rotası bulunamadı');
        $this->assertContains('api', $rota->gatherMiddleware(), 'liste ucu api grubunda değil');
    }
}
