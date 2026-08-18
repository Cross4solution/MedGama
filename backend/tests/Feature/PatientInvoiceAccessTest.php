<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Hastanın kendi faturalarına erişimi.
 *
 * Fatura hastanın adını, aldığı hizmeti ve tutarı taşır — yani sağlık
 * verisidir. Hasta kendi kaydını görebilmeli, başkasınınkini kimliğini
 * bilse bile görememeli.
 */
class PatientInvoiceAccessTest extends TestCase
{
    use RefreshDatabase;

    private function fatura(User $hasta, User $doktor, array $ek = []): Invoice
    {
        return Invoice::create(array_merge([
            'invoice_number' => Invoice::generateInvoiceNumber(),
            'patient_id'     => $hasta->id,
            'doctor_id'      => $doktor->id,
            'subtotal'       => 100,
            'tax_rate'       => 0,
            'tax_amount'     => 0,
            'discount_amount' => 0,
            'grand_total'    => 100,
            'currency'       => 'EUR',
            'status'         => 'pending',
            'issue_date'     => now()->toDateString(),
        ], $ek));
    }

    public function test_hasta_kendi_faturalarini_gorur(): void
    {
        $hasta  = User::factory()->create(['role_id' => 'patient']);
        $doktor = User::factory()->doctor()->create();
        $this->fatura($hasta, $doktor);

        Sanctum::actingAs($hasta);
        $yanit = $this->getJson('/api/patient/billing/invoices')->assertOk();

        $this->assertCount(1, $yanit->json('data'));
    }

    public function test_baskasinin_faturasi_listede_gorunmez(): void
    {
        $hasta   = User::factory()->create(['role_id' => 'patient']);
        $baskasi = User::factory()->create(['role_id' => 'patient']);
        $doktor  = User::factory()->doctor()->create();
        $this->fatura($baskasi, $doktor);

        Sanctum::actingAs($hasta);
        $yanit = $this->getJson('/api/patient/billing/invoices')->assertOk();

        $this->assertCount(0, $yanit->json('data'));
    }

    /** Kimliği bilinse bile başkasının faturası tekil olarak da açılmamalı. */
    public function test_baskasinin_faturasi_kimlikle_de_acilmaz(): void
    {
        $hasta   = User::factory()->create(['role_id' => 'patient']);
        $baskasi = User::factory()->create(['role_id' => 'patient']);
        $doktor  = User::factory()->doctor()->create();
        $fatura  = $this->fatura($baskasi, $doktor);

        Sanctum::actingAs($hasta);
        $this->getJson("/api/patient/billing/invoices/{$fatura->id}")->assertNotFound();
        $this->get("/api/patient/billing/invoices/{$fatura->id}/pdf")->assertNotFound();
    }

    public function test_hasta_kendi_faturasini_acar(): void
    {
        $hasta  = User::factory()->create(['role_id' => 'patient']);
        $doktor = User::factory()->doctor()->create();
        $fatura = $this->fatura($hasta, $doktor);

        Sanctum::actingAs($hasta);
        $this->getJson("/api/patient/billing/invoices/{$fatura->id}")
            ->assertOk()
            ->assertJsonPath('invoice_number', $fatura->invoice_number);
    }

    /** Salt okunur: hasta fatura kesemez, güncelleyemez, silemez. */
    public function test_hasta_fatura_yazamaz(): void
    {
        $hasta  = User::factory()->create(['role_id' => 'patient']);
        $doktor = User::factory()->doctor()->create();
        $fatura = $this->fatura($hasta, $doktor);

        Sanctum::actingAs($hasta);
        $this->postJson('/api/patient/billing/invoices', [])->assertStatus(405);
        $this->putJson("/api/patient/billing/invoices/{$fatura->id}", ['status' => 'paid'])->assertStatus(405);
        $this->deleteJson("/api/patient/billing/invoices/{$fatura->id}")->assertStatus(405);

        // CRM uçları da role kapısıyla kapalı olmalı.
        $this->putJson("/api/crm/billing/invoices/{$fatura->id}", ['status' => 'paid'])->assertForbidden();
    }
}
