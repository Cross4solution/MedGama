<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * E-posta doğrulama akışı.
 *
 * Doğrulamanın tek işi, adresin gerçekten o kişiye ait olduğunu göstermek.
 * Kod 6 haneli ve süresiz olduğu için, kendine özel bir hız sınırı yokken
 * deneyerek bulunabiliyordu — yani başkasının adresiyle kayıt olup hesabı
 * "doğrulanmış" göstermek mümkündü. Bu akışın hiç testi yoktu.
 */
class EpostaDogrulamaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Sınır sayaçları testler arasında taşınmamalı.
        RateLimiter::clear('auth-verify');
    }

    private function dogrulanmamis(): User
    {
        return User::factory()->patient()->create([
            'email_verified'          => false,
            'email_verification_code' => '123456',
        ]);
    }

    public function test_dogru_kod_hesabi_dogruluyor(): void
    {
        $k = $this->dogrulanmamis();

        $this->actingAs($k, 'sanctum')
            ->postJson('/api/auth/verify-email', ['code' => '123456'])
            ->assertOk();

        $k->refresh();
        $this->assertTrue((bool) $k->email_verified);
        $this->assertNull($k->email_verification_code, 'Kullanılan kod silinmedi');
    }

    public function test_yanlis_kod_reddediliyor(): void
    {
        $k = $this->dogrulanmamis();

        $this->actingAs($k, 'sanctum')
            ->postJson('/api/auth/verify-email', ['code' => '999999'])
            ->assertStatus(422);

        $this->assertFalse((bool) $k->fresh()->email_verified);
    }

    public function test_kod_denemesi_hiz_siniriyla_kesiliyor(): void
    {
        $k = $this->dogrulanmamis();

        $kodlar = ['111111', '222222', '333333', '444444', '555555'];
        foreach ($kodlar as $kod) {
            $this->actingAs($k, 'sanctum')
                ->postJson('/api/auth/verify-email', ['code' => $kod])
                ->assertStatus(422);
        }

        // Altıncı deneme sınıra takılmalı: sınırsız deneme, 6 haneli kodu
        // tahmin edilebilir kılıyordu.
        $this->actingAs($k, 'sanctum')
            ->postJson('/api/auth/verify-email', ['code' => '666666'])
            ->assertStatus(429);

        $this->assertFalse((bool) $k->fresh()->email_verified);
    }

    public function test_bir_kullanicinin_sinira_takilmasi_digerini_kilitlemiyor(): void
    {
        $a = $this->dogrulanmamis();
        $b = $this->dogrulanmamis();

        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($a, 'sanctum')->postJson('/api/auth/verify-email', ['code' => '000000']);
        }

        // Sınır kullanıcı başına: paylaşılan IP'deki ikinci kullanıcı
        // birincinin denemeleri yüzünden kilitlenmemeli.
        $this->actingAs($b, 'sanctum')
            ->postJson('/api/auth/verify-email', ['code' => '123456'])
            ->assertOk();
    }

    public function test_yeniden_gonderim_yeni_kod_uretiyor(): void
    {
        Mail::fake();
        $k = $this->dogrulanmamis();
        $eski = $k->email_verification_code;

        $this->actingAs($k, 'sanctum')
            ->postJson('/api/auth/resend-verification')
            ->assertOk();

        $yeni = $k->fresh()->email_verification_code;
        $this->assertNotNull($yeni);
        $this->assertNotSame($eski, $yeni, 'Yeniden gönderim aynı kodu bıraktı');
    }

    public function test_dogrulanmis_hesap_tekrar_dogrulamada_hata_almiyor(): void
    {
        $k = User::factory()->patient()->create([
            'email_verified'          => true,
            'email_verification_code' => null,
        ]);

        $this->actingAs($k, 'sanctum')
            ->postJson('/api/auth/verify-email', ['code' => '000000'])
            ->assertOk();
    }
}
