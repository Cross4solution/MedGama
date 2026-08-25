<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Veritabanını yeniden kuran uç, unutulursa KAPALI kalmalı.
 *
 * `/api/system/init-db` göçleri ve tohumu çalıştırıyor. Üç savunması vardı ama
 * ikisi sessizce zayıftı:
 *
 *   • Anahtarın varsayılanı DEPODA YAZILIYDI ('Medagama2026SecretInit').
 *     Kodun kendi notu "MUST be rotated" diyordu. Yani anahtarın gizli olması,
 *     birinin onu değiştirmeyi hatırlamasına bağlıydı; depoyu okuyan herkes
 *     zaten biliyordu. Varsayılan artık BOŞ ve boş anahtar ucu kullanılamaz
 *     kılıyor.
 *
 *   • `render.yaml` `ALLOW_DESTRUCTIVE_INIT` değişkenini hiç içermiyordu.
 *     Üretim koruması varsayılanın `false` kalmasına bağlıydı. Aynı hata
 *     `DEMO_LOGIN_ENABLED` için de yapılmıştı ve orada da düzeltilmişti:
 *     güvenlik kararı dosyada yazılı olmalı.
 *
 * `fresh=1` (db:wipe) yeteneği daha önce kaldırılmıştı — tek bir HTTP
 * isteğiyle bütün hasta verisi silinebiliyordu. Bu ölçüt onun geri gelmediğini
 * de sınıyor.
 */
class InitDbUcuTest extends TestCase
{
    use RefreshDatabase;

    private function icerik(string $goreliYol): string
    {
        $tam = base_path($goreliYol);

        $this->assertFileExists($tam, "$goreliYol bulunamadı — bu ölçüt güncellenmeli");

        return (string) file_get_contents($tam);
    }

    /**
     * Yorumsuz kaynak.
     *
     * İlk hâli ham metinde arıyordu ve DOĞRU koda kırmızı yandı: `db:wipe`
     * yalnızca "bu yetenek kaldırıldı" diyen yorumda geçiyor. Yorum, anlattığı
     * şeyin kendisini taklit ediyor.
     */
    private function yorumsuz(string $goreliYol): string
    {
        $ham = $this->icerik($goreliYol);
        $ham = (string) preg_replace('#/\*[\s\S]*?\*/#', '', $ham);

        return implode("\n", array_filter(
            explode("\n", $ham),
            static fn ($satir) => !preg_match('#^\s*(//|\#)#', $satir),
        ));
    }

    public function test_anahtar_varsayilani_bos(): void
    {
        // Asıl mesele: değişken tanımlanmadığında anahtar NE oluyor.
        $this->assertStringContainsString(
            "env('INIT_DB_KEY', '')",
            $this->icerik('config/app.php'),
            'init-db anahtarının varsayılanı boş değil: depoda yazılı bir parola geri gelmiş',
        );
    }

    public function test_depodaki_eski_anahtar_hicbir_yerde_yazili_degil(): void
    {
        foreach (['config/app.php', 'routes/api.php'] as $dosya) {
            $this->assertStringNotContainsString(
                'Medagama2026SecretInit',
                $this->yorumsuz($dosya),
                "$dosya hâlâ sabit anahtarı taşıyor",
            );
        }
    }

    public function test_anahtar_tanimsizken_uc_yok_gibi_davraniyor(): void
    {
        // 403 değil 404: ucun VARLIĞI bile bilgi verir.
        config(['app.init_db_key' => '']);

        $this->getJson('/api/system/init-db')->assertStatus(404);
        $this->getJson('/api/system/init-db?key=herhangi')->assertStatus(404);
    }

    public function test_yanlis_anahtar_reddediliyor(): void
    {
        config(['app.init_db_key' => 'dogru-anahtar']);

        $this->getJson('/api/system/init-db?key=yanlis')->assertStatus(403);
        $this->getJson('/api/system/init-db')->assertStatus(403);
    }

    public function test_uretim_yapilandirmasi_acikca_kapatiyor(): void
    {
        $this->assertMatchesRegularExpression(
            '/key:\s*ALLOW_DESTRUCTIVE_INIT\s*\n\s*value:\s*false/',
            $this->icerik('../render.yaml'),
            'render.yaml yıkıcı kurulumu açıkça kapatmıyor',
        );
    }

    public function test_veri_silme_yetenegi_geri_gelmemis(): void
    {
        $rotalar = $this->yorumsuz('routes/api.php');

        foreach (['db:wipe', 'migrate:fresh'] as $yikici) {
            $this->assertStringNotContainsString(
                $yikici,
                $rotalar,
                "init-db ucu yeniden veri silebiliyor: $yikici",
            );
        }
    }
}
