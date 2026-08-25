<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Giriş yanıtı, e-postanın kayıtlı olup olmadığını ele vermemeli.
 *
 * İki dal iki ayrı mesaj veriyordu:
 *
 *     hesap yok        → 'email'    => "No account found with this email address."
 *     parola yanlış    → 'password' => "The password you entered is incorrect."
 *
 * Aradaki fark, bir e-postanın burada KAYITLI OLUP OLMADIĞINI dışarıdan
 * sınanabilir kılıyor: elindeki adres listesini tek tek deneyen biri, kimin
 * hesabı olduğunu öğrenir. Tıbbi bir platformda bu bilginin kendisi hassas —
 * birinin burada hesabı olması, tedavi arıyor olduğunu ima eder.
 *
 * Aynı ilke parola sıfırlamada zaten uygulanıyordu ("bağlantı, e-posta
 * kayıtlıysa gönderildi"); giriş onunla hizalanmamıştı.
 *
 * Ölçütün ölçtüğü şey mesajın metni değil, İKİ YANITIN AYNI OLMASI. Yeni bir
 * dal (askıya alınmış hesap, doğrulanmamış e-posta) ayrı bir metinle eklenirse
 * sızıntı geri gelir ve bu test onu yakalar.
 */
class GirisKullaniciSayimiTest extends TestCase
{
    use RefreshDatabase;

    private const PAROLA = 'DogruParola1!';

    private function hesap(string $eposta): User
    {
        return User::factory()->create([
            'email' => $eposta,
            'password' => Hash::make(self::PAROLA),
            'is_active' => true,
            'role_id' => 'patient',
        ]);
    }

    /** Giriş denemesi — hız sınırlayıcıya takılmamak için her çağrı taze. */
    private function giris(string $eposta, string $parola)
    {
        return $this->postJson('/api/auth/login', [
            'email' => $eposta,
            'password' => $parola,
        ]);
    }

    public function test_var_olan_ve_olmayan_hesap_ayni_yaniti_veriyor(): void
    {
        $this->hesap('kayitli@ornek.test');

        $kayitli = $this->giris('kayitli@ornek.test', 'YanlisParola1!');
        $kayitsiz = $this->giris('hic-yok@ornek.test', 'YanlisParola1!');

        $this->assertSame(
            $kayitli->status(),
            $kayitsiz->status(),
            'durum kodları farklı: hesabın varlığı ele veriliyor',
        );

        $this->assertSame(
            $kayitli->json('errors'),
            $kayitsiz->json('errors'),
            'hata gövdeleri farklı: hangi e-postanın kayıtlı olduğu anlaşılıyor',
        );

        $this->assertSame(
            $kayitli->json('message'),
            $kayitsiz->json('message'),
            'üst mesajlar farklı',
        );
    }

    public function test_yanit_hesabin_varligini_ima_eden_metin_tasimiyor(): void
    {
        $this->hesap('kayitli@ornek.test');

        foreach ([['kayitli@ornek.test', 'YanlisParola1!'], ['hic-yok@ornek.test', 'YanlisParola1!']] as [$e, $p]) {
            $yanit = $this->giris($e, $p);

            foreach (['No account found', 'password you entered is incorrect'] as $sizdiran) {
                $this->assertStringNotContainsString(
                    $sizdiran,
                    $yanit->getContent(),
                    "yanıt hesabın varlığını ima eden metin taşıyor: $sizdiran",
                );
            }
        }
    }

    public function test_dogru_parolayla_giris_hala_calisiyor(): void
    {
        // Aşırı genelleştirip girişi tümüyle bozmadığımızın kanıtı.
        $this->hesap('kayitli@ornek.test');

        $yanit = $this->giris('kayitli@ornek.test', self::PAROLA);

        $yanit->assertOk();
        // Yanıt biçimi: { user, token, requires_email_verification } —
        // `access_token` değil. İlk yazdığımda tahmin etmiştim; ölçüt tahmine
        // değil, gerçek biçime bakmalı.
        $this->assertNotEmpty(
            $yanit->json('token') ?? $yanit->json('data.token'),
            'doğru parolayla giriş jeton vermiyor',
        );
    }
}
