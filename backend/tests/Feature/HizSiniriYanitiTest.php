<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * İstek sınırı aşıldığında dönen yanıt.
 *
 * Canlıda aylardır aralıklı 500 patlamaları görülüyordu ve sebebi
 * bulunamıyordu. Yük altında 90 saniyelik ölçümde hata oranı %80'e çıktı ve
 * istisna sınıfı her seferinde aynı çıktı: HttpResponseException.
 *
 * O istisna bir hata değil — hız sınırlayıcının hazır yanıtını (429) taşıyor.
 * Uygulamanın "her şeyi yakala" bloğu onu da yakalayıp 500'e çeviriyordu.
 * Sonuç: sınırı aşan kullanıcı "sunucu hatası" görüyor, istemci ise yeniden
 * denemesi gerektiğini anlayamıyordu.
 */
class HizSiniriYanitiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('api');
    }

    public function test_sinir_asilinca_500_degil_429_donuyor(): void
    {
        // Sınır dakikada 120; onu aşana kadar aynı ucu çağır.
        $sonKod = null;

        for ($i = 0; $i < 130; $i++) {
            $sonKod = $this->getJson('/api/health')->getStatusCode();

            if ($sonKod === 429) {
                break;
            }
        }

        $this->assertSame(
            429,
            $sonKod,
            "Sınır aşıldığında {$sonKod} döndü. 500 ise kullanıcı sunucu hatası sanır.",
        );
    }

    public function test_sinir_asiminda_yeniden_deneme_bilgisi_veriliyor(): void
    {
        $yanit = null;

        for ($i = 0; $i < 130; $i++) {
            $yanit = $this->getJson('/api/health');

            if ($yanit->getStatusCode() === 429) {
                break;
            }
        }

        $this->assertSame(429, $yanit->getStatusCode());

        // İstemcinin ne zaman tekrar deneyeceğini bilmesi gerekiyor; 500'e
        // çevrildiğinde bu bilgi de kayboluyordu.
        $this->assertNotNull(
            $yanit->headers->get('Retry-After'),
            'Retry-After başlığı yok — istemci ne zaman yeniden deneyeceğini bilemez.',
        );
    }

    public function test_sinir_altinda_istekler_normal_calisiyor(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->getJson('/api/health')->assertOk();
        }
    }
}
