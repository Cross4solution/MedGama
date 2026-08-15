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
        config(['demo.login_key' => 'deneme-anahtari']);
    }

    protected function tearDown(): void
    {
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
        config(['demo.login_key' => '']);

        User::factory()->doctor()->create(['is_demo' => true]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')->assertNotFound();
    }

    /**
     * Canlıda tercih edilen yol: hesap sunucu ayarındaki e-postayla belirlenir,
     * veritabanına dokunmak gerekmez.
     */
    public function test_ayardaki_e_posta_ile_hesap_acilir(): void
    {
        $doktor = User::factory()->doctor()->create(['is_demo' => false]);
        config(['demo.accounts' => ['doctor' => $doktor->email, 'clinicOwner' => '']]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')->assertRedirect();
    }

    /** Ayardaki e-posta başka bir role aitse açılmamalı. */
    public function test_ayardaki_e_posta_rol_tutmuyorsa_acilmaz(): void
    {
        $hasta = User::factory()->patient()->create();
        config(['demo.accounts' => ['doctor' => $hasta->email, 'clinicOwner' => '']]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')->assertStatus(404);
    }

    /**
     * Bağlantı kilitli bir ekrana düşerse işe yaramaz: demo hesabı
     * kullanıldığı anda CRM'e hazır hale getirilmeli.
     */
    public function test_demo_hesabi_crme_hazir_hale_getirilir(): void
    {
        $doktor = User::factory()->doctor()->create([
            'is_demo'        => true,
            'is_verified'    => false,
            'is_crm_active'  => false,
            'crm_expires_at' => null,
        ]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')->assertRedirect();

        $doktor->refresh();
        $this->assertTrue($doktor->is_verified);
        $this->assertTrue((bool) $doktor->is_crm_active);
        $this->assertTrue($doktor->crm_expires_at?->isFuture());
    }

    /** Demo olmayan hesaba hiçbir ayrıcalık yazılmamalı. */
    public function test_demo_olmayan_hesaba_dokunulmaz(): void
    {
        $baskasi = User::factory()->doctor()->create([
            'is_demo'       => false,
            'is_verified'   => false,
            'is_crm_active' => false,
        ]);

        $this->get('/api/demo-login/doktor?key=deneme-anahtari')->assertStatus(404);

        $baskasi->refresh();
        $this->assertFalse($baskasi->is_verified);
        $this->assertFalse((bool) $baskasi->is_crm_active);
    }

    public function test_taninmayan_rol_acilmaz(): void
    {
        User::factory()->doctor()->create(['is_demo' => true]);

        $this->get('/api/demo-login/superAdmin?key=deneme-anahtari')->assertNotFound();
        $this->get('/api/demo-login/admin?key=deneme-anahtari')->assertNotFound();
    }
}
