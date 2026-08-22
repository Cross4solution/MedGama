<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Site haritası kimleri arama motorlarına bildiriyor.
 *
 * /sitemap.xml herkese açık ve arama motorlarına gönderiliyor. Buraya giren
 * her adres, o profilin dizine eklenmesi için davet demek.
 *
 * Süzgeç olmayan bir sütuna (`is_suspended`) bakıyordu: ne göçlerde ne
 * modelde var, kodda yalnızca burada geçiyordu. Sonuç — arka uçtaki
 * /sitemap.xml her istekte 500 veriyordu.
 *
 * Not: arama motorlarının okuduğu harita bu değil; onu Next.js üretiyor ve
 * beslendiği /api/doctors zaten is_active süzüyor. Yani silinen hesaplar
 * canlı haritaya hiç girmiyordu. Buradaki arıza kopya ve bozuk bir uçtu.
 */
class SiteHaritasiTest extends TestCase
{
    use RefreshDatabase;

    public function test_aktif_doktor_haritada_var(): void
    {
        $doktor = User::factory()->doctor()->create([
            'fullname'  => 'Dr. Aktif',
            'is_active' => true,
        ]);

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee($doktor->id, false);
    }

    public function test_hesabi_silinen_doktor_haritada_yok(): void
    {
        $doktor = User::factory()->doctor()->create(['fullname' => 'Dr. Silinecek']);

        $this->actingAs($doktor, 'sanctum')
            ->deleteJson('/api/auth/profile')
            ->assertOk();

        app('auth')->forgetGuards();

        $icerik = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringNotContainsString(
            $doktor->id,
            $icerik,
            'Hesabını silen doktorun profili hâlâ arama motorlarına bildiriliyor',
        );
    }

    public function test_pasif_klinik_haritada_yok(): void
    {
        // Klinikler artık clinics tablosundan geliyor (users'ta codename yok).
        $klinik = \App\Models\Clinic::factory()->create();
        $klinik->forceFill(['is_active' => false])->save();

        $icerik = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringNotContainsString($klinik->id, $icerik);
    }

    public function test_harita_gecerli_xml_donuyor(): void
    {
        User::factory()->doctor()->create(['fullname' => 'Dr. Test']);

        $icerik = $this->get('/sitemap.xml')->assertOk()->getContent();

        // Bozuk XML'i arama motoru tamamen yok sayar; içeriğin doğru olması
        // biçimi geçerli olmadan bir işe yaramıyor.
        $this->assertStringContainsString('<urlset', $icerik);
        $this->assertNotFalse(simplexml_load_string($icerik), 'Site haritası geçerli XML değil');
    }
}
