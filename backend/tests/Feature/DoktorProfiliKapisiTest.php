<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Doktor profili uçlarına hasta giremiyor.
 *
 * `doctor-profile` grubu da yalnızca `auth:sanctum` taşıyor; rol kontrolü
 * on iki metodun her birinin İÇİNDE elle yapılıyor. Bugün on ikisinde de var
 * — tarayıp saydım — ama koruma rotada görünmediği için on üçüncüyü ekleyen
 * kişi kolayca atlayabilir.
 *
 * Bu dosya, klinik yönetimindekiyle aynı işi görüyor: kontrolü uç uç
 * sabitlemek. Yeni bir uç listeye alınmazsa korumasız kaldığı en azından
 * burada fark edilir.
 */
class DoktorProfiliKapisiTest extends TestCase
{
    use RefreshDatabase;

    public static function yazmaUclari(): array
    {
        return [
            'profil güncelle'     => ['put',    '/api/doctor-profile'],
            'onboarding'          => ['put',    '/api/doctor-profile/onboarding'],
            'çalışma saatleri'    => ['put',    '/api/doctor-profile/operating-hours'],
            'hizmetler'           => ['put',    '/api/doctor-profile/services'],
            'sosyal hesaplar'     => ['put',    '/api/doctor-profile/social'],
            'galeri sırala'       => ['put',    '/api/doctor-profile/gallery/reorder'],
            'galeri sil'          => ['delete', '/api/doctor-profile/gallery'],
            'doğrulama gönder'    => ['post',   '/api/doctor-profile/verification'],
        ];
    }

    #[DataProvider('yazmaUclari')]
    public function test_hasta_doktor_profilini_degistiremiyor(string $yontem, string $yol): void
    {
        $hasta = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')
            ->json($yontem, $yol)
            ->assertForbidden();
    }

    public function test_hasta_doktor_profilini_okuyamiyor(): void
    {
        $hasta = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/doctor-profile')
            ->assertForbidden();
    }

    public function test_doktor_kendi_profilini_acabiliyor(): void
    {
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);

        // Pozitif kontrol: her isteği reddeden bir uç, yukarıdaki dokuz testi
        // de geçerdi ve hiçbir şey kanıtlamazdı.
        $this->actingAs($doktor, 'sanctum')
            ->getJson('/api/doctor-profile')
            ->assertOk();
    }

    public function test_oturumsuz_erisim_kapali(): void
    {
        $this->getJson('/api/doctor-profile')->assertUnauthorized();
    }
}
