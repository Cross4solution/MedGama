<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Yönetici işlemlerinin yetki üzerindeki etkisi.
 *
 * İki hata bulundu, ikisi de "işlem yapıldı ama etkisi eksik" türünden —
 * ekranda her şey başarılı görünüyor.
 *
 * 1. YÖNETİCİ PAROLA SIFIRLAMA OTURUM KAPATMIYORDU.
 *    Bir yöneticinin parolayı sıfırlamasının sebebi genellikle hesabın ele
 *    geçirilmesidir. Ölçüldü: sıfırlamadan sonra eski jeton `/auth/me`
 *    çağrısını 200 ile geçiyordu — saldırgan içeride kalıyor, yönetici de
 *    kullanıcı da sorunun çözüldüğünü sanıyordu. Kullanıcının KENDİ parola
 *    değişimi oturumları zaten kapatıyordu (OturumYasamDongusuTest); eksik
 *    olan yönetici yoluydu.
 *
 * 2. ROL DEĞİŞİMİ `user_level` SÜTUNUNU GÜNCELLEMİYORDU.
 *    Ölçüldü:
 *        superAdmin → patient   : role_id=patient   ama user_level=5
 *        doctor     → superAdmin: role_id=superAdmin ama user_level=2
 *
 *    Sütun süs değil: `EnsureDoctorVerified` seviye 5'te hekim doğrulamasını
 *    tamamen atlıyor, `EnsureCanPublishMedStream` seviye 5'e yayın hakkı
 *    veriyor. Yani yetkisi ALINAN yönetici o yetkileri kullanmaya devam
 *    ediyor, yeni ATANAN yönetici ise hekim yolundan geçtiği için
 *    engelleniyordu. Eşleme iki ayrı yerde durduğu için ayrışmıştı; artık
 *    tek kaynak `User::SEVIYELER`.
 */
class YoneticiYetkiDegisimiTest extends TestCase
{
    use RefreshDatabase;

    private function yonetici(): User
    {
        return User::factory()->create(['role_id' => 'superAdmin', 'user_level' => 5]);
    }

    private function gecerliMi(string $jeton): bool
    {
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/auth/me')
            ->getStatusCode() === 200;
    }

    // ── Parola sıfırlama ──

    public function test_yonetici_parola_sifirlayinca_oturumlar_kapaniyor(): void
    {
        $kurban = User::factory()->patient()->create();
        $saldirgan = $kurban->createToken('ele-gecirilmis')->plainTextToken;

        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/admin/users/{$kurban->id}/reset-password", ['password' => 'YeniParola123!'])
            ->assertOk();

        $this->assertFalse($this->gecerliMi($saldirgan), 'parola sıfırlandı ama saldırganın oturumu ayakta');
        $this->assertSame(0, $kurban->fresh()->tokens()->count());
    }

    public function test_yeni_parolayla_giris_yapilabiliyor(): void
    {
        // Ters uç: oturumları kapatmak kullanıcıyı hesabından etmemeli.
        $kurban = User::factory()->patient()->create();

        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/admin/users/{$kurban->id}/reset-password", ['password' => 'YeniParola123!'])
            ->assertOk();

        app('auth')->forgetGuards();

        $this->postJson('/api/auth/login', [
            'email'    => $kurban->email,
            'password' => 'YeniParola123!',
        ])->assertOk();
    }

    // ── Rol değişimi ──

    public function test_rol_dusurulunce_seviye_de_dusuyor(): void
    {
        // ASIL SIZINTI: seviye 5 kalırsa hekim doğrulaması atlanmaya devam eder.
        $eskiYonetici = User::factory()->create(['role_id' => 'superAdmin', 'user_level' => 5]);

        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/admin/users/{$eskiYonetici->id}/role", ['role' => 'patient'])
            ->assertOk();

        $eskiYonetici->refresh();

        $this->assertSame('patient', $eskiYonetici->role_id);
        $this->assertSame(1, (int) $eskiYonetici->user_level, 'yetkisi alınan yönetici seviye 5 kaldı');
    }

    public function test_rol_yukseltilince_seviye_de_yukseliyor(): void
    {
        // Ters uç: yeni yönetici seviye 2'de kalırsa hekim yolundan geçer ve
        // kendi yönetici işlerinde engellenir.
        $hekim = User::factory()->doctor()->create(['user_level' => 2]);

        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/admin/users/{$hekim->id}/role", ['role' => 'superAdmin'])
            ->assertOk();

        $this->assertSame(5, (int) $hekim->fresh()->user_level);
    }

    public function test_rol_degisimi_oturumlari_kapatiyor(): void
    {
        // Oturum eski role göre açılmıştı; yetki değişince kapanmalı.
        $hedef = User::factory()->doctor()->create(['user_level' => 2]);
        $jeton = $hedef->createToken('cihaz')->plainTextToken;

        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/admin/users/{$hedef->id}/role", ['role' => 'patient'])
            ->assertOk();

        $this->assertFalse($this->gecerliMi($jeton), 'rol değişti ama eski oturum ayakta');
    }

    public function test_kayit_ve_rol_degisimi_ayni_seviyeyi_veriyor(): void
    {
        // Eşleme iki yerde ayrı durduğu için ayrışmıştı. Ölçüt: kayıtla gelen
        // seviye ile rol değişiminden gelen seviye AYNI olmalı.
        foreach (['patient' => 1, 'doctor' => 2, 'clinicOwner' => 3, 'hospital' => 4, 'superAdmin' => 5] as $rol => $beklenen) {
            $this->assertSame($beklenen, User::seviyeIcin($rol), "{$rol} seviyesi beklenenden farklı");
        }

        $this->assertSame(1, User::seviyeIcin('bilinmeyen_rol'), 'bilinmeyen rol yükseltilmiş seviye aldı');
        $this->assertSame(1, User::seviyeIcin(null));
    }

    public function test_yonetici_olmayan_bu_uclara_giremiyor(): void
    {
        // Kapının kendisi: rol ara katmanı düşerse bu testler anlamsız kalır.
        $hasta = User::factory()->patient()->create();
        $hedef = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')
            ->putJson("/api/admin/users/{$hedef->id}/role", ['role' => 'superAdmin'])
            ->assertForbidden();

        app('auth')->forgetGuards();

        $this->actingAs($hasta, 'sanctum')
            ->putJson("/api/admin/users/{$hedef->id}/reset-password", ['password' => 'Parola123!'])
            ->assertForbidden();
    }
}
