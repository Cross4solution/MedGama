<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * API belgelendirmesi üretimde kapalı kalmalı.
 *
 * `/api/documentation` Swagger arayüzünü açıyor: bütün uçlar, parametreleri,
 * yanıt biçimleri ve hangi rolün neye eriştiği tek sayfada. Geliştirirken
 * değerli, canlıda saldırı yüzeyinin haritası.
 *
 * Dört rota (`api`, `asset`, `docs`, `oauth2_callback`) `UretimdeKapat` ara
 * katmanını taşıyor ve üretimde 404 veriyor. Ölçüt bu üç şeyi birden tutuyor:
 * ara katmanın davranışını, dört rotaya da bağlı olduğunu, ve üretim dışında
 * hâlâ çalıştığını — kapatmanın fazlası belgelendirmeyi tümüyle öldürürdü.
 *
 * `oauth2-callback` bu grubun parçası; uygulama kimlik doğrulamasıyla ilgisi
 * yok, Swagger arayüzünün kendi yönlendirme yardımcısı.
 */
class ApiBelgelendirmesiTest extends TestCase
{
    use RefreshDatabase;

    private const ROTALAR = [
        'api/documentation',
        'api/oauth2-callback',
    ];

    public function test_uretimde_kapali(): void
    {
        $this->app['env'] = 'production';

        foreach (self::ROTALAR as $rota) {
            $this->get('/' . $rota)->assertStatus(404);
        }
    }

    public function test_uretim_disinda_aciliyor(): void
    {
        // Aşırı kilitleyip belgelendirmeyi tümüyle bozmadığımızın kanıtı.
        $this->assertNotSame('production', $this->app->environment());

        $this->get('/api/documentation')->assertOk();
    }

    public function test_dort_swagger_rotasi_da_kapiyi_tasiyor(): void
    {
        // Yapılandırmadaki dört giriş de aynı ara katmanı saymalı; biri
        // atlanırsa o yol canlıda açık kalır ve kimse fark etmez.
        $yapilandirma = (string) file_get_contents(config_path('l5-swagger.php'));

        foreach (['api', 'asset', 'docs', 'oauth2_callback'] as $anahtar) {
            $this->assertMatchesRegularExpression(
                "/'{$anahtar}'\s*=>\s*\[[^\]]*UretimdeKapat/",
                $yapilandirma,
                "swagger '{$anahtar}' rotası üretim kapısını taşımıyor",
            );
        }
    }
}
