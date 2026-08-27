<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Canlıda yönetici hesabı açan komutun korumaları.
 *
 * Komut var, çünkü canlı dağıtım tam tohumlamayı çalıştırmıyor: kapsayıcı
 * yalnız `VitrinSeeder`'ı koşuyor, `admin@medagama.com / Password123!` ise
 * `DatabaseSeeder` içinde. Yani canlıda yönetici hesabı kendiliğinden
 * oluşmuyor ve tam tohumlamayı canlıda koşmak demo hastalarını, demo
 * hekimlerini ve herkesçe bilinen bir şifreyi üretim veritabanına yazardı.
 *
 * Üç şeyi koruyor:
 *
 *   1. Şifre gücü — canlıya zayıf bir yönetici şifresi koymak, hesabı hiç
 *      açmamaktan kötü.
 *   2. Rol yükseltme — yanlış yazılmış bir adres var olan bir hastayı
 *      sessizce süper yöneticiye çevirmemeli.
 *   3. Şifre komut satırında geçmemeli; kabuk geçmişine ve süreç listesine
 *      düşer.
 */
class YoneticiOlusturTest extends TestCase
{
    use RefreshDatabase;

    private const GUCLU = 'Gucl3!Parola#2026';

    public function test_yonetici_aciliyor_ve_giris_yapabiliyor(): void
    {
        $this->artisan('yonetici:olustur', ['eposta' => 'yeni@medagama.com'])
            ->expectsQuestion('Şifre (ekranda görünmez)', self::GUCLU)
            ->expectsQuestion('Şifre (tekrar)', self::GUCLU)
            ->assertSuccessful();

        $kullanici = User::where('email', 'yeni@medagama.com')->firstOrFail();

        $this->assertSame('superAdmin', $kullanici->role_id);
        $this->assertTrue(Hash::check(self::GUCLU, $kullanici->password));

        // Doğrulanmamış hesap giriş yapamıyor; komut bunu üstlenmezse
        // hesap açılır ama kullanılamaz.
        $this->assertNotNull($kullanici->email_verified_at);
        $this->assertTrue((bool) $kullanici->is_active);

        $this->postJson('/api/auth/login', [
            'email'    => 'yeni@medagama.com',
            'password' => self::GUCLU,
        ])->assertOk();
    }

    public function test_zayif_sifre_reddediliyor(): void
    {
        $this->artisan('yonetici:olustur', ['eposta' => 'zayif@medagama.com'])
            ->expectsQuestion('Şifre (ekranda görünmez)', 'parola')
            ->expectsQuestion('Şifre (tekrar)', 'parola')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'zayif@medagama.com']);
    }

    public function test_sifreler_uyusmazsa_hesap_acilmiyor(): void
    {
        $this->artisan('yonetici:olustur', ['eposta' => 'uyusmaz@medagama.com'])
            ->expectsQuestion('Şifre (ekranda görünmez)', self::GUCLU)
            ->expectsQuestion('Şifre (tekrar)', self::GUCLU . 'x')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'uyusmaz@medagama.com']);
    }

    public function test_var_olan_hasta_sessizce_yoneticiye_cevrilmiyor(): void
    {
        // Yanlış yazılmış tek bir adres, gerçek bir hastanın hesabını süper
        // yönetici yapardı — ve bunu kimse fark etmezdi.
        $hasta = User::factory()->create([
            'email'   => 'hasta@medagama.com',
            'role_id' => 'patient',
        ]);

        $this->artisan('yonetici:olustur', ['eposta' => 'hasta@medagama.com'])
            ->expectsQuestion('Şifre (ekranda görünmez)', self::GUCLU)
            ->expectsQuestion('Şifre (tekrar)', self::GUCLU)
            ->assertFailed();

        $this->assertSame('patient', $hasta->fresh()->role_id);
    }

    public function test_var_olan_yoneticinin_sifresi_yenilenebiliyor(): void
    {
        $this->artisan('yonetici:olustur', ['eposta' => 'yonetici@medagama.com'])
            ->expectsQuestion('Şifre (ekranda görünmez)', self::GUCLU)
            ->expectsQuestion('Şifre (tekrar)', self::GUCLU)
            ->assertSuccessful();

        $yeni = 'BaskaB1r!Parola#';

        $this->artisan('yonetici:olustur', ['eposta' => 'yonetici@medagama.com'])
            ->expectsQuestion('Şifre (ekranda görünmez)', $yeni)
            ->expectsQuestion('Şifre (tekrar)', $yeni)
            ->assertSuccessful();

        $this->assertTrue(Hash::check($yeni, User::where('email', 'yonetici@medagama.com')->firstOrFail()->password));
        $this->assertSame(1, User::where('email', 'yonetici@medagama.com')->count());
    }

    public function test_sifre_komut_satirinda_alinmiyor(): void
    {
        // Argüman ya da seçenek olarak şifre kabul edilseydi, Render'ın
        // komut günlüğüne ve sunucudaki süreç listesine düz metin düşerdi.
        $tanim = (string) (new \ReflectionClass(\App\Console\Commands\YoneticiOlustur::class))
            ->getDefaultProperties()['signature'];

        $this->assertStringNotContainsStringIgnoringCase('sifre', $tanim);
        $this->assertStringNotContainsStringIgnoringCase('password', $tanim);
    }
}
