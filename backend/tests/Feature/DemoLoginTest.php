<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Şifresiz demo girişi.
 *
 * Bilerek açılmış bir kimlik doğrulama atlaması; sınırlarının gerçekten
 * uygulandığı sınanmalı. Sınırlar gevşerse gerçek bir hesap, bağlantıyı
 * bilen herkese açılır.
 */
class DemoLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'demo.enabled'   => true,
            'demo.login_key' => '',
            'demo.accounts'  => [
                'doctor'      => 'demo-doktor@test.local',
                'clinicOwner' => 'demo-klinik@test.local',
            ],
        ]);
    }

    public function test_hesap_yokken_kurulur_ve_giris_yapilir(): void
    {
        $this->get('/api/demo-login/doktor')->assertRedirect();

        $doktor = User::where('email', 'demo-doktor@test.local')->first();
        $this->assertNotNull($doktor);
        $this->assertSame('doctor', $doktor->role_id);
        $this->assertTrue((bool) $doktor->is_demo);
        // CRM kilitli açılırsa bağlantının bir anlamı kalmıyor.
        $this->assertTrue((bool) $doktor->is_crm_active);
        $this->assertTrue((bool) $doktor->is_verified);
    }

    public function test_ornek_veri_kurulur_ve_ikinci_giriste_cogalmaz(): void
    {
        $this->get('/api/demo-login/doktor')->assertRedirect();
        $ilk = Appointment::count();
        $this->assertGreaterThan(0, $ilk, 'Örnek randevu kurulmamış');

        $this->get('/api/demo-login/doktor')->assertRedirect();

        $this->assertSame($ilk, Appointment::count(), 'Her girişte veri çoğalıyor');
    }

    public function test_klinik_demosu_da_kurulur(): void
    {
        $this->get('/api/demo-login/klinik')->assertRedirect();

        $klinikSahibi = User::where('email', 'demo-klinik@test.local')->first();
        $this->assertNotNull($klinikSahibi);
        $this->assertSame('clinicOwner', $klinikSahibi->role_id);
        $this->assertNotNull($klinikSahibi->clinic_id);
    }

    /** En kritik sınır: demo adresine ait olmayan bir hesap açılmamalı. */
    public function test_gercek_hesap_bu_yoldan_acilmaz(): void
    {
        $gercek = User::factory()->doctor()->create([
            'is_verified'   => false,
            'is_crm_active' => false,
        ]);

        $this->get('/api/demo-login/doktor')->assertRedirect();

        $gercek->refresh();
        $this->assertFalse((bool) $gercek->is_verified);
        $this->assertFalse((bool) $gercek->is_crm_active);
    }

    /** Ayardaki adres başka role aitse hiçbir şey yapılmamalı. */
    public function test_adres_baska_role_aitse_acilmaz(): void
    {
        User::factory()->patient()->create(['email' => 'demo-doktor@test.local']);

        $this->get('/api/demo-login/doktor')->assertStatus(404);
    }

    public function test_kapatilinca_uc_nokta_yok_olur(): void
    {
        config(['demo.enabled' => false]);

        $this->get('/api/demo-login/doktor')->assertNotFound();
    }

    public function test_anahtar_tanimliysa_zorunlu_olur(): void
    {
        config(['demo.login_key' => 'gizli']);

        $this->get('/api/demo-login/doktor')->assertNotFound();
        $this->get('/api/demo-login/doktor?key=yanlis')->assertNotFound();
        $this->get('/api/demo-login/doktor?key=gizli')->assertRedirect();
    }

    /**
     * Jeton adres çubuğunda taşınıyor. Hedef bize ait değilse jetonu üçüncü
     * bir tarafa göndermiş oluruz — bir kez oldu, yanlış varsayılan yüzünden
     * park edilmiş bir alan adına gitti.
     */
    public function test_bize_ait_olmayan_adrese_jeton_gonderilmez(): void
    {
        config(['demo.frontend_url' => 'https://baskasinin-sitesi.com']);

        $this->get('/api/demo-login/doktor')->assertStatus(500);
    }

    public function test_taninmayan_rol_acilmaz(): void
    {
        $this->get('/api/demo-login/superAdmin')->assertNotFound();
        $this->get('/api/demo-login/admin')->assertNotFound();
    }
}
