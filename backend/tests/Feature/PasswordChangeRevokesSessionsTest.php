<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Şifre değişimi açık oturumları kapatır.
 *
 * Çalınmış bir şifreyle giren kişi, sahibi şifreyi değiştirdikten sonra bile
 * elindeki jetonla hasta verisini okumaya devam edebiliyordu: şifre
 * değiştirmek saldırganı dışarı atmıyordu. Hesap ele geçirildiğinde
 * kullanıcının başvurduğu ilk çare bu olduğu için gerçek bir açıktı.
 */
class PasswordChangeRevokesSessionsTest extends TestCase
{
    use RefreshDatabase;

    private function kullaniciOlustur(): User
    {
        return User::factory()->doctor()->create([
            'password' => 'EskiSifre123!',
        ]);
    }

    public function test_sifre_degisince_tum_jetonlar_silinir(): void
    {
        Notification::fake();
        $kullanici = $this->kullaniciOlustur();

        $kullanici->createToken('telefon');
        $kullanici->createToken('saldirganin-cihazi');
        $this->assertSame(2, $kullanici->tokens()->count());

        Sanctum::actingAs($kullanici);
        $this->putJson('/api/auth/profile/password', [
            'current_password'      => 'EskiSifre123!',
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ])->assertOk()->assertJson(['relogin_required' => true]);

        $this->assertSame(0, $kullanici->tokens()->count());
    }

    /** Yanlış mevcut şifre reddedilir ve hiçbir oturum kapanmaz. */
    public function test_yanlis_mevcut_sifre_oturumlari_kapatmaz(): void
    {
        Notification::fake();
        $kullanici = $this->kullaniciOlustur();
        $kullanici->createToken('telefon');

        Sanctum::actingAs($kullanici);
        $this->putJson('/api/auth/profile/password', [
            'current_password'      => 'YanlisSifre999!',
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ])->assertStatus(422);

        $this->assertSame(1, $kullanici->tokens()->count());
    }

    /** Başka bir kullanıcının oturumlarına dokunulmaz. */
    public function test_baskasinin_oturumlari_etkilenmez(): void
    {
        Notification::fake();
        $kullanici = $this->kullaniciOlustur();
        $kullanici->createToken('telefon');

        $baskasi = User::factory()->doctor()->create();
        $baskasi->createToken('telefon');

        Sanctum::actingAs($kullanici);
        $this->putJson('/api/auth/profile/password', [
            'current_password'      => 'EskiSifre123!',
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ])->assertOk();

        $this->assertSame(1, $baskasi->tokens()->count());
    }

    /** Hesap sahibi haberdar edilir — değişikliği yapan o değilse tek uyarısı bu. */
    public function test_hesap_sahibine_bildirim_gider(): void
    {
        Notification::fake();
        $kullanici = $this->kullaniciOlustur();

        Sanctum::actingAs($kullanici);
        $this->putJson('/api/auth/profile/password', [
            'current_password'      => 'EskiSifre123!',
            'password'              => 'YeniSifre456!',
            'password_confirmation' => 'YeniSifre456!',
        ])->assertOk();

        Notification::assertSentTo($kullanici, PasswordChangedNotification::class);
    }
}
