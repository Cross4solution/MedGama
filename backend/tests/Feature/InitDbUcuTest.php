<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Veritabanına dokunan uç KALDIRILDI.
 *
 * `/api/system/init-db` göçleri ve tohumu çalıştırıyordu. Üç savunması vardı
 * ve ikisi zamanla zayıfladı: anahtarın varsayılanı bir dönem depoda yazılıydı,
 * `render.yaml` üretim korumasını hiç beyan etmiyordu, ve `fresh=1` (db:wipe)
 * bir zamanlar tek istekle bütün hasta verisini silebiliyordu.
 *
 * Hepsi tek tek düzeltildi. Sonra uç tümüyle kaldırıldı — çünkü bir HTTP
 * isteğiyle veritabanına dokunabilen bir kapı, hiçbir arıza senaryosunda
 * gerekmeyecek kadar ağır. Göç gerekirse Render konsolundan
 * `php artisan migrate` çalıştırılır.
 *
 * Bu ölçüt geri gelmesini engelliyor.
 */
class InitDbUcuTest extends TestCase
{
    public function test_uc_rota_tablosunda_yok(): void
    {
        $mevcut = collect(Route::getRoutes())->map(fn ($r) => $r->uri())->all();

        foreach (['api/system/init-db', 'api/system/init-db-status'] as $uc) {
            $this->assertNotContains($uc, $mevcut, "$uc geri gelmiş");
        }
    }

    public function test_uc_istege_cevap_vermiyor(): void
    {
        $this->getJson('/api/system/init-db')->assertStatus(404);
        $this->getJson('/api/system/init-db?key=herhangi')->assertStatus(404);
        $this->getJson('/api/system/init-db-status')->assertStatus(404);
    }

    public function test_veri_silme_yetenegi_hicbir_yerde_yok(): void
    {
        $rotalar = (string) file_get_contents(base_path('routes/api.php'));

        foreach (['db:wipe', 'migrate:fresh'] as $yikici) {
            $this->assertStringNotContainsString(
                $yikici,
                $rotalar,
                "rotalarda veri silen komut var: $yikici",
            );
        }
    }
}
