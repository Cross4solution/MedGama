<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRM ücretli bir özellik. Kullanıcı onu kendi kendine AÇAMAMALI.
 *
 * Risk somut: `Clinic` modelinde `is_crm_active` ve `crm_expires_at`
 * $fillable İÇİNDE (User'da bilinçle çıkarılmışlar). Bugün yazma yollarının
 * hepsi doğrulanmış açık dizi kullandığı için sömürülebilir değil — ama
 * korumanın tamamı denetleyicilerin dikkatine bağlı. Tek bir
 * `$clinic->update($request->all())` bedava abonelik demek.
 *
 * Bu yüzden test modele değil UÇLARA saldırıyor: kullanıcının eline geçen
 * her yazma yoluna alanı iliştirip, aboneliğin AÇILMADIĞINI doğruluyor.
 * Yeni bir uç toplu atamaya kayarsa buradan görülür.
 *
 * Ölçüt kasten "istek reddedilsin" değil: alanın sessizce elenmesi de kabul.
 * Önemli olan yanıtın kodu değil, veritabanındaki abonelik durumu.
 */
class CrmKendiKendineAcmaTest extends TestCase
{
    use RefreshDatabase;

    private function jetonla(User $user): string
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $jeton;
    }

    /** Klinik sahibi + kendi kliniği, aboneliği KAPALI. */
    private function sahipVeKlinik(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create([
            'owner_id'       => $sahip->id,
            'is_crm_active'  => false,
            'crm_expires_at' => null,
            'is_active'      => true,
        ]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        return [$sahip, $klinik];
    }

    private function aboneliginKapaliKaldigi(Clinic $klinik, string $yol): void
    {
        $klinik->refresh();

        $this->assertFalse(
            (bool) $klinik->is_crm_active,
            "[$yol] klinik kendi kendine CRM aboneliği kazandı",
        );
        $this->assertNull(
            $klinik->crm_expires_at,
            "[$yol] klinik kendine abonelik bitiş tarihi yazdı",
        );
    }

    public function test_klinik_guncellemesiyle_abonelik_acilamiyor(): void
    {
        [$sahip, $klinik] = $this->sahipVeKlinik();

        $this->withHeader('Authorization', 'Bearer ' . $this->jetonla($sahip))
            ->putJson("/api/clinics/{$klinik->id}", [
                'name'           => 'Yeni Ad',
                'is_crm_active'  => true,
                'crm_expires_at' => now()->addYears(10)->toDateTimeString(),
            ]);

        $this->aboneliginKapaliKaldigi($klinik, 'PUT /clinics/{id}');
    }

    public function test_onboarding_adimiyla_abonelik_acilamiyor(): void
    {
        // Onboarding, sahibin kendi kliniğine yazabildiği ikinci yol.
        [$sahip, $klinik] = $this->sahipVeKlinik();

        $this->withHeader('Authorization', 'Bearer ' . $this->jetonla($sahip))
            ->putJson('/api/clinic-onboarding', [
                'step'           => 0,
                'name'           => 'Onboarding Kliniği',
                'is_crm_active'  => true,
                'crm_expires_at' => now()->addYears(10)->toDateTimeString(),
            ]);

        $this->aboneliginKapaliKaldigi($klinik, 'PUT /clinic-onboarding');
    }

    public function test_profil_guncellemesiyle_kullanici_aboneligi_acilamiyor(): void
    {
        // Bağımsız doktorda abonelik KULLANICI üzerinde tutuluyor.
        $doktor = User::factory()->doctor()->create();
        $doktor->forceFill(['is_crm_active' => false, 'crm_expires_at' => null])->save();

        $this->withHeader('Authorization', 'Bearer ' . $this->jetonla($doktor))
            ->putJson('/api/auth/profile', [
                'fullname'       => 'Dr. Deneme',
                'is_crm_active'  => true,
                'crm_expires_at' => now()->addYears(10)->toDateTimeString(),
            ]);

        $doktor->refresh();

        $this->assertFalse((bool) $doktor->is_crm_active, 'doktor profilinden CRM açtı');
        $this->assertNull($doktor->crm_expires_at, 'doktor profilinden bitiş tarihi yazdı');
    }

    public function test_kayit_sirasinda_abonelik_istenemiyor(): void
    {
        // Kayıt gövdesi tamamen kullanıcı denetiminde; en açık saldırı yüzeyi.
        $this->postJson('/api/auth/register', [
            'fullname'              => 'Yeni Klinik Sahibi',
            'email'                 => 'yeni-sahip@ornek.test',
            'username'              => 'yenisahip',
            // uncompromised() kuralı var: sızıntı listesindeki parolalar reddediliyor
            'password'              => 'Kx7#mQ2vLp9$wRt4',
            'password_confirmation' => 'Kx7#mQ2vLp9$wRt4',
            'role_id'               => 'clinicOwner',
            'clinic_name'           => 'Bedava CRM Kliniği',
            'is_crm_active'         => true,
            'crm_expires_at'        => now()->addYears(10)->toDateTimeString(),
        ]);

        $kullanici = User::where('email', 'yeni-sahip@ornek.test')->first();
        $this->assertNotNull($kullanici, 'kayıt oluşmadı, test saldırıyı ölçemedi');

        $this->assertFalse((bool) $kullanici->is_crm_active, 'kayıtla kullanıcıya CRM verildi');

        $klinik = Clinic::where('owner_id', $kullanici->id)->first();
        $this->assertNotNull($klinik, 'clinicOwner kaydında klinik oluşmadı');
        $this->aboneliginKapaliKaldigi($klinik, 'POST /auth/register');
    }

    public function test_baskasinin_kliniginin_aboneligi_acilamiyor(): void
    {
        // Sahiplik denetimi ayrı bir koruma: alan elense bile yabancı klinik
        // hiç düzenlenememeli.
        [, $kurban] = $this->sahipVeKlinik();
        $yabanci = User::factory()->clinicOwner()->create();

        $this->withHeader('Authorization', 'Bearer ' . $this->jetonla($yabanci))
            ->putJson("/api/clinics/{$kurban->id}", [
                'name'          => 'Ele Geçirildi',
                'is_crm_active' => true,
            ])
            ->assertStatus(403);

        $this->aboneliginKapaliKaldigi($kurban, 'yabancı klinik PUT');
        $this->assertNotSame('Ele Geçirildi', $kurban->refresh()->name);
    }
}
