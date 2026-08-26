<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Geo uçları — dışarıya ne gönderdiğimiz ve dışarısı çökünce ne olduğu.
 *
 * `/geo/reverse` ve `/geo/forward` isteği SUNUCUDAN Nominatim'e (OpenStreetMap)
 * yapıyor, tarayıcıdan değil. Kapsamsızdılar ve iki özellikleri hiç
 * doğrulanmamıştı:
 *
 *   • Koordinat üç basamağa YUVARLANIYOR (~100 m) — hastanın tam konumu
 *     üçüncü tarafa gitmesin diye. Veri minimizasyonu bir yorum satırında
 *     duruyordu; bu ölçüt onu davranışa bağlıyor.
 *
 *   • Nominatim çökerse ya da yavaşlarsa uç boş cevap veriyor, hata değil.
 *     Konum bulunamaması, sayfanın çökmesi anlamına gelmemeli.
 *
 * Ayrıca önbellek: Nominatim'in kullanım politikası saniyede bir istek diyor
 * ve aşan IP'yi yasaklıyor. Aynı koordinat iki kez sorulduğunda dışarıya
 * ikinci bir istek gitmemeli.
 */
class GeoUclariTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    public function test_koordinat_ucuncu_tarafa_yuvarlanarak_gidiyor(): void
    {
        Http::fake(['*' => Http::response(['address' => ['country' => 'Türkiye', 'city' => 'İstanbul']], 200)]);

        // Tam koordinat: bir binayı gösterecek hassasiyette.
        $this->getJson('/api/geo/reverse?lat=41.0082376&lon=28.9783589')->assertOk();

        Http::assertSent(function ($istek) {
            $q = $istek->data();

            // Gönderilen değer yuvarlanmış olmalı — ham hassasiyet değil.
            return (string) $q['lat'] === '41.008'
                && (string) $q['lon'] === '28.978';
        });
    }

    public function test_dis_servis_cokunce_uc_hata_vermiyor(): void
    {
        Http::fake(['*' => Http::response('bozuk', 500)]);

        $this->getJson('/api/geo/reverse?lat=41.0&lon=29.0')
            ->assertOk()
            ->assertJson(['country' => null, 'city' => null]);
    }

    public function test_dis_servis_zaman_asiminda_da_hata_vermiyor(): void
    {
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('zaman aşımı'));

        $this->getJson('/api/geo/reverse?lat=41.0&lon=29.0')
            ->assertOk()
            ->assertJson(['country' => null, 'city' => null]);
    }

    public function test_ayni_koordinat_disariya_iki_kez_sorulmuyor(): void
    {
        // Nominatim politikası saniyede bir istek; aşan IP yasaklanıyor.
        Http::fake(['*' => Http::response(['address' => ['country' => 'Türkiye', 'city' => 'İzmir']], 200)]);

        $this->getJson('/api/geo/reverse?lat=38.42&lon=27.14')->assertOk();
        $this->getJson('/api/geo/reverse?lat=38.42&lon=27.14')->assertOk();

        Http::assertSentCount(1);
    }

    public function test_gecersiz_koordinat_reddediliyor(): void
    {
        Http::fake();

        foreach ([['lat' => 95, 'lon' => 0], ['lat' => 0, 'lon' => 200], ['lat' => 'abc', 'lon' => 0]] as $govde) {
            $this->getJson('/api/geo/reverse?' . http_build_query($govde))->assertStatus(422);
        }

        // Geçersiz istek dışarıya hiç çıkmamalı.
        Http::assertNothingSent();
    }

    public function test_konum_degisikligi_kontrolu_oturum_istiyor(): void
    {
        $this->getJson('/api/geo/check')->assertStatus(401);
    }

    public function test_konum_degisikligi_kendi_kaydina_bakiyor(): void
    {
        $kullanici = User::factory()->patient()->create(['country' => 'TR']);
        $jeton = $kullanici->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/geo/check')
            ->assertOk()
            ->assertJsonStructure(['changed']);
    }
}
