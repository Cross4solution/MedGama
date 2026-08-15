<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Şifresiz demo girişi.
 *
 * Bu uç nokta bilerek açılmış bir kimlik doğrulama atlaması; sınırlarının
 * gerçekten uygulandığı sınanmalı. Sınırlar gevşerse gerçek bir hesap
 * bağlantıyı bilen herkese açılır.
 */
class DemoLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        putenv('DEMO_LOGIN_KEY=deneme-anahtari');
        $_ENV['DEMO_LOGIN_KEY'] = 'deneme-anahtari';
    }

    protected function tearDown(): void
    {
        putenv('DEMO_LOGIN_KEY');
        unset($_ENV['DEMO_LOGIN_KEY']);
        parent::tearDown();
    }

    public function test_demo_isaretli_doktor_hesabi_acilir(): void
    {
        User::factory()->doctor()->create(['is_demo' => true]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')
            ->assertRedirect();
    }

    public function test_yanlis_anahtar_404_doner(): void
    {
        User::factory()->doctor()->create(['is_demo' => true]);

        $this->get('/api/demo-login/doktor?key=yanlis')->assertNotFound();
        $this->get('/api/demo-login/doktor')->assertNotFound();
    }

    /** En kritik sınır: demo işareti olmayan hesap asla açılmamalı. */
    public function test_demo_olmayan_hesap_acilmaz(): void
    {
        User::factory()->doctor()->create(['is_demo' => false]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')
            ->assertStatus(404);
    }

    /** Sunucuda anahtar tanımlı değilse uç nokta hiç yokmuş gibi davranmalı. */
    public function test_anahtar_tanimsizsa_uc_nokta_kapali(): void
    {
        putenv('DEMO_LOGIN_KEY');
        unset($_ENV['DEMO_LOGIN_KEY']);

        User::factory()->doctor()->create(['is_demo' => true]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')->assertNotFound();
    }

    public function test_taninmayan_rol_acilmaz(): void
    {
        User::factory()->doctor()->create(['is_demo' => true]);

        $this->get('/api/demo-login/superAdmin?key=deneme-anahtari')->assertNotFound();
        $this->get('/api/demo-login/admin?key=deneme-anahtari')->assertNotFound();
    }
}
