<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Satış hattı yazma uçları — `crm/leads/{id}/stage|assign|activities`.
 *
 * Üçü de hiçbir testte geçmiyordu ve aralarında biri, bir yazma ucundan
 * beklenmeyecek kadar ağır bir şey yapıyor: aşama `won`a çekildiğinde lead
 * OTOMATİK OLARAK bir hasta hesabına dönüşüyor. Yani bu uç kullanıcı yaratıyor.
 * İki kez çağrılırsa iki hesap yaratıp yaratmadığı ölçülmemişti.
 *
 * Kapsam kuralları da sessiz: `findAccessibleLead` iki ayrı sınır çiziyor —
 * başka kliniğin leadi ve satışçının kendisine atanmamış leadi. İkisi de
 * kaldırılsa uçlar 200 dönmeye devam eder, yalnız bir klinik rakibinin satış
 * hattını okur ve değiştirir.
 */
class SatisHattiTest extends TestCase
{
    use RefreshDatabase;

    private User $klinikSahibi;
    private Clinic $klinik;
    private User $satisci;
    private Lead $lead;

    private User $digerSahip;
    private Clinic $digerKlinik;

    protected function setUp(): void
    {
        parent::setUp();

        [$this->klinikSahibi, $this->klinik] = $this->klinikKur();
        [$this->digerSahip, $this->digerKlinik] = $this->klinikKur();

        $this->satisci = User::factory()->create([
            'role_id'   => 'salesperson',
            'clinic_id' => $this->klinik->id,
            'is_active' => true,
        ]);

        $this->lead = Lead::create([
            'clinic_id'          => $this->klinik->id,
            'full_name'          => 'Deneme Aday',
            'email'              => 'aday@ornek.test',
            'phone'              => '+905000000000',
            'stage'              => 'new',
            'treatment_interest' => 'Implant',
        ]);
    }

    /** @return array{0: User, 1: Clinic} */
    private function klinikKur(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create([
            'owner_id'       => $sahip->id,
            'is_active'      => true,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $sahip->forceFill([
            'clinic_id'      => $klinik->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        return [$sahip, $klinik];
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_baska_klinigin_leadi_okunamiyor_ve_degistirilemiyor(): void
    {
        $this->olarak($this->digerSahip)
            ->getJson("/api/crm/leads/{$this->lead->id}")
            ->assertStatus(403);

        $this->olarak($this->digerSahip)
            ->putJson("/api/crm/leads/{$this->lead->id}/stage", ['stage' => 'won'])
            ->assertStatus(403);

        $this->assertSame('new', $this->lead->fresh()->stage, 'reddedilen istek aşamayı değiştirmiş');
    }

    public function test_satisci_kendisine_atanmamis_leadi_degistiremiyor(): void
    {
        $this->olarak($this->satisci)
            ->putJson("/api/crm/leads/{$this->lead->id}/stage", ['stage' => 'contacted'])
            ->assertStatus(403);

        $this->assertSame('new', $this->lead->fresh()->stage);
    }

    public function test_satisci_atama_yapamiyor(): void
    {
        // Atama yöneticiye ait: satışçı kendini bir leade atayabilseydi kapsam
        // kuralının kendisi anlamsızlaşırdı.
        $this->lead->update(['assigned_to' => $this->satisci->id]);

        $this->olarak($this->satisci)
            ->putJson("/api/crm/leads/{$this->lead->id}/assign", ['assigned_to' => $this->satisci->id])
            ->assertStatus(403);
    }

    public function test_baska_klinigin_satiscisina_atanamiyor(): void
    {
        $yabanciSatisci = User::factory()->create([
            'role_id'   => 'salesperson',
            'clinic_id' => $this->digerKlinik->id,
        ]);

        $this->olarak($this->klinikSahibi)
            ->putJson("/api/crm/leads/{$this->lead->id}/assign", ['assigned_to' => $yabanciSatisci->id])
            ->assertStatus(422);

        $this->assertNull($this->lead->fresh()->assigned_to);
    }

    public function test_kazanildi_asamasi_hastaya_donusturuyor_ve_ikinci_kez_donusturmuyor(): void
    {
        $oncekiHastaSayisi = User::where('role_id', 'patient')->count();

        $this->olarak($this->klinikSahibi)
            ->putJson("/api/crm/leads/{$this->lead->id}/stage", ['stage' => 'won'])
            ->assertOk();

        $lead = $this->lead->fresh();

        $this->assertNotNull($lead->converted_patient_id, 'kazanılan lead hastaya dönüşmedi');
        $this->assertSame(
            $oncekiHastaSayisi + 1,
            User::where('role_id', 'patient')->count(),
            'kazanılan lead bir hasta hesabı yaratmadı',
        );

        // Aynı aşamaya ikinci kez çekmek ikinci bir hesap yaratmamalı.
        $this->olarak($this->klinikSahibi)
            ->putJson("/api/crm/leads/{$this->lead->id}/stage", ['stage' => 'won'])
            ->assertOk();

        $this->assertSame(
            $oncekiHastaSayisi + 1,
            User::where('role_id', 'patient')->count(),
            'aynı lead ikinci kez hasta hesabı yarattı',
        );
        $this->assertSame($lead->converted_patient_id, $this->lead->fresh()->converted_patient_id);
    }

    public function test_epostasiz_lead_ikinci_kez_hesap_yaratmiyor(): void
    {
        // İlk ölçütüm e-postalı bir lead kullanıyordu ve `converted_patient_id`
        // korumasını kaldıran mutasyona kırmızı yanmadı: e-posta varsa ikinci
        // dönüşüm MEVCUT hastayı buluyor, koruma gereksiz kalıyor.
        //
        // E-postasız leadde durum tersine dönüyor — adres
        // `lead-<rastgele>@leads.medagama.local` olarak üretiliyor, yani her
        // çağrı BAŞKA bir adres, dolayısıyla başka bir hesap. Orada korumayı
        // tutan tek şey `converted_patient_id`.
        $epostasiz = Lead::create([
            'clinic_id' => $this->klinik->id,
            'full_name' => 'E-postasız Aday',
            'phone'     => '+905000000001',
            'stage'     => 'new',
        ]);

        $oncesi = User::where('role_id', 'patient')->count();

        for ($i = 0; $i < 2; $i++) {
            $this->olarak($this->klinikSahibi)
                ->putJson("/api/crm/leads/{$epostasiz->id}/stage", ['stage' => 'won'])
                ->assertOk();
        }

        $this->assertSame(
            $oncesi + 1,
            User::where('role_id', 'patient')->count(),
            'e-postasız lead her dönüşümde yeni bir hasta hesabı yaratıyor',
        );
    }

    public function test_tanimsiz_asama_kabul_edilmiyor(): void
    {
        $this->olarak($this->klinikSahibi)
            ->putJson("/api/crm/leads/{$this->lead->id}/stage", ['stage' => 'uydurma-asama'])
            ->assertStatus(422);

        $this->assertSame('new', $this->lead->fresh()->stage);
    }

    public function test_baska_klinigin_leadine_etkinlik_yazilamiyor(): void
    {
        $this->olarak($this->digerSahip)
            ->postJson("/api/crm/leads/{$this->lead->id}/activities", [
                'type'        => 'note',
                'description' => 'Rakip kliniğin hattına düşen not',
            ])
            ->assertStatus(403);

        $this->assertDatabaseMissing('lead_activities', [
            'lead_id' => $this->lead->id,
            'user_id' => $this->digerSahip->id,
        ]);
    }
}
