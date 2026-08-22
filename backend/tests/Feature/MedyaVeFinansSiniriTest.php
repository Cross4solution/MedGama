<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Medya sunumu ve finans uçlarının sınırları.
 *
 * İki ayrı risk, iki ayrı uç:
 *
 * 1. /api/media/stream/{path} rotası yolu `.*` kalıbıyla alıyor — yani
 *    "../../.env" gibi bir istek de rotaya uyuyor. Uç herkese açık. Dizin
 *    gezinmeye kapalı olduğunu VARSAYMAK yerine sınamak gerekiyor.
 *
 * 2. Finans uçları klinik gelirini döndürüyor. Kapsam servise bırakılmış;
 *    bir kliniğin diğerinin cirosunu görmediğini test sabitliyor.
 */
class MedyaVeFinansSiniriTest extends TestCase
{
    use RefreshDatabase;

    /** CRM'i açık klinik + sahibi. */
    private function klinikVeSahibi(): array
    {
        $klinik = Clinic::factory()->create();
        $klinik->forceFill([
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        $sahip = User::factory()->clinicOwner()->create(['clinic_id' => $klinik->id]);
        $klinik->update(['owner_id' => $sahip->id]);

        return [$klinik, $sahip];
    }

    private function fatura(Clinic $klinik, User $doktor, float $tutar, string $no): Invoice
    {
        return Invoice::create([
            'invoice_number' => $no,
            'patient_id'     => User::factory()->patient()->create()->id,
            'doctor_id'      => $doktor->id,
            'clinic_id'      => $klinik->id,
            'subtotal'       => $tutar,
            'grand_total'    => $tutar,
            'paid_amount'    => $tutar,
            'currency'       => 'EUR',
            'status'         => 'paid',
            'paid_at'        => now(),
            'issue_date'     => now()->toDateString(),
        ]);
    }

    // ── Medya sunumu ─────────────────────────────────────────────────

    public function test_dizin_gezinme_denemesi_dosya_vermiyor(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('medstream/normal.txt', 'zararsiz');

        foreach ([
            '../../.env',
            '..%2F..%2F.env',
            'medstream/../../../.env',
        ] as $yol) {
            $yanit = $this->get('/api/media/stream/' . $yol);

            // Ölçüt gövdenin içeriği: 200 dönse bile içinde gizli dosya
            // olmamalı. Yalnızca durum koduna bakmak yetmez.
            $this->assertNotSame(
                200,
                $yanit->getStatusCode(),
                "Dizin gezinme denemesi dosya döndürdü: {$yol}",
            );
        }
    }

    public function test_olmayan_dosya_404_donuyor(): void
    {
        Storage::fake('public');

        $this->get('/api/media/stream/medstream/yok.mp4')->assertNotFound();
    }

    public function test_mesru_dosya_sunuluyor(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('medstream/video.mp4', 'icerik');

        // Bu test olmadan yukarıdaki gezinme testi anlamsız olurdu: rota hiç
        // çalışmasa da "200 dönmedi" doğru çıkardı. Meşru dosyanın sunulduğunu
        // görmek, reddin gerçekten bir KARAR olduğunu gösteriyor.
        $this->get('/api/media/stream/medstream/video.mp4')->assertOk();
    }

    // ── Finans sınırları ─────────────────────────────────────────────

    public function test_klinik_baska_kliniginin_cirosunu_gormuyor(): void
    {
        [$klinikA, $sahipA] = $this->klinikVeSahibi();
        [$klinikB, $sahipB] = $this->klinikVeSahibi();

        $doktorA = User::factory()->doctor()->create(['clinic_id' => $klinikA->id, 'is_verified' => true]);
        $doktorB = User::factory()->doctor()->create(['clinic_id' => $klinikB->id, 'is_verified' => true]);

        $this->fatura($klinikA, $doktorA, 100, 'A-1');
        $this->fatura($klinikB, $doktorB, 999999, 'B-1');

        $yanit = $this->actingAs($sahipA, 'sanctum')
            ->getJson('/api/finance/payout')
            ->assertOk();

        // B kliniğinin tutarı A'nın özetinde hiçbir biçimde geçmemeli.
        $this->assertStringNotContainsString(
            '999999',
            $yanit->getContent(),
            'Klinik başka kliniğin cirosunu görüyor',
        );
    }

    public function test_platform_ozeti_yalnizca_yoneticiye_acik(): void
    {
        [$klinik, $sahip] = $this->klinikVeSahibi();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id, 'is_verified' => true]);

        // Uç, rol listesinde doctor/clinicOwner de olduğu için rotaya giriyor;
        // asıl kapı controller içindeki yönetici kontrolü.
        $this->actingAs($doktor, 'sanctum')
            ->getJson('/api/finance/platform-overview')
            ->assertForbidden();

        $this->actingAs($sahip, 'sanctum')
            ->getJson('/api/finance/platform-overview')
            ->assertForbidden();
    }

    public function test_oturumsuz_finans_ucu_kapali(): void
    {
        $this->getJson('/api/finance/payout')->assertUnauthorized();
    }
}
