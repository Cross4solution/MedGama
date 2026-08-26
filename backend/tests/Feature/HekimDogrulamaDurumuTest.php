<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Doğrulama iki alanı birlikte yazmalı.
 *
 * `updateDoctorVerification()` yalnız `is_verified`i değiştiriyordu.
 * `verification_status` olduğu yerde kalıyordu ve iki alan ayrışıyordu:
 *
 *   hasta tarafı  → `is_verified` okuyor → hekim DOĞRULANMIŞ görünüyor
 *   hekim panosu  → `verification_status` okuyor → hâlâ "beklemede",
 *                   üstelik "belgelerinizi yükleyin" diyor
 *
 * Yani yönetici onayladıktan sonra hekim, hastaların çoktan güvendiği bir
 * doğrulamayı kendisi göremiyordu. Başvuru akışından geçmeden doğrudan
 * onaylanan her hekimde oluyordu.
 *
 * `DoctorDashboard.jsx` durumu şöyle seçiyor:
 *     user?.verification_status || (isVerified ? 'approved' : 'unverified')
 * yani saklanan değer varsa `is_verified` hiç dikkate alınmıyor.
 */
class HekimDogrulamaDurumuTest extends TestCase
{
    use RefreshDatabase;

    private function yonetici(): self
    {
        $admin = User::factory()->create(['role_id' => 'superAdmin', 'is_active' => true]);
        $jeton = $admin->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function hekim(): User
    {
        $hekim = User::factory()->doctor()->create(['is_verified' => false]);
        $hekim->forceFill(['verification_status' => 'pending'])->save();

        return $hekim;
    }

    public function test_onay_iki_alani_birden_yaziyor(): void
    {
        $hekim = $this->hekim();

        $this->yonetici()
            ->putJson("/api/admin/doctors/{$hekim->id}/verify", ['verified' => true])
            ->assertOk();

        $taze = $hekim->fresh();

        $this->assertTrue((bool) $taze->is_verified);
        $this->assertSame(
            'approved',
            $taze->verification_status,
            'hekim doğrulandı ama kendi panosu hâlâ beklemede diyor',
        );
    }

    public function test_geri_alma_da_iki_alani_birden_yaziyor(): void
    {
        $hekim = $this->hekim();
        $hekim->forceFill(['is_verified' => true, 'verification_status' => 'approved'])->save();

        $this->yonetici()
            ->putJson("/api/admin/doctors/{$hekim->id}/verify", ['verified' => false])
            ->assertOk();

        $taze = $hekim->fresh();

        $this->assertFalse((bool) $taze->is_verified);
        $this->assertSame(
            'unverified',
            $taze->verification_status,
            'doğrulama geri alındı ama durum hâlâ onaylı görünüyor',
        );
    }

    public function test_karar_denetime_yaziliyor(): void
    {
        // Bir hekimin doğrulanması hastaların güvendiği şey; kimin karar
        // verdiği kayıtta olmalı.
        $hekim = $this->hekim();

        $this->yonetici()
            ->putJson("/api/admin/doctors/{$hekim->id}/verify", ['verified' => true])
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'action'        => 'doctor.verified',
            'resource_type' => 'User',
            'resource_id'   => $hekim->id,
        ]);
    }
}
