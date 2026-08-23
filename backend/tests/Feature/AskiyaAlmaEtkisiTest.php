<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Askıya alma gerçekten durduruyor mu.
 *
 * `is_active` yalnızca GİRİŞTE kontrol ediliyordu. Ölçülen sonuç, askıya
 * alınmış ama hâlâ jetonu elinde olan bir kullanıcı için:
 *
 *     GET  /api/auth/me       → 200   (hâlâ içeride)
 *     PUT  /api/auth/profile  → 200   (yazabiliyor da)
 *     POST /api/auth/login    → 422   (yalnız YENİ giriş engelli)
 *
 * Yani askıya alma, kullanıcı kendi isteğiyle çıkış yapana kadar hiçbir şey
 * yapmıyordu. Yönetici ekranında "User suspended." yazıyor ve hesabın
 * durdurulduğu sanılıyor — oysa taciz eden kullanıcı, ele geçirilmiş hesap
 * ya da ödeme yapmayan klinik olduğu gibi devam ediyor. Askıya almanın var
 * oluş sebebi tam olarak bu üç durum.
 *
 * Denetim artık istek başına (Authenticate middleware). Jeton iptali tek
 * başına yetmezdi: askıya alma anında ya da başka bir yoldan üretilmiş bir
 * jeton yine geçerdi.
 */
class AskiyaAlmaEtkisiTest extends TestCase
{
    use RefreshDatabase;

    private function yonetici(): User
    {
        return User::factory()->create(['role_id' => 'superAdmin', 'user_level' => 5]);
    }

    private function askiyaAl(User $hedef, bool $askida = true): void
    {
        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/admin/users/{$hedef->id}/suspend", ['suspend' => $askida])
            ->assertOk();

        app('auth')->forgetGuards();
    }

    public function test_askidaki_kullanici_okuyamiyor(): void
    {
        $kullanici = User::factory()->patient()->create();
        $jeton = $kullanici->createToken('cihaz')->plainTextToken;

        $this->askiyaAl($kullanici);

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_askidaki_kullanici_yazamiyor(): void
    {
        // ASIL MESELE. Okuma engellenip yazma açık kalsaydı, taciz eden
        // kullanıcı içerik üretmeye devam ederdi.
        $kullanici = User::factory()->patient()->create();
        $jeton = $kullanici->createToken('cihaz')->plainTextToken;

        $this->askiyaAl($kullanici);

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->putJson('/api/auth/profile', ['fullname' => 'Askıdaki Kullanıcı'])
            ->assertUnauthorized();
    }

    public function test_askiya_alma_jetonlari_da_temizliyor(): void
    {
        $kullanici = User::factory()->patient()->create();
        $kullanici->createToken('telefon');
        $kullanici->createToken('masaustu');

        $this->askiyaAl($kullanici);

        $this->assertSame(0, $kullanici->fresh()->tokens()->count());
    }

    public function test_askidaki_kullanici_giris_yapamiyor(): void
    {
        $kullanici = User::factory()->patient()->create(['password' => 'Qz8#vRt2mKp5wLx9']);

        $this->askiyaAl($kullanici);

        $this->postJson('/api/auth/login', [
            'email'    => $kullanici->email,
            'password' => 'Qz8#vRt2mKp5wLx9',
        ])->assertStatus(422);
    }

    public function test_askidan_alinan_kullanici_geri_donebiliyor(): void
    {
        // Ters uç: denetim fazla sıkı olursa askı kaldırılsa bile kullanıcı
        // içeri giremez ve bunu yalnız "engelleniyor" testleriyle göremezdik.
        $kullanici = User::factory()->patient()->create(['password' => 'Qz8#vRt2mKp5wLx9']);

        $this->askiyaAl($kullanici, true);
        $this->askiyaAl($kullanici, false);

        $this->postJson('/api/auth/login', [
            'email'    => $kullanici->email,
            'password' => 'Qz8#vRt2mKp5wLx9',
        ])->assertOk();
    }

    public function test_acik_hesap_etkilenmiyor(): void
    {
        // Denetim her isteğe girdiği için normal kullanıcıyı kesmediğini de
        // ölçmek gerekiyor.
        $kullanici = User::factory()->patient()->create();
        $jeton = $kullanici->createToken('cihaz')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/auth/me')
            ->assertOk();
    }

    public function test_askidaki_yonetici_yonetici_uclarini_kullanamiyor(): void
    {
        // Askıya alınan bir yönetici hâlâ yönetebilseydi askı anlamsız olurdu.
        $askidakiYonetici = User::factory()->create(['role_id' => 'superAdmin', 'user_level' => 5]);
        $jeton = $askidakiYonetici->createToken('cihaz')->plainTextToken;
        $hedef = User::factory()->patient()->create();

        $this->askiyaAl($askidakiYonetici);

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->putJson("/api/admin/users/{$hedef->id}/suspend", ['suspend' => true])
            ->assertUnauthorized();
    }

    public function test_askidan_sonra_uretilen_jeton_da_gecmiyor(): void
    {
        // ASIL KORUMANIN KANITI. Yukarıdaki testler jeton iptaliyle de
        // geçiyor; bu geçmiyor. Jeton askıya alma İŞLEMİNDEN SONRA
        // üretiliyor, yani iptalden sağ çıkıyor — geriye yalnızca istek
        // başına yapılan `is_active` denetimi kalıyor.
        //
        // Bu yol kuramsal değil: askıya alma anında yarışan bir istek, ya da
        // jetonu başka bir akıştan (demo giriş, entegrasyon) gelen bir hesap
        // aynı duruma düşer.
        $kullanici = User::factory()->patient()->create();

        $this->askiyaAl($kullanici);

        $jeton = $kullanici->fresh()->createToken('askidan-sonra')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();

        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->putJson('/api/auth/profile', ['fullname' => 'Askıdaki'])
            ->assertUnauthorized();
    }
}
