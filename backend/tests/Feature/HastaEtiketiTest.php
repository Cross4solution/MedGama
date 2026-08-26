<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\CrmTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hasta etiketi silme — `DELETE /api/crm/patients/tags/{tagId}`.
 *
 * Kapsanmayan yazma uçlarının sonuncusu. Etiket, bir hastanın CRM kaydına
 * iliştirilen not niteliğinde bir işaret ("kontrol bekliyor", "ödeme yapıldı"
 * gibi) ve hangi hekim/klinik tarafından konduğu kayıtlı.
 *
 * Silme kapsamı `kapsamUygula` ile çiziliyor ve orada dikkate değer bir karar
 * var: bağı olmayan bir klinik sahibi ya da tanınmayan bir rol için sorgu
 * `whereRaw('1 = 0')` ile KAPALI düşüyor — yani kapsam belirlenemiyorsa hiçbir
 * şey silinmiyor. Bu ölçüt asıl o kararı tutuyor: sessizce "kapsam yok, hepsi
 * senin" tarafına düşen bir değişiklik, bir kliniğin başka bir kliniğin
 * kayıtlarını silmesi demek olurdu.
 *
 * Silme yumuşak: kayıt duruyor, `is_active` düşüyor.
 */
class HastaEtiketiTest extends TestCase
{
    use RefreshDatabase;

    private User $hekim;
    private User $hasta;
    private Clinic $klinik;
    private User $klinikSahibi;

    protected function setUp(): void
    {
        parent::setUp();

        $this->klinikSahibi = User::factory()->clinicOwner()->create();
        $this->klinik = Clinic::factory()->create([
            'owner_id'       => $this->klinikSahibi->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $this->klinikSahibi->forceFill([
            'clinic_id'      => $this->klinik->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        $this->hekim = User::factory()->doctor()->create([
            'clinic_id'   => $this->klinik->id,
            'is_verified' => true,
        ]);
        $this->hekim->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->addYear()])->save();

        $this->hasta = User::factory()->patient()->create();
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function etiket(array $govde = []): CrmTag
    {
        return CrmTag::create(array_merge([
            'doctor_id'  => $this->hekim->id,
            'patient_id' => $this->hasta->id,
            'clinic_id'  => $this->klinik->id,
            'tag'        => 'kontrol-bekliyor',
            'created_by' => $this->hekim->id,
        ], $govde));
    }

    public function test_kendi_etiketi_silinebiliyor_ve_kayit_duruyor(): void
    {
        $etiket = $this->etiket();

        $this->olarak($this->hekim)
            ->deleteJson("/api/crm/patients/tags/{$etiket->id}")
            ->assertOk();

        $kayit = CrmTag::find($etiket->id);

        $this->assertNotNull($kayit, 'etiket kaydı tamamen silinmiş: yumuşak silme bekleniyordu');
        $this->assertFalse((bool) $kayit->is_active);
    }

    public function test_baska_klinigin_etiketi_silinemiyor(): void
    {
        $digerSahip = User::factory()->clinicOwner()->create();
        $digerKlinik = Clinic::factory()->create([
            'owner_id'       => $digerSahip->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $digerSahip->forceFill([
            'clinic_id'      => $digerKlinik->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        $etiket = $this->etiket();

        $this->olarak($digerSahip)
            ->deleteJson("/api/crm/patients/tags/{$etiket->id}")
            ->assertStatus(404);

        $this->assertTrue((bool) CrmTag::find($etiket->id)->is_active, 'başka klinik etiketi düşürdü');
    }

    public function test_baska_hekimin_etiketi_silinemiyor(): void
    {
        // Aynı klinikteki bir hekim bile başkasının etiketini silememeli:
        // hekim kapsamı `doctor_id` ile çiziliyor.
        $digerHekim = User::factory()->doctor()->create([
            'clinic_id'   => $this->klinik->id,
            'is_verified' => true,
        ]);
        $digerHekim->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->addYear()])->save();

        $etiket = $this->etiket();

        $this->olarak($digerHekim)
            ->deleteJson("/api/crm/patients/tags/{$etiket->id}")
            ->assertStatus(404);

        $this->assertTrue((bool) CrmTag::find($etiket->id)->is_active);
    }

    public function test_klinigi_olmayan_sahip_hicbir_etiketi_silemiyor(): void
    {
        // Asıl mesele bu: kapsam belirlenemediğinde sorgu KAPALI düşmeli.
        // "Bağ yoksa süzgeç de yok" tarafına kayan bir değişiklik, bu kullanıcıya
        // bütün kliniklerin etiketlerini açardı.
        $bagsiz = User::factory()->clinicOwner()->create(['clinic_id' => null]);
        $bagsiz->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->addYear()])->save();

        $etiket = $this->etiket();

        $yanit = $this->olarak($bagsiz)->deleteJson("/api/crm/patients/tags/{$etiket->id}");

        // 403 ya da 404 — ikisi de reddetme. Kliniği olmayan sahip zaten
        // `crm.access` kapısında duruyor; asıl ölçülen, ETİKETİN DURMASI.
        $this->assertContains($yanit->status(), [403, 404]);

        $this->assertTrue((bool) CrmTag::find($etiket->id)->is_active, 'bağsız klinik sahibi etiket düşürdü');
    }

    public function test_zaten_pasif_etiket_bulunamiyor(): void
    {
        $etiket = $this->etiket();
        // Doğrudan atama: `is_active` fillable değil, `update()` onu düşürür —
        // testin kurulumu da aynı tuzağa takılıyordu.
        $etiket->is_active = false;
        $etiket->save();

        $this->olarak($this->hekim)
            ->deleteJson("/api/crm/patients/tags/{$etiket->id}")
            ->assertStatus(404);
    }
}
