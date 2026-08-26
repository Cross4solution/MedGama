<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Yönetici yüzeyi — yönetici olmayan herkesi reddetmeli.
 *
 * Yönetici oturumu bu ortamda açılamıyor (şifresiz demo girişi `superAdmin`'i
 * bilerek dışlıyor), dolayısıyla o ekranların İÇİ sınanamıyor. Ama sınanabilen
 * ve aslında daha kritik olan yarısı var: içeri KİMİN GİREMEDİĞİ.
 *
 * Yönetici yüzeyi 81 uç — kullanıcı yönetimi, doğrulama kararları, katalog,
 * finans. Biri rol süzgecini kaybederse hasta hesabı sistemin tamamını yönetir
 * hâle gelir ve hiçbir şey hata vermez.
 *
 * Ölçüt rota tablosunu OKUYOR: elle yazılmış bir liste, tam da yeni eklenen
 * uçta sessiz kalırdı. Yazma uçları da çağrılıyor — reddedilmeleri gerektiği
 * için yan etki oluşmuyor; oluşuyorsa zaten aradığımız kusur budur.
 *
 * `catalog/*` OKUMA uçları bilerek dışarıda: şehir, hastalık, uzmanlık ve
 * belirti listeleri arama arayüzünün herkese açık başvuru verisi.
 */
class YoneticiYuzeyiReddiTest extends TestCase
{
    use RefreshDatabase;

    /** Yönetici olmayan roller. */
    private function yabancilar(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        return [
            'hasta'   => User::factory()->patient()->create(),
            'hekim'   => User::factory()->doctor()->create(['is_verified' => true]),
            'klinik'  => $sahip,
            'hastane' => User::factory()->create(['role_id' => 'hospital']),
            'satisci' => User::factory()->create(['role_id' => 'salesperson']),
        ];
    }

    private function olarak(?User $user): self
    {
        if (!$user) {
            return $this;
        }

        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** Yönetici rotalarının çağrılabilir hâlleri. */
    private function yoneticiRotalari(): array
    {
        $yerine = [
            '{id}' => (string) \Illuminate\Support\Str::uuid(),
            '{user}' => (string) \Illuminate\Support\Str::uuid(),
            '{userId}' => (string) \Illuminate\Support\Str::uuid(),
            '{clinicId}' => (string) \Illuminate\Support\Str::uuid(),
            '{post}' => (string) \Illuminate\Support\Str::uuid(),
            '{ticket}' => (string) \Illuminate\Support\Str::uuid(),
        ];

        $bulunan = [];

        foreach (Route::getRoutes() as $rota) {
            $uri = $rota->uri();

            if (!str_starts_with($uri, 'api/admin/')) {
                continue;
            }

            $cozulmus = strtr($uri, $yerine);

            if (str_contains($cozulmus, '{')) {
                continue;
            }

            foreach ($rota->methods() as $yontem) {
                if ($yontem === 'HEAD') {
                    continue;
                }

                $bulunan[] = [$yontem, '/' . $cozulmus];
            }
        }

        return $bulunan;
    }

    public function test_yonetici_olmayan_hicbir_yonetici_ucuna_giremiyor(): void
    {
        $rotalar = $this->yoneticiRotalari();

        $this->assertGreaterThan(
            20,
            count($rotalar),
            'yönetici rota listesi beklenenden küçük — tarama bozulmuş olabilir',
        );

        $gecenler = [];

        foreach ($this->yabancilar() as $ad => $yabanci) {
            foreach ($rotalar as [$yontem, $adres]) {
                $yanit = $this->olarak($yabanci)->json($yontem, $adres);

                // 401/403/404 reddetme; 422 de kabul DEĞİL — doğrulamaya
                // ulaşmışsa yetki kapısını geçmiş demektir.
                if (!in_array($yanit->status(), [401, 403, 404], true)) {
                    $gecenler[] = "$ad → $yontem $adres = {$yanit->status()}";
                }
            }
        }

        $this->assertSame([], $gecenler, 'yönetici olmayan kullanıcı yönetici ucuna girebiliyor');
    }

    public function test_oturumsuz_istek_yonetici_ucuna_giremiyor(): void
    {
        $gecenler = [];

        foreach ($this->yoneticiRotalari() as [$yontem, $adres]) {
            $yanit = $this->json($yontem, $adres);

            if (!in_array($yanit->status(), [401, 403, 404], true)) {
                $gecenler[] = "$yontem $adres = {$yanit->status()}";
            }
        }

        $this->assertSame([], $gecenler, 'oturumsuz istek yönetici ucuna girebiliyor');
    }
}
