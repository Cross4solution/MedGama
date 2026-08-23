<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Kimlik uçlarındaki hız sınırı — kaba kuvvete karşı tek koruma.
 *
 * Parola denemesi, kayıt ve şifre sıfırlama uçları sınırsız çağrılabilirse
 * bir parola listesi saatler içinde denenir. Sınırın kaybolması SESSİZDİR:
 * uçlar çalışmaya devam eder, sadece koruma yok olur.
 *
 * İki ayrı şey sınanıyor:
 *   1. Sınır GERÇEKTEN devreye giriyor mu (istek atılarak)
 *   2. Rotalar adlandırılmış sınırlayıcıyı hâlâ TAŞIYOR mu (yapısal)
 *
 * İkincisi gerekli, çünkü rotadan ara katmanı düşürmek tek satırlık bir
 * değişiklik ve davranış testi yalnız sınadığı ucu korur.
 */
class KimlikHizSiniriTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Sayaç önbellekte tutuluyor ve RefreshDatabase onu temizlemiyor:
        // önceki testten kalan sayım, buradaki ölçümü kaydırır.
        foreach (['auth-login', 'auth-register', 'auth-password'] as $ad) {
            RateLimiter::clear($ad . '127.0.0.1');
        }
        RateLimiter::clear('127.0.0.1');
    }

    public function test_parola_denemesi_sinirsiz_degil(): void
    {
        User::factory()->patient()->create(['email' => 'kurban@ornek.test']);

        $sonKod = 0;
        for ($i = 0; $i < 12; $i++) {
            $sonKod = $this->postJson('/api/auth/login', [
                'email'    => 'kurban@ornek.test',
                'password' => 'yanlis-parola-' . $i,
            ])->getStatusCode();

            if ($sonKod === 429) {
                break;
            }
        }

        $this->assertSame(429, $sonKod, 'giriş ucu sınırsız denenebiliyor — parola listesi çalıştırılabilir');
    }

    public function test_sinira_takilan_istek_500_donmuyor(): void
    {
        // Sınırlayıcının yanıtı bir kez catch-all tarafından 500'e
        // çevriliyordu; arayüz "sunucu hatası" gösteriyor ve kullanıcı
        // beklemesi gerektiğini anlamıyordu.
        User::factory()->patient()->create(['email' => 'kurban2@ornek.test']);

        $kodlar = [];
        for ($i = 0; $i < 12; $i++) {
            $kodlar[] = $this->postJson('/api/auth/login', [
                'email'    => 'kurban2@ornek.test',
                'password' => 'yanlis',
            ])->getStatusCode();
        }

        $this->assertNotContains(500, $kodlar, 'hız sınırı 500 olarak dönüyor');
        $this->assertContains(429, $kodlar);
    }

    public function test_sinir_asiminda_ne_kadar_beklenecegi_yaziyor(): void
    {
        // Arayüzün "bir dakika sonra tekrar deneyin" diyebilmesi için gerekli.
        User::factory()->patient()->create(['email' => 'kurban3@ornek.test']);

        $yanit = null;
        for ($i = 0; $i < 12; $i++) {
            $yanit = $this->postJson('/api/auth/login', [
                'email'    => 'kurban3@ornek.test',
                'password' => 'yanlis',
            ]);

            if ($yanit->getStatusCode() === 429) {
                break;
            }
        }

        $this->assertSame(429, $yanit->getStatusCode());
        $this->assertNotNull($yanit->headers->get('Retry-After'), 'bekleme süresi bildirilmiyor');
    }

    public function test_kayit_ucu_sinirli(): void
    {
        // Kayıt seli hem veritabanını hem posta kuyruğunu doldurur.
        $sonKod = 0;
        for ($i = 0; $i < 10; $i++) {
            $sonKod = $this->postJson('/api/auth/register', [
                'fullname'              => 'Sel Testi',
                'email'                 => "sel{$i}@ornek.test",
                'password'              => 'Qz8#vRt2mKp5wLx9',
                'password_confirmation' => 'Qz8#vRt2mKp5wLx9',
                'role_id'               => 'patient',
                'date_of_birth'         => '1990-01-01',
                'health_data_consent'   => true,
            ])->getStatusCode();

            if ($sonKod === 429) {
                break;
            }
        }

        $this->assertSame(429, $sonKod, 'kayıt ucu sınırsız çağrılabiliyor');
    }

    public function test_sifre_sifirlama_ucu_sinirli(): void
    {
        // Sınırsız olsaydı bir adrese sürekli sıfırlama postası gönderilebilir
        // ve o kişi taciz edilebilirdi.
        $sonKod = 0;
        for ($i = 0; $i < 10; $i++) {
            $sonKod = $this->postJson('/api/auth/forgot-password', [
                'email' => 'hedef@ornek.test',
            ])->getStatusCode();

            if ($sonKod === 429) {
                break;
            }
        }

        $this->assertSame(429, $sonKod, 'şifre sıfırlama ucu sınırsız çağrılabiliyor');
    }

    public function test_kimlik_uclari_adlandirilmis_sinirlayiciyi_tasiyor(): void
    {
        // Yapısal koruma: ara katmanı rotadan düşürmek tek satır, ve davranış
        // testi yalnız sınadığı ucu korur.
        $beklenen = [
            'api/auth/login'           => 'auth-login',
            'api/auth/register'        => 'auth-register',
            'api/auth/forgot-password' => 'auth-password',
        ];

        $eksik = [];

        foreach (Route::getRoutes() as $rota) {
            $ad = $beklenen[$rota->uri()] ?? null;

            if (!$ad || !in_array('POST', $rota->methods(), true)) {
                continue;
            }

            $ara = implode(' ', $rota->gatherMiddleware());

            if (!str_contains($ara, "throttle:{$ad}")) {
                $eksik[] = $rota->uri() . ' (beklenen: throttle:' . $ad . ')';
            }

            unset($beklenen[$rota->uri()]);
        }

        $this->assertSame([], $eksik, "Kimlik ucu hız sınırını kaybetmiş:\n  " . implode("\n  ", $eksik));
        $this->assertSame([], $beklenen, 'Beklenen kimlik ucu bulunamadı: ' . implode(', ', array_keys($beklenen)));
    }
}
