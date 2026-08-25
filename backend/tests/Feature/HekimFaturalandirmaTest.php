<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hekimin kendi faturalandırması — `/api/doctor/billing/*`.
 *
 * Yazma uçlarının kapsamı sayıldığında bu grup hiçbir testte geçmiyordu.
 * Klinik tarafı (`/api/crm/billing/*`) kapsanmıştı ve aynı denetleyiciyi
 * paylaştıkları için "zaten test edilmiş" görünüyordu — ama paylaşılan şey
 * denetleyici, ayrı olan şey KAPSAM: hangi faturaların kimin sayıldığı.
 * Yanlış kapsam sessizdir: uç 200 döner, ekran bir liste gösterir, yalnız
 * liste başkasının parasını gösterir.
 *
 * Ölçülen dört şey:
 *   • Fatura kesiliyor ve tutarı doğru hesaplanıyor.
 *   • Başka bir hekim o faturayı OKUYAMIYOR, değiştiremiyor, iptal edemiyor.
 *   • Silme gerçekten silmiyor — iptal ediyor. Kesilmiş bir faturanın kaydı
 *     kaybolursa muhasebe izi kopar.
 *   • Uç yalnız hekime açık: hasta ve klinik sahibi giremiyor.
 */
class HekimFaturalandirmaTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;
    private User $digerDoktor;
    private User $hasta;
    private User $klinikSahibi;

    protected function setUp(): void
    {
        parent::setUp();

        $this->klinikSahibi = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create([
            'owner_id'      => $this->klinikSahibi->id,
            'is_crm_active' => true,
        ]);
        $this->klinikSahibi->forceFill(['clinic_id' => $klinik->id])->save();

        $this->doktor = User::factory()->doctor()->create([
            'clinic_id'   => $klinik->id,
            'is_verified' => true,
        ]);
        $this->doktor->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        // Başka bir klinikte, tamamen ayrı bir hekim.
        $digerSahip = User::factory()->clinicOwner()->create();
        $digerKlinik = Clinic::factory()->create([
            'owner_id'      => $digerSahip->id,
            'is_crm_active' => true,
        ]);
        $this->digerDoktor = User::factory()->doctor()->create([
            'clinic_id'   => $digerKlinik->id,
            'is_verified' => true,
        ]);
        $this->digerDoktor->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        $this->hasta = User::factory()->patient()->create();
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** Hekimin kendi ucundan bir fatura keser, kimliğini döndürür. */
    private function faturaKes(array $govde = []): array
    {
        $yanit = $this->olarak($this->doktor)
            ->postJson('/api/doctor/billing/invoices', array_merge([
                'patient_id' => $this->hasta->id,
                'currency'   => 'EUR',
                'items'      => [
                    ['description' => 'Muayene', 'quantity' => 2, 'unit_price' => 150],
                ],
            ], $govde))
            ->assertStatus(201);

        $fatura = $yanit->json('data') ?? $yanit->json();

        $this->assertNotEmpty($fatura['id'] ?? null, 'fatura kimliği dönmedi');

        return $fatura;
    }

    public function test_hekim_kendi_faturasini_kesiyor_ve_tutar_dogru(): void
    {
        $fatura = $this->faturaKes();

        // 2 × 150 = 300. Aritmetik ayrıca kapsanmış durumda; buradaki soru
        // hekim ucunun aynı hesabı yapıp yapmadığı.
        $this->assertSame(300.0, (float) $fatura['grand_total']);

        $this->olarak($this->doktor)
            ->getJson("/api/doctor/billing/invoices/{$fatura['id']}")
            ->assertOk();
    }

    public function test_baska_hekim_faturayi_goremiyor(): void
    {
        $fatura = $this->faturaKes();

        // 404, 403 değil: faturanın VAR OLDUĞUNU bile söylememeli.
        $this->olarak($this->digerDoktor)
            ->getJson("/api/doctor/billing/invoices/{$fatura['id']}")
            ->assertStatus(404);
    }

    public function test_baska_hekimin_listesinde_gorunmuyor(): void
    {
        // Tekil okuma ile LİSTE ayrı sorgular ve ayrı kapsanıyorlar. İlk
        // ölçütüm yalnız tekil okumayı sınıyordu; listeden kapsamı kaldıran
        // bir değişiklik kırmızı yanmıyordu — yani başkasının faturası
        // listede görünebilirdi ve test bunu fark etmezdi.
        $fatura = $this->faturaKes();

        $liste = $this->olarak($this->digerDoktor)
            ->getJson('/api/doctor/billing/invoices')
            ->assertOk()
            ->json();

        $kayitlar = $liste['data']['data'] ?? $liste['data'] ?? [];
        $kimlikler = array_column(is_array($kayitlar) ? $kayitlar : [], 'id');

        $this->assertNotContains(
            $fatura['id'],
            $kimlikler,
            'başka hekimin faturası listede görünüyor',
        );
    }

    public function test_baska_hekim_faturayi_degistiremiyor_ve_iptal_edemiyor(): void
    {
        $fatura = $this->faturaKes();

        $this->olarak($this->digerDoktor)
            ->putJson("/api/doctor/billing/invoices/{$fatura['id']}", ['status' => 'paid'])
            ->assertStatus(404);

        $this->olarak($this->digerDoktor)
            ->deleteJson("/api/doctor/billing/invoices/{$fatura['id']}")
            ->assertStatus(404);

        // Kayıt değişmemiş olmalı: reddedilen istek yan etki bırakmasın.
        $this->assertNotSame('paid', Invoice::find($fatura['id'])->status);
    }

    public function test_silme_kaydi_yok_etmiyor_iptal_ediyor(): void
    {
        $fatura = $this->faturaKes();

        $this->olarak($this->doktor)
            ->deleteJson("/api/doctor/billing/invoices/{$fatura['id']}")
            ->assertOk();

        $kayit = Invoice::withTrashed()->find($fatura['id']);

        $this->assertNotNull($kayit, 'kesilmiş fatura veritabanından silinmiş: muhasebe izi kopuyor');
        $this->assertSame('cancelled', $kayit->status);
    }

    public function test_uc_yalnizca_hekime_acik(): void
    {
        foreach ([$this->hasta, $this->klinikSahibi] as $yabanci) {
            $this->olarak($yabanci)
                ->getJson('/api/doctor/billing/invoices')
                ->assertStatus(403);
        }
    }

    public function test_kalemsiz_fatura_kesilemiyor(): void
    {
        // Tutarsız bir fatura, sıfır tutarlı bir borç demek.
        $this->olarak($this->doktor)
            ->postJson('/api/doctor/billing/invoices', [
                'patient_id' => $this->hasta->id,
                'items'      => [],
            ])
            ->assertStatus(422);
    }
}
