<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Belgelendirme gerçek uçlarla eşleşmeli.
 *
 * Depoda bir `api-docs.json` vardı ama 376 ucun 32'sini kapsıyordu, iki hafta
 * önce donmuştu ve kaynakta onu üretecek tek bir `@OA` anotasyonu yoktu.
 * Başlığı hâlâ projenin küçük bir parçasının adıydı. Yani "belge gerçekle
 * uyuşmuyor" değil, belge YOKTU.
 *
 * Belge artık rota tablosundan üretiliyor (`php artisan api:belge-uret`).
 * Bu ölçüt eşleşmeyi ikisi yönde birden tutuyor:
 *
 *   • belgelenmemiş uç kalmamalı  → yeni uç eklenip belge üretilmezse yakalanır
 *   • olmayan uç belgelenmemeli   → uç silinip belge güncellenmezse yakalanır
 *
 * Tek yön yeterli değil: yalnız birincisi tutulsaydı, silinmiş uçlar belgede
 * yaşamaya devam eder ve entegrasyon yazan biri olmayan bir ucu çağırırdı.
 */
class ApiBelgesiTest extends TestCase
{
    use RefreshDatabase;

    private const BELGE = 'storage/api-docs/api-docs.json';

    /** @return array<string,string[]> yol → yöntemler */
    private function gercekUclar(): array
    {
        $uclar = [];

        foreach (Route::getRoutes() as $rota) {
            if (!str_starts_with($rota->uri(), 'api/')) {
                continue;
            }

            foreach ($rota->methods() as $yontem) {
                if (in_array($yontem, ['HEAD', 'OPTIONS'], true)) {
                    continue;
                }

                $uclar['/' . $rota->uri()][] = strtolower($yontem);
            }
        }

        return $uclar;
    }

    private function belge(): array
    {
        $yol = base_path(self::BELGE);

        $this->assertFileExists($yol, 'API belgesi yok — `php artisan api:belge-uret` koşulmalı');

        return json_decode((string) file_get_contents($yol), true);
    }

    public function test_belgelenmemis_uc_yok(): void
    {
        $belge = $this->belge();
        $eksik = [];

        foreach ($this->gercekUclar() as $yol => $yontemler) {
            foreach ($yontemler as $yontem) {
                if (!isset($belge['paths'][$yol][$yontem])) {
                    $eksik[] = strtoupper($yontem) . ' ' . $yol;
                }
            }
        }

        $this->assertSame(
            [],
            $eksik,
            "Belgelenmemiş uç var. `php artisan api:belge-uret` koşun:\n  " . implode("\n  ", $eksik),
        );
    }

    public function test_olmayan_uc_belgelenmemis(): void
    {
        // Silinmiş bir uç belgede kalırsa, entegrasyon yazan biri var olmayan
        // bir adrese istek atar ve hatayı kendinde arar.
        $gercek = $this->gercekUclar();
        $fazla = [];

        foreach ($this->belge()['paths'] as $yol => $islemler) {
            foreach (array_keys($islemler) as $yontem) {
                if (!in_array($yontem, $gercek[$yol] ?? [], true)) {
                    $fazla[] = strtoupper($yontem) . ' ' . $yol;
                }
            }
        }

        $this->assertSame(
            [],
            $fazla,
            "Belgede olan ama gerçekte olmayan uç:\n  " . implode("\n  ", $fazla),
        );
    }

    public function test_yetki_gereksinimi_belgede_gorunuyor(): void
    {
        /*
         * Belgenin asıl işi "bu uç var" demek değil, "buraya kim girebilir"
         * demek. Kimlik ve rol kapısı görünmezse belge, korumalı bir ucu
         * herkese açıkmış gibi gösterir — yanlış belge, belgesizlikten kötüdür.
         */
        $belge = $this->belge();

        $korumali = $belge['paths']['/api/admin/announcements']['get'] ?? null;
        $this->assertNotNull($korumali, 'yönetici ucu belgede yok');

        $this->assertArrayHasKey('401', $korumali['responses'], 'kimlik gereksinimi belgede yok');
        $this->assertArrayHasKey('403', $korumali['responses'], 'rol kapısı belgede yok');
        $this->assertStringContainsString('superAdmin', $korumali['description'] ?? '');

        $acik = $belge['paths']['/api/catalog/specialties']['get'] ?? null;
        $this->assertNotNull($acik, 'genel uç belgede yok');
        $this->assertArrayNotHasKey('403', $acik['responses'], 'genel uçta olmayan rol kapısı belgelenmiş');
    }

    public function test_calisma_aninda_yeniden_uretim_kapali(): void
    {
        /*
         * `generate_always` açıkken L5-Swagger her `/docs` isteğinde
         * anotasyonlardan yeniden üretip belgenin ÜZERİNE yazıyor. Anotasyonlar
         * uçların yalnız bir kısmını kapsadığı için, üretilen tam belge ilk
         * istekte siliniyordu — ölçüldü: 293 yoldan 50 yola düştü.
         *
         * Sessiz bir arıza: komut başarıyla koşuyor, dosya doğru yazılıyor,
         * sonra ilk ziyaretçi onu bozuyor.
         */
        $this->assertFalse(
            config('l5-swagger.defaults.generate_always'),
            'çalışma anında yeniden üretim açık: ilk /docs isteği belgeyi bozar',
        );
    }

    public function test_elle_yazilan_anotasyonlar_korunuyor(): void
    {
        // Üretim, elle yazılmış anotasyonları silmemeli — onlar üretilenden
        // daha zengin. Taban kapsıyor, elle yazılan üstüne biniyor.
        $belge = $this->belge();

        // `operationId` ayırt edici: üretilen taban yazmıyor, elle yazılmış
        // anotasyonlar yazıyor. Özetleri de insan cümlesi — tabanınki
        // `Sinif::metot` biçiminde.
        $elleYazilan = 0;

        foreach ($belge['paths'] as $islemler) {
            foreach ($islemler as $islem) {
                if (isset($islem['operationId'])) {
                    $elleYazilan++;
                }
            }
        }

        $this->assertGreaterThan(
            50,
            $elleYazilan,
            'elle yazılmış anotasyonlar belgeye geçmemiş — üretim onları eziyor',
        );
    }

    public function test_belge_uretimi_ayni_sonucu_veriyor(): void
    {
        // Üretim kararlıysa CI'da "belge güncel mi" diye sormak anlamlı olur.
        // Her koşuda değişen bir çıktı bu ölçütü işe yaramaz hale getirirdi.
        $once = file_get_contents(base_path(self::BELGE));

        $this->artisan('api:belge-uret')->assertSuccessful();

        $this->assertSame($once, file_get_contents(base_path(self::BELGE)));
    }
}
