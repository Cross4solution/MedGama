<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * CORS beyaz listesi.
 *
 * Canlıda `CORS_ALLOWED_ORIGINS` değişkenine "*" yazılmıştı ve kodun beyaz
 * listesini tamamen iptal ediyordu: sunucu HER kaynağa izin veriyordu.
 * Panel ayarının tek bir yanlış değerle bu korumayı kapatabilmesi, sağlık
 * verisi taşıyan bir sistemde kabul edilebilir değil.
 *
 * Bu testler yapılandırmanın kendisini sınıyor — HTTP isteğiyle değil, çünkü
 * hata da yapılandırmadaydı.
 */
class CorsKisitlamaTest extends TestCase
{
    /** Yapılandırma dosyasını verilen env değeriyle yeniden değerlendirir. */
    private function izinliKaynaklar(?string $envDegeri): array
    {
        if ($envDegeri === null) {
            putenv('CORS_ALLOWED_ORIGINS');
            unset($_ENV['CORS_ALLOWED_ORIGINS'], $_SERVER['CORS_ALLOWED_ORIGINS']);
        } else {
            putenv("CORS_ALLOWED_ORIGINS={$envDegeri}");
            $_ENV['CORS_ALLOWED_ORIGINS'] = $envDegeri;
            $_SERVER['CORS_ALLOWED_ORIGINS'] = $envDegeri;
        }

        $yapilandirma = require config_path('cors.php');

        return $yapilandirma['allowed_origins'];
    }

    public function test_joker_kabul_edilmiyor(): void
    {
        $kaynaklar = $this->izinliKaynaklar('*');

        $this->assertNotContains('*', $kaynaklar, 'Joker (*) beyaz listeye girdi.');
        $this->assertNotEmpty($kaynaklar, 'Joker elenince liste boşaldı — meşru site de kilitlenirdi.');
        $this->assertContains('https://med-gama.vercel.app', $kaynaklar);
    }

    public function test_joker_diger_kaynaklarla_birlikte_de_eleniyor(): void
    {
        $kaynaklar = $this->izinliKaynaklar('https://medagama.com,*');

        $this->assertNotContains('*', $kaynaklar);
        $this->assertContains('https://medagama.com', $kaynaklar);
    }

    public function test_gecerli_liste_oldugu_gibi_uygulanıyor(): void
    {
        $kaynaklar = $this->izinliKaynaklar('https://medagama.com,https://www.medagama.com');

        $this->assertSame(['https://medagama.com', 'https://www.medagama.com'], $kaynaklar);
    }

    public function test_degisken_yoksa_guvenli_varsayilan(): void
    {
        $kaynaklar = $this->izinliKaynaklar(null);

        $this->assertContains('https://med-gama.vercel.app', $kaynaklar);
        $this->assertNotContains('*', $kaynaklar);
    }

    public function test_kimlik_bilgisi_paylasimi_kapali(): void
    {
        // supports_credentials açık olsaydı joker yasağı bile yetmezdi:
        // tarayıcı çerezleri çapraz kaynak taşırdı.
        $this->assertFalse(config('cors.supports_credentials'));
    }
}
