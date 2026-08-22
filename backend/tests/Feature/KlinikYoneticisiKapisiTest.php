<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Klinik yönetimi uçlarına kim girebiliyor.
 *
 * Rota grubu yalnızca `auth:sanctum` taşıyor — rol kontrolü YOK. Yani hasta
 * dahil her oturumlu kullanıcı doktor ekleme, çıkarma ve klinik finansallarına
 * kadar bütün adreslere ulaşabiliyor. Kapı bir katman altta:
 * `ClinicManagerService::authorizeManager()`.
 *
 * Bu düzen çalışıyor ama kırılgan: koruma rotada değil, HER METOTTA tek tek
 * çağrılıyor. Şu an altı ucun altısı da çağırıyor; yedincisini ekleyen kişi
 * unutursa uç sessizce herkese açılır ve rota tanımına bakan biri sorunu
 * göremez.
 *
 * Testler bu yüzden uç uç yazıldı: yeni bir uç eklenip listeye alınmazsa
 * korumasız kaldığı en azından burada görünür.
 */
class KlinikYoneticisiKapisiTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: Clinic, 1: User} */
    private function klinikVeSahibi(): array
    {
        $klinik = Clinic::factory()->create();
        $sahip  = User::factory()->clinicOwner()->create(['clinic_id' => $klinik->id]);
        $klinik->update(['owner_id' => $sahip->id]);

        return [$klinik, $sahip];
    }

    public static function uclar(): array
    {
        return [
            'genel bakış'   => ['get',    '/api/clinic-manager/overview'],
            'doktor listesi' => ['get',   '/api/clinic-manager/doctors'],
            'finansallar'   => ['get',    '/api/clinic-manager/financials'],
        ];
    }

    #[DataProvider('uclar')]
    public function test_hasta_klinik_yonetimine_giremiyor(string $yontem, string $yol): void
    {
        $hasta = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')
            ->json($yontem, $yol)
            ->assertForbidden();
    }

    public function test_hasta_doktor_ekleyemiyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        $hasta  = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);

        $this->actingAs($hasta, 'sanctum')
            ->postJson("/api/clinic-manager/doctors/{$doktor->id}/add")
            ->assertForbidden();

        $this->assertNull($doktor->fresh()->clinic_id, 'Hasta doktoru bir kliniğe bağladı');
    }

    public function test_hasta_doktor_cikaramiyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        $hasta  = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create([
            'clinic_id' => $klinik->id, 'is_verified' => true,
        ]);

        // Çıkarma yıkıcı: yabancı biri kliniğin kadrosunu boşaltabilseydi
        // randevu akışı da birlikte kırılırdı.
        $this->actingAs($hasta, 'sanctum')
            ->deleteJson("/api/clinic-manager/doctors/{$doktor->id}/remove")
            ->assertForbidden();

        $this->assertSame($klinik->id, $doktor->fresh()->clinic_id);
    }

    public function test_kliniksiz_klinik_sahibi_giremiyor(): void
    {
        // Rol doğru ama bağlı klinik yok: bu durumda kapsam boş kalıyor ve
        // süzgeçsiz sorgu tüm kliniklere açılırdı.
        $sahipsiz = User::factory()->clinicOwner()->create(['clinic_id' => null]);

        $this->actingAs($sahipsiz, 'sanctum')
            ->getJson('/api/clinic-manager/overview')
            ->assertForbidden();
    }

    public function test_klinik_sahibi_kendi_panelini_acabiliyor(): void
    {
        [, $sahip] = $this->klinikVeSahibi();

        // Pozitif kontrol: her isteği reddeden bir uç yukarıdaki testleri de
        // geçerdi.
        $this->actingAs($sahip, 'sanctum')
            ->getJson('/api/clinic-manager/overview')
            ->assertOk();
    }

    public function test_oturumsuz_erisim_kapali(): void
    {
        $this->getJson('/api/clinic-manager/overview')->assertUnauthorized();
    }
}
