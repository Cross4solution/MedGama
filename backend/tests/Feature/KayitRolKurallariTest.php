<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Kayıt ve giriş için rol kuralları.
 *
 * Bu kurallar proje dokümanında "kritik" diye işaretli ama hiçbirinin testi
 * yoktu — yani ileride bir düzenleme sessizce bozabilirdi:
 *
 *   • Hasta ve doktor kayıtta e-posta doğrulaması ister.
 *   • Klinik, hastane ve yönetici rolleri kendiliğinden doğrulanır.
 *   • GİRİŞ HİÇBİR ZAMAN doğrulama ekranına düşürmez — doğrulama yalnızca
 *     kayıt akışına ait. Doğrulanmamış hasta bile jetonunu alır.
 *   • Kullanıcı adı kayıtta seçilir; rezerve ve alınmış adlar reddedilir,
 *     hiç gönderilmezse üretilir.
 *   • Hasta için sağlık verisi açık rızası zorunlu (KVKK md. 6 / GDPR md. 9).
 *
 * Hız sınırı bilerek devre dışı: kayıt ucu dakikada 3 istekle sınırlı ve
 * buradaki testler sınırı değil kuralları ölçüyor. Sınırın kendisi
 * HizSiniriYanitiTest'te sınanıyor.
 */
class KayitRolKurallariTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
        Mail::fake();
    }

    private function govde(array $ek = []): array
    {
        return array_merge([
            'email'               => 'yeni' . uniqid() . '@ornek.test',
            'password'            => 'Medagama2026Guclu!',
            'fullname'            => 'Ayşe Yılmaz',
            // Hasta kaydında doğum tarihi zorunlu: reşit olmayan başvuruda
            // veli e-postası isteniyor, yaş bilinmeden bu kural işletilemiyor.
            'date_of_birth'       => '1990-05-17',
            'health_data_consent' => true,
        ], $ek);
    }

    // ── Kayıt: rol bazlı doğrulama ────────────────────────────────────

    public function test_hasta_kaydinda_eposta_dogrulamasi_isteniyor(): void
    {
        $yanit = $this->postJson('/api/auth/register', $this->govde(['role_id' => 'patient']))
            ->assertCreated();

        $kullanici = User::where('email', $yanit->json('data.email'))->firstOrFail();
        $this->assertFalse((bool) $kullanici->email_verified, 'Hasta kendiliğinden doğrulanmış');
        $this->assertNotNull($kullanici->email_verification_code, 'Hastaya doğrulama kodu üretilmemiş');
    }

    public function test_doktor_kaydinda_eposta_dogrulamasi_isteniyor(): void
    {
        $yanit = $this->postJson('/api/auth/register', $this->govde(['role_id' => 'doctor']))
            ->assertCreated();

        $kullanici = User::where('email', $yanit->json('data.email'))->firstOrFail();
        $this->assertFalse((bool) $kullanici->email_verified, 'Doktor kendiliğinden doğrulanmış');
        $this->assertNotNull($kullanici->email_verification_code);
    }

    public function test_klinik_kaydi_kendiliginden_dogrulaniyor(): void
    {
        $yanit = $this->postJson('/api/auth/register', $this->govde([
            'role_id'     => 'clinicOwner',
            'clinic_name' => 'Deneme Kliniği',
        ]))->assertCreated();

        $kullanici = User::where('email', $yanit->json('data.email'))->firstOrFail();
        $this->assertTrue((bool) $kullanici->email_verified, 'Klinik hesabı doğrulanmamış');
        $this->assertNull($kullanici->email_verification_code, 'Klinik hesabında kod kalmış');
    }

    // ── Giriş: doğrulama giriş yolunu KAPATMAZ ────────────────────────

    public function test_dogrulanmamis_hasta_yine_de_giris_yapabiliyor(): void
    {
        $hasta = User::factory()->patient()->create([
            'email'          => 'dogrulanmamis@ornek.test',
            'password'       => 'Medagama2026Guclu!',
            'email_verified' => false,
        ]);

        $yanit = $this->postJson('/api/auth/login', [
            'email'    => $hasta->email,
            'password' => 'Medagama2026Guclu!',
        ])->assertOk();

        // Kritik kural: giriş doğrulama ekranına düşürmez.
        $this->assertNotEmpty($yanit->json('token') ?? $yanit->json('data.token'), 'Doğrulanmamış hastaya jeton verilmedi');
        $this->assertFalse(
            (bool) ($yanit->json('requires_email_verification') ?? $yanit->json('data.requires_email_verification')),
            'Giriş yanıtı doğrulama istiyor',
        );
    }

    public function test_klinik_girisi_hesabi_dogrulanmis_yapiyor(): void
    {
        $klinik = User::factory()->clinicOwner()->create([
            'email'          => 'klinik@ornek.test',
            'password'       => 'Medagama2026Guclu!',
            'email_verified' => false,
        ]);

        $this->postJson('/api/auth/login', [
            'email'    => $klinik->email,
            'password' => 'Medagama2026Guclu!',
        ])->assertOk();

        $this->assertTrue((bool) $klinik->fresh()->email_verified, 'Klinik girişte doğrulanmadı');
    }

    // ── Kullanıcı adı ─────────────────────────────────────────────────

    public function test_rezerve_kullanici_adi_reddediliyor(): void
    {
        $this->postJson('/api/auth/register', $this->govde(['username' => 'admin']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('username');
    }

    public function test_alinmis_kullanici_adi_reddediliyor(): void
    {
        User::factory()->patient()->create(['username' => 'ayse_yilmaz']);

        $this->postJson('/api/auth/register', $this->govde(['username' => 'ayse_yilmaz']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('username');
    }

    public function test_kullanici_adi_gonderilmezse_uretiliyor(): void
    {
        $yanit = $this->postJson('/api/auth/register', $this->govde())->assertCreated();

        $kullanici = User::where('email', $yanit->json('data.email'))->firstOrFail();
        $this->assertNotEmpty($kullanici->username, 'Kullanıcı adı üretilmedi');
        $this->assertMatchesRegularExpression('/^[a-z0-9_.]+$/', $kullanici->username);
    }

    // ── KVKK md. 6 / GDPR md. 9 ───────────────────────────────────────

    public function test_hasta_saglik_verisi_rizasi_olmadan_kayit_olamiyor(): void
    {
        $govde = $this->govde(['role_id' => 'patient']);
        unset($govde['health_data_consent']);

        $this->postJson('/api/auth/register', $govde)
            ->assertStatus(422)
            ->assertJsonValidationErrors('health_data_consent');
    }
}
