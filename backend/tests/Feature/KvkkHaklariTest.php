<?php

namespace Tests\Feature;

use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Veri sahibinin hakları — dışa aktarma ve hesap silme.
 *
 * İkisi de yasal yükümlülük (KVKK md. 11, GDPR md. 15/17/20) ve ikisinin de
 * hiç testi yoktu. Bu uçlar bozulduğunda kimse fark etmez: kullanıcı bir kez
 * kullanır, sonuç yanlışsa da anlamaz. Denetimde ortaya çıkar.
 *
 * Sınananlar:
 *   • Dışa aktarma kullanıcının KENDİ verisini veriyor, başkasınınkini değil.
 *   • Silme sonrası hesapla giriş yapılamıyor ve mevcut oturumlar kapanıyor.
 *   • Silme kimlik bilgilerini anonimleştiriyor.
 *   • Silme başka kullanıcıların verisine dokunmuyor.
 */
class KvkkHaklariTest extends TestCase
{
    use RefreshDatabase;

    // ── Dışa aktarma (GDPR md. 20) ───────────────────────────────────

    public function test_kullanici_kendi_verisini_disa_aktarabiliyor(): void
    {
        $kullanici = User::factory()->patient()->create([
            'fullname' => 'Ayşe Yılmaz',
            'email'    => 'ayse@ornek.test',
        ]);

        $govde = $this->actingAs($kullanici, 'sanctum')
            ->getJson('/api/auth/profile/data-export')
            ->assertOk()
            ->json();

        $veri = $govde['data'] ?? $govde;

        $this->assertSame('ayse@ornek.test', data_get($veri, 'user.email'));
        $this->assertSame('Ayşe Yılmaz', data_get($veri, 'user.fullname'));
        $this->assertTrue((bool) data_get($veri, 'gdpr_export'), 'Dışa aktarma işareti yok');
    }

    public function test_disa_aktarma_baskasinin_verisini_icermiyor(): void
    {
        $kullanici = User::factory()->patient()->create();
        $baskasi   = User::factory()->doctor()->create(['is_verified' => true]);

        MedStreamPost::factory()->create([
            'author_id' => $baskasi->id,
            'content'   => 'BASKASININ-GONDERISI',
        ]);

        $ham = $this->actingAs($kullanici, 'sanctum')
            ->getJson('/api/auth/profile/data-export')
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString(
            'BASKASININ-GONDERISI',
            $ham,
            'Dışa aktarma başka kullanıcının içeriğini taşıyor',
        );
        $this->assertStringNotContainsString($baskasi->email, $ham);
    }

    public function test_oturumsuz_disa_aktarma_yapilamiyor(): void
    {
        $this->getJson('/api/auth/profile/data-export')->assertUnauthorized();
    }

    // ── Silme (GDPR md. 17) ──────────────────────────────────────────

    public function test_silme_sonrasi_ayni_sifreyle_giris_yapilamiyor(): void
    {
        $kullanici = User::factory()->patient()->create([
            'email'    => 'silinecek@ornek.test',
            'password' => 'Medagama2026Guclu!',
        ]);

        $this->actingAs($kullanici, 'sanctum')
            ->deleteJson('/api/auth/profile')
            ->assertOk();

        // Ölçüt "kayıt silindi mi" değil — hesabın gerçekten kapandığı.
        $this->postJson('/api/auth/login', [
            'email'    => 'silinecek@ornek.test',
            'password' => 'Medagama2026Guclu!',
        ])->assertStatus(422);
    }

    public function test_silme_mevcut_oturumlari_kapatiyor(): void
    {
        $kullanici = User::factory()->patient()->create();
        $jeton = $kullanici->createToken('telefon')->plainTextToken;

        $this->actingAs($kullanici, 'sanctum')
            ->deleteJson('/api/auth/profile')
            ->assertOk();

        // actingAs, testin geri kalanında oturumu açık bırakıyor; temizlemeden
        // yapılan istek jeton başlığını hiç kullanmaz ve test yanlış yere
        // "jeton hâlâ geçerli" der.
        app('auth')->forgetGuards();

        // Elde kalan jeton çalışmaya devam ederse silme yarım kalmış olur.
        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_silme_kimlik_bilgilerini_anonimlestiriyor(): void
    {
        $kullanici = User::factory()->patient()->create([
            'fullname' => 'Ayşe Yılmaz',
            'email'    => 'ayse@ornek.test',
            'mobile'   => '+905551112233',
        ]);

        $this->actingAs($kullanici, 'sanctum')->deleteJson('/api/auth/profile')->assertOk();

        $sonrasi = $kullanici->fresh();
        $this->assertNotSame('ayse@ornek.test', $sonrasi->email, 'E-posta olduğu gibi duruyor');
        $this->assertNotSame('Ayşe Yılmaz', $sonrasi->fullname, 'Ad soyad olduğu gibi duruyor');
        $this->assertNull($sonrasi->mobile, 'Telefon numarası silinmemiş');
        $this->assertFalse((bool) $sonrasi->is_active);
    }

    public function test_silme_baska_kullanicilara_dokunmuyor(): void
    {
        $silinen = User::factory()->patient()->create();
        $digeri  = User::factory()->patient()->create([
            'fullname' => 'Mehmet Aydın',
            'email'    => 'mehmet@ornek.test',
            'mobile'   => '+905559998877',
        ]);

        $this->actingAs($silinen, 'sanctum')->deleteJson('/api/auth/profile')->assertOk();

        $digeriSonra = $digeri->fresh();
        $this->assertSame('mehmet@ornek.test', $digeriSonra->email);
        $this->assertSame('Mehmet Aydın', $digeriSonra->fullname);
        $this->assertTrue((bool) $digeriSonra->is_active);
    }

    public function test_silinen_kullanicinin_gonderileri_akista_gorunmuyor(): void
    {
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);
        MedStreamPost::factory()->create([
            'author_id' => $doktor->id,
            'content'   => 'SILINEN-KULLANICININ-GONDERISI',
        ]);

        $this->actingAs($doktor, 'sanctum')->deleteJson('/api/auth/profile')->assertOk();

        $akis = $this->getJson('/api/medstream/posts?per_page=50')->assertOk()->getContent();

        $this->assertStringNotContainsString(
            'SILINEN-KULLANICININ-GONDERISI',
            $akis,
            'Hesabı silinen kullanıcının gönderisi akışta duruyor',
        );
    }
}
