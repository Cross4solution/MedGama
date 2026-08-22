<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\BreachNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AuditLog::log() çağrılarının imzaya uyduğu.
 *
 * Üç çağrı noktası var olmayan bir `user:` parametresi geçiyordu. PHP bunu
 * ölümcül hata sayıyor, dolayısıyla denetim kaydı yazmak yerine akışı
 * öldürüyordu:
 *
 *   • Doğrulama belgesi indirme  → her istek 500
 *   • Hasta anamnez güncelleme   → kayıt DÜŞÜYOR ama hasta 500 görüyor
 *   • Veri ihlali bildirimi      → try/catch içindeydi, kayıt SESSİZCE yok
 *
 * Üçüncüsü en sinsisi: hiçbir hata görünmüyor, yalnızca düzenleyiciye
 * sunulacak kanıt izi hiç oluşmuyor.
 *
 * Bu testler denetim kaydının GERÇEKTEN yazıldığını doğruluyor; yalnız
 * "istek 200 döndü" demek üçüncü vakayı kaçırırdı.
 */
class DenetimKaydiCagrilariTest extends TestCase
{
    use RefreshDatabase;

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_anamnez_guncellemesi_hata_vermiyor_ve_kayit_dusuyor(): void
    {
        $hasta = User::factory()->patient()->create();

        $this->olarak($hasta)
            ->putJson('/api/auth/profile/medical-history', [
                'conditions'  => ['Tip 2 diyabet'],
                'medications' => ['Metformin'],
                'notes'       => 'Aile oykusu var',
            ])
            ->assertOk();

        $this->assertSame(
            1,
            AuditLog::where('action', 'medical_history_updated')->count(),
            'anamnez güncellemesi denetim kaydı bırakmadı',
        );
    }

    public function test_veri_ihlali_bildirimi_denetim_kaydi_birakiyor(): void
    {
        // try/catch içinde olduğu için istisna yutuluyordu: akış "başarılı"
        // görünüyor, kanıt izi hiç yazılmıyordu.
        app(BreachNotificationService::class)->notifyBreach([
            'summary'     => 'Deneme ihlali',
            'reporter'    => 'admin',
            'detected_at' => now()->toDateTimeString(),
        ]);

        $this->assertSame(
            1,
            AuditLog::where('action', 'security.breach_reported')->count(),
            'veri ihlali bildirimi denetim kaydı bırakmadı',
        );
    }
}
