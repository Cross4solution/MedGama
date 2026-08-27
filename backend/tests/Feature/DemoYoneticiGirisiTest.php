<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Şifresiz yönetim paneli girişi — bilerek açılmış bir kapı, ölçütleri de o
 * kadar açık olsun.
 *
 * Uç, `/admin` adresini kimlik doğrulaması olmadan açıyor. Müşteriye paneli
 * göstermek için istendi. Bu ölçütlerin işi, kapının İSTENDİĞİ kadar açık
 * olduğunu ve bir gün istemeden ardına kadar açılmadığını güvence altına
 * almak.
 *
 * Üç şey sınanıyor:
 *
 *   1. Varsayılan KAPALI. Unutulursa açık değil kapalı kalsın.
 *   2. Açıkken verilen oturum SALT OKUNUR. Gelen kişi bakabilir, bozamaz.
 *   3. Yapılandırma yanlışsa jeton ÜRETİLMEZ. Tek bir hatalı değişken tam
 *      yetkili bir hesabı herkese açmamalı.
 */
class DemoYoneticiGirisiTest extends TestCase
{
    use RefreshDatabase;

    private function kipiAc(): void
    {
        config(['demo.yonetici_otomatik_giris' => true]);
    }

    public function test_varsayilan_kapali(): void
    {
        // config/demo.php'ye hiç dokunmadan: üretimdeki hâli bu olmalı.
        $this->getJson('/api/demo-yonetici-girisi')->assertStatus(404);
    }

    public function test_kapaliyken_hesap_da_olusturulmuyor(): void
    {
        $this->getJson('/api/demo-yonetici-girisi')->assertStatus(404);

        $this->assertDatabaseMissing('users', ['email' => config('demo.yonetici_hesabi')]);
    }

    public function test_acikken_salt_okunur_oturum_veriyor(): void
    {
        $this->kipiAc();

        $yanit = $this->getJson('/api/demo-yonetici-girisi')->assertOk();

        $jeton = $yanit->json('token');
        $this->assertNotEmpty($jeton);

        $kullanici = User::where('email', config('demo.yonetici_hesabi'))->firstOrFail();
        $this->assertSame('superAdmin', $kullanici->role_id);
        $this->assertTrue($kullanici->salt_okunur, 'demo yöneticisi salt okunur değil');

        // Jeton gerçekten çalışıyor: okuma açık…
        $this->withHeader('Authorization', "Bearer {$jeton}")
            ->getJson('/api/admin/reviews/stats')
            ->assertOk();

        // …yazma kapalı.
        $this->withHeader('Authorization', "Bearer {$jeton}")
            ->postJson('/api/admin/announcements', ['title' => 'olmaz'])
            ->assertStatus(403)
            ->assertJson(['code' => 'SALT_OKUNUR_HESAP']);
    }

    public function test_arama_motorlarina_kapali(): void
    {
        $this->kipiAc();

        $this->getJson('/api/demo-yonetici-girisi')
            ->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    }

    public function test_gercek_bir_yonetici_hesabina_denk_gelirse_jeton_vermiyor(): void
    {
        // Yapılandırma yanlış yazılırsa — DEMO_ADMIN_EMAIL'e gerçek bir
        // yöneticinin adresi girilirse — o hesap bağlantıyı bilen herkese
        // açılırdı. Uç bu durumda jeton üretmeyi reddediyor.
        $gercek = User::factory()->create([
            'email'   => 'gercek-yonetici@medagama.com',
            'role_id' => 'superAdmin',
        ]);

        $this->kipiAc();
        config(['demo.yonetici_hesabi' => $gercek->email]);

        $this->getJson('/api/demo-yonetici-girisi')
            ->assertStatus(500)
            ->assertJson(['code' => 'DEMO_HESABI_GECERSIZ']);

        $this->assertCount(0, $gercek->fresh()->tokens);
    }

    public function test_render_yapilandirmasi_kipi_acik_birakmiyor(): void
    {
        // `render.yaml` içinde `value: true` yazılırsa kip ÜRETİMDE kalıcı
        // olarak açılır ve panelden kapatmak işe yaramaz (dosya bir sonraki
        // dağıtımda geri yazar). Kipin panelden yönetilmesi şart.
        $yol = base_path('../render.yaml');

        if (!is_file($yol)) {
            $this->markTestSkipped('render.yaml bulunamadı.');
        }

        $yapilandirma = preg_replace('/^\s*#.*$/m', '', (string) file_get_contents($yol));

        $this->assertDoesNotMatchRegularExpression(
            "/key:\s*DEMO_ADMIN_AUTO_LOGIN[\s\S]{0,60}value:\s*['\"]?true/i",
            (string) $yapilandirma,
            "render.yaml şifresiz yönetici girişini AÇIK sabitliyor.\n"
            . 'Bu değişken panelden yönetilmeli (sync: false); yoksa tanıtım '
            . 'bittiğinde panelden kapatılsa bile bir sonraki dağıtım geri açar.',
        );
    }
}
