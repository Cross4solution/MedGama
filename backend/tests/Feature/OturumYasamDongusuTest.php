<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Oturum yaşam döngüsü — hangi işlem hangi oturumları kapatıyor.
 *
 * Ayrım kullanıcı açısından belirleyici:
 *
 *   çıkış         → YALNIZ bu cihaz. Masaüstünde çıkış yapan biri
 *                   telefonundan da atılırsa özellik kullanılamaz olur.
 *   tüm cihazlar  → HEPSİ. "Her yerden çık" düğmesi bir oturumu bile
 *                   ayakta bırakırsa kullanıcıya yalan söylemiş olur.
 *   parola değişimi → HEPSİ. Parolasının ele geçirildiğini düşünen kullanıcı
 *                   parolayı değiştirir; eski oturumlar yaşamaya devam
 *                   ederse saldırgan erişimini korur ve kullanıcı korunduğunu
 *                   sanır. Sessiz ve tam olarak kritik anda.
 *
 * Şifre sıfırlama ve "tüm cihazlar" ayrı testlerde kapsanıyor
 * (SifreSifirlamaTest, LogoutAllDevicesTest); burada eksik kalan iki yol var.
 */
class OturumYasamDongusuTest extends TestCase
{
    use RefreshDatabase;

    private const PAROLA = 'Qz8#vRt2mKp5wLx9';
    private const YENI_PAROLA = 'Rw4#nTy7bVc2mLk8';

    private function kullanici(): User
    {
        return User::factory()->patient()->create(['password' => self::PAROLA]);
    }

    private function jetonla(string $jeton): self
    {
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** Jeton hâlâ geçerli mi? */
    private function gecerliMi(string $jeton): bool
    {
        return $this->jetonla($jeton)->getJson('/api/auth/me')->getStatusCode() === 200;
    }

    public function test_cikis_yalnizca_bu_cihazi_kapatiyor(): void
    {
        $kullanici = $this->kullanici();
        $masaustu = $kullanici->createToken('masaustu')->plainTextToken;
        $telefon = $kullanici->createToken('telefon')->plainTextToken;

        $this->jetonla($masaustu)->postJson('/api/auth/logout')->assertOk();

        $this->assertFalse($this->gecerliMi($masaustu), 'çıkış yapılan oturum ayakta kaldı');
        $this->assertTrue($this->gecerliMi($telefon), 'çıkış diğer cihazı da kapattı');
    }

    public function test_parola_degisimi_butun_oturumlari_kapatiyor(): void
    {
        // ASIL GÜVENCE. Parolasının ele geçirildiğini düşünen kullanıcı
        // parolayı değiştirir; saldırganın elindeki jeton ölmelidir.
        $kullanici = $this->kullanici();
        $saldirgan = $kullanici->createToken('saldirgan')->plainTextToken;
        $kendi = $kullanici->createToken('kendi')->plainTextToken;

        $this->jetonla($kendi)->putJson('/api/auth/profile/password', [
            'current_password'          => self::PAROLA,
            'password'              => self::YENI_PAROLA,
            'password_confirmation' => self::YENI_PAROLA,
        ])->assertOk();

        $this->assertFalse($this->gecerliMi($saldirgan), 'parola değişti ama saldırganın oturumu ayakta');
        $this->assertSame(0, $kullanici->fresh()->tokens()->count(), 'oturumlar temizlenmedi');
    }

    public function test_yanlis_mevcut_parolayla_degisim_reddediliyor(): void
    {
        // Ele geçirilmiş bir oturum, parolayı bilmeden yenisini koyup
        // kullanıcıyı kendi hesabından kilitleyememeli.
        $kullanici = $this->kullanici();
        $jeton = $kullanici->createToken('cihaz')->plainTextToken;

        // Hata ALANI da doğrulanıyor: eksik/yanlış adlandırılmış bir alan da
        // 422 verir ve test, mevcut-parola denetimi hiç olmasa bile geçerdi.
        $this->jetonla($jeton)->putJson('/api/auth/profile/password', [
            'current_password'      => 'yanlis-parola',
            'password'              => self::YENI_PAROLA,
            'password_confirmation' => self::YENI_PAROLA,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');

        // Oturum da kapanmamalı: başarısız deneme kimseyi dışarı atmamalı.
        $this->assertTrue($this->gecerliMi($jeton), 'başarısız parola denemesi oturumu düşürdü');
    }

    public function test_yeni_parolayla_giris_yapilabiliyor(): void
    {
        // Ters uç: değişim sonrası kullanıcı içeri giremezse hesabını
        // kaybeder ve bunu yalnız "eski oturum öldü" testleri gizlerdi.
        $kullanici = $this->kullanici();
        $jeton = $kullanici->createToken('cihaz')->plainTextToken;

        $this->jetonla($jeton)->putJson('/api/auth/profile/password', [
            'current_password'          => self::PAROLA,
            'password'              => self::YENI_PAROLA,
            'password_confirmation' => self::YENI_PAROLA,
        ])->assertOk();

        app('auth')->forgetGuards();

        $this->postJson('/api/auth/login', [
            'email'    => $kullanici->email,
            'password' => self::YENI_PAROLA,
        ])->assertOk();
    }

    public function test_eski_parola_artik_gecerli_degil(): void
    {
        $kullanici = $this->kullanici();
        $jeton = $kullanici->createToken('cihaz')->plainTextToken;

        $this->jetonla($jeton)->putJson('/api/auth/profile/password', [
            'current_password'          => self::PAROLA,
            'password'              => self::YENI_PAROLA,
            'password_confirmation' => self::YENI_PAROLA,
        ])->assertOk();

        app('auth')->forgetGuards();

        $this->postJson('/api/auth/login', [
            'email'    => $kullanici->email,
            'password' => self::PAROLA,
        ])->assertStatus(422);
    }

    public function test_iptal_edilen_jeton_gercekten_calismiyor(): void
    {
        // Jetonun tablodan silinmesi ile isteğin reddedilmesi ayrı şeyler;
        // ölçüt kullanıcının erişimi kaybetmesi.
        $kullanici = $this->kullanici();
        $jeton = $kullanici->createToken('cihaz')->plainTextToken;

        $this->assertTrue($this->gecerliMi($jeton));

        $kullanici->tokens()->delete();

        $this->assertFalse($this->gecerliMi($jeton), 'silinen jetonla istek hâlâ geçiyor');
    }
}
