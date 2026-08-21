<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Şifremi unuttum → sıfırla akışı.
 *
 * Bu akışın hiç testi yoktu; oysa hesabı ele geçirilmiş kullanıcının tek
 * kurtulma yolu bu. İki açık buradan çıktı:
 *
 *  1. Sıfırlama mevcut oturumları KAPATMIYORDU. Saldırgan jetonu elindeyse
 *     kurban şifresini değiştirse bile içeride kalıyordu — yani sıfırlama
 *     kendi amacını karşılamıyordu. (changePassword bunu zaten yapıyordu.)
 *
 *  2. Bilinmeyen adres "User not found.", kayıtlı adres "Invalid reset code."
 *     döndürüyordu. forgotPassword adres sayımını önlemek için özellikle
 *     sessiz kalırken, sıfırlama ucu aynı bilgiyi açıkça veriyordu.
 *
 * Kod, süre ve tek kullanımlık olma da burada sınanıyor.
 */
class SifreSifirlamaTest extends TestCase
{
    use RefreshDatabase;

    private function kullanici(string $email = 'hasta@ornek.test'): User
    {
        return User::factory()->patient()->create([
            'email'     => $email,
            'password'  => 'EskiSifre123!',
            'is_active' => true,
        ]);
    }

    public function test_kod_uretiliyor_ve_suresi_sinirli(): void
    {
        Mail::fake();
        $k = $this->kullanici();

        $this->postJson('/api/auth/forgot-password', ['email' => $k->email])
            ->assertOk();

        $k->refresh();
        $this->assertNotNull($k->password_reset_code, 'Sıfırlama kodu üretilmedi');
        $this->assertMatchesRegularExpression('/^\d{6}$/', $k->password_reset_code);
        $this->assertNotNull($k->password_reset_expires_at);
        $this->assertTrue(
            $k->password_reset_expires_at->lessThanOrEqualTo(now()->addMinutes(16)),
            'Kodun ömrü olması gerekenden uzun',
        );
    }

    public function test_bilinmeyen_adres_ayni_yaniti_aliyor(): void
    {
        Mail::fake();
        $this->kullanici();

        $kayitli = $this->postJson('/api/auth/forgot-password', ['email' => 'hasta@ornek.test']);
        $olmayan = $this->postJson('/api/auth/forgot-password', ['email' => 'yok@ornek.test']);

        // Adres sayımı: iki durum ayırt edilememeli.
        $this->assertSame($kayitli->getStatusCode(), $olmayan->getStatusCode());
        $this->assertSame($kayitli->json('message'), $olmayan->json('message'));
    }

    public function test_dogru_kodla_sifre_degisiyor(): void
    {
        Mail::fake();
        $k = $this->kullanici();
        $this->postJson('/api/auth/forgot-password', ['email' => $k->email])->assertOk();
        $kod = $k->fresh()->password_reset_code;

        $this->postJson('/api/auth/reset-password', [
            'email'                 => $k->email,
            'code'                  => $kod,
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ])->assertOk();

        $this->assertTrue(Hash::check('YeniSifre456!', $k->fresh()->password));
    }

    public function test_sifirlama_mevcut_oturumlari_kapatiyor(): void
    {
        Mail::fake();
        $k = $this->kullanici();

        // Saldırganın elindeki oturumu temsil eder.
        $jeton = $k->createToken('ele-gecirilmis')->plainTextToken;
        $this->assertSame(1, $k->tokens()->count());

        $this->postJson('/api/auth/forgot-password', ['email' => $k->email])->assertOk();
        $this->postJson('/api/auth/reset-password', [
            'email'                 => $k->email,
            'code'                  => $k->fresh()->password_reset_code,
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ])->assertOk();

        $this->assertSame(0, $k->fresh()->tokens()->count(), 'Sıfırlamadan sonra eski oturum ayakta kaldı');

        // Jeton gerçekten geçersiz mi — sayı değil, davranış sınanıyor.
        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_yanlis_kod_ve_bilinmeyen_adres_ayni_hatayi_veriyor(): void
    {
        Mail::fake();
        $k = $this->kullanici();
        $this->postJson('/api/auth/forgot-password', ['email' => $k->email])->assertOk();

        $govde = [
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ];

        $yanlisKod = $this->postJson('/api/auth/reset-password', $govde + [
            'email' => $k->email, 'code' => '000000',
        ]);
        $olmayanAdres = $this->postJson('/api/auth/reset-password', $govde + [
            'email' => 'yok@ornek.test', 'code' => '000000',
        ]);

        $yanlisKod->assertStatus(422);
        $olmayanAdres->assertStatus(422);

        // Sızıntı burada olurdu: farklı alan ya da farklı mesaj, adresin
        // kayıtlı olup olmadığını ele verir.
        $this->assertSame(
            array_keys($yanlisKod->json('errors') ?? []),
            array_keys($olmayanAdres->json('errors') ?? []),
            'Bilinmeyen adres farklı bir hata alanı döndürüyor — adres sayımına açık',
        );
        $this->assertSame(
            $yanlisKod->json('errors.code'),
            $olmayanAdres->json('errors.code'),
            'Bilinmeyen adres farklı mesaj döndürüyor — adres sayımına açık',
        );
    }

    public function test_kod_tek_kullanimlik(): void
    {
        Mail::fake();
        $k = $this->kullanici();
        $this->postJson('/api/auth/forgot-password', ['email' => $k->email])->assertOk();
        $kod = $k->fresh()->password_reset_code;

        $govde = fn (string $sifre) => [
            'email'                 => $k->email,
            'code'                  => $kod,
            'password'              => $sifre,
            'password_confirmation' => $sifre,
        ];

        $this->postJson('/api/auth/reset-password', $govde('YeniSifre456!'))->assertOk();
        $this->postJson('/api/auth/reset-password', $govde('BaskaSifre789!'))->assertStatus(422);

        $this->assertTrue(
            Hash::check('YeniSifre456!', $k->fresh()->password),
            'Kod ikinci kez kullanılabilmiş',
        );
    }

    public function test_suresi_gecmis_kod_kabul_edilmiyor(): void
    {
        Mail::fake();
        $k = $this->kullanici();
        $this->postJson('/api/auth/forgot-password', ['email' => $k->email])->assertOk();
        $kod = $k->fresh()->password_reset_code;

        $k->forceFill(['password_reset_expires_at' => now()->subMinute()])->saveQuietly();

        $this->postJson('/api/auth/reset-password', [
            'email'                 => $k->email,
            'code'                  => $kod,
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ])->assertStatus(422);

        $this->assertTrue(Hash::check('EskiSifre123!', $k->fresh()->password));
    }
}
