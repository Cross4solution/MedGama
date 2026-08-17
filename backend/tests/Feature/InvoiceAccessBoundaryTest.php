<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Fatura erişim sınırı.
 *
 * Liste sorgusu kapsamlıydı ama tekil getirme kapsamsızdı: bir doktor,
 * başka bir doktorun faturasını kimliğini bilerek okuyabiliyor, PDF'ini
 * indirebiliyor, üstelik değiştirip iptal edebiliyordu. Fatura hastanın
 * adını, verilen hizmeti ve tutarı taşıyor.
 */
class InvoiceAccessBoundaryTest extends TestCase
{
    use RefreshDatabase;

    private User $sahibi;
    private User $yabanci;
    private Invoice $fatura;

    protected function setUp(): void
    {
        parent::setUp();

        $klinik = Clinic::factory()->create([
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $this->sahibi = User::factory()->doctor()->create([
            'clinic_id' => $klinik->id,
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $this->yabanci = User::factory()->doctor()->create([
            'is_crm_active' => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $hasta = User::factory()->patient()->create();

        $this->fatura = Invoice::create([
            'invoice_number' => 'FT-GIZLI',
            'patient_id'     => $hasta->id,
            'doctor_id'      => $this->sahibi->id,
            'clinic_id'      => $klinik->id,
            'subtotal'       => 500,
            'grand_total'    => 500,
            'paid_amount'    => 0,
            'currency'       => 'EUR',
            'status'         => 'pending',
            'issue_date'     => now()->toDateString(),
        ]);
    }

    public function test_faturanin_sahibi_okuyabilir(): void
    {
        Sanctum::actingAs($this->sahibi);

        $this->getJson("/api/crm/billing/invoices/{$this->fatura->id}")->assertOk();
    }

    public function test_yabanci_doktor_faturayi_okuyamaz(): void
    {
        Sanctum::actingAs($this->yabanci);

        $this->getJson("/api/crm/billing/invoices/{$this->fatura->id}")->assertStatus(404);
    }

    /** PDF ayrı bir uç; aynı sınıra tabi olmalı. */
    public function test_yabanci_doktor_fatura_pdfini_indiremez(): void
    {
        Sanctum::actingAs($this->yabanci);

        $this->get("/api/crm/billing/invoices/{$this->fatura->id}/pdf")->assertStatus(404);
    }

    /** Okumaktan daha ağırı: başkasının faturasını değiştirmek. */
    public function test_yabanci_doktor_faturayi_degistiremez(): void
    {
        Sanctum::actingAs($this->yabanci);

        $this->putJson("/api/crm/billing/invoices/{$this->fatura->id}", [
            'status' => 'paid',
        ])->assertStatus(404);

        $this->assertSame('pending', $this->fatura->fresh()->status);
    }

    public function test_yabanci_doktor_faturayi_iptal_edemez(): void
    {
        Sanctum::actingAs($this->yabanci);

        $this->deleteJson("/api/crm/billing/invoices/{$this->fatura->id}")->assertStatus(404);

        $this->assertNotNull(Invoice::find($this->fatura->id));
    }
}
