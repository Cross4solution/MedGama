<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Doğrulama başvurusu kararları — onay, ret, bilgi isteme, geri alma.
 *
 * Yönetici panelinin en sonuçlu yazma yüzeyi: bu karar bir hekimin herkese
 * açık profilinde "doğrulanmış" rozetini belirliyor ve hasta randevu alırken
 * ona bakıyor.
 *
 * Dördü de kapsanmamıştı — yönetici oturumu açılamadığı için. Tohumda hiç
 * başvuru kaydı da yok, dolayısıyla elle deneme bile mümkün değildi; bu ölçüt
 * kendi kaydını kuruyor.
 *
 * Ölçülen dört şey:
 *   • Onay hekimi GERÇEKTEN doğruluyor (başvuru durumu tek başına yetmez).
 *   • Ret gerekçeyi saklıyor — karar sonradan açıklanabilir olmalı.
 *   • Geri alma kararı sıfırlıyor VE hekimin doğrulamasını da geri çekiyor;
 *     yalnız başvuruyu beklemede yapıp hekimi doğrulanmış bırakmak, geri
 *     almayı anlamsız kılardı.
 *   • Her karar denetim günlüğüne düşüyor.
 */
class DogrulamaBasvurusuTest extends TestCase
{
    use RefreshDatabase;

    private User $yoneticiKullanici;

    protected function setUp(): void
    {
        parent::setUp();

        $this->yoneticiKullanici = User::factory()->create([
            'role_id'   => 'superAdmin',
            'is_active' => true,
        ]);
    }

    private function yonetici(): self
    {
        $jeton = $this->yoneticiKullanici->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** @return array{0: User, 1: VerificationRequest} */
    private function basvuru(): array
    {
        $hekim = User::factory()->doctor()->create(['is_verified' => false]);
        $hekim->forceFill(['verification_status' => 'pending'])->save();

        $vr = VerificationRequest::create([
            'doctor_id'      => $hekim->id,
            'document_type'  => 'diploma',
            'document_label' => 'Diploma',
            'file_path'      => 'verification-documents/olcum.pdf',
            'file_name'      => 'olcum.pdf',
            'mime_type'      => 'application/pdf',
            'status'         => 'pending',
        ]);

        return [$hekim, $vr];
    }

    public function test_onay_hekimi_gercekten_dogruluyor(): void
    {
        [$hekim, $vr] = $this->basvuru();

        $this->yonetici()
            ->putJson("/api/admin/verification-requests/{$vr->id}/approve")
            ->assertOk();

        $this->assertSame('approved', $vr->fresh()->status);
        $this->assertTrue(
            (bool) $hekim->fresh()->is_verified,
            'başvuru onaylandı ama hekim doğrulanmadı: rozet hastaya görünmez',
        );
    }

    public function test_ret_gerekcesi_saklaniyor(): void
    {
        [$hekim, $vr] = $this->basvuru();

        $this->yonetici()
            ->putJson("/api/admin/verification-requests/{$vr->id}/reject", [
                'reason' => 'Belge okunaksız.',
            ])
            ->assertOk();

        $taze = $vr->fresh();

        $this->assertSame('rejected', $taze->status);
        $this->assertSame(
            'Belge okunaksız.',
            $taze->rejection_reason,
            'ret gerekçesi saklanmıyor: karar sonradan açıklanamaz',
        );
        $this->assertFalse((bool) $hekim->fresh()->is_verified);
    }

    public function test_geri_alma_karari_ve_dogrulamayi_birlikte_siliyor(): void
    {
        [$hekim, $vr] = $this->basvuru();

        $this->yonetici()
            ->putJson("/api/admin/verification-requests/{$vr->id}/approve")
            ->assertOk();

        $this->assertTrue((bool) $hekim->fresh()->is_verified);

        $this->yonetici()
            ->putJson("/api/admin/verification-requests/{$vr->id}/undo")
            ->assertOk();

        $this->assertSame('pending', $vr->fresh()->status);
        $this->assertFalse(
            (bool) $hekim->fresh()->is_verified,
            'karar geri alındı ama hekim doğrulanmış kaldı: geri alma yarım',
        );
    }

    public function test_her_karar_denetime_yaziliyor(): void
    {
        [, $vr] = $this->basvuru();

        $once = \DB::table('audit_logs')->count();

        $this->yonetici()->putJson("/api/admin/verification-requests/{$vr->id}/approve")->assertOk();

        $this->assertGreaterThan(
            $once,
            \DB::table('audit_logs')->count(),
            'doğrulama kararı denetime yazılmıyor: kimin onayladığı kayıtta yok',
        );
    }

    public function test_yonetici_olmayan_karar_veremiyor(): void
    {
        [, $vr] = $this->basvuru();

        foreach ([
            User::factory()->patient()->create(),
            User::factory()->doctor()->create(['is_verified' => true]),
            User::factory()->clinicOwner()->create(),
        ] as $yabanci) {
            $jeton = $yabanci->createToken('test')->plainTextToken;
            app('auth')->forgetGuards();

            $this->withHeader('Authorization', 'Bearer ' . $jeton)
                ->putJson("/api/admin/verification-requests/{$vr->id}/approve")
                ->assertStatus(403);
        }

        $this->assertSame('pending', $vr->fresh()->status);
    }
}
