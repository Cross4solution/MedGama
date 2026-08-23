<?php

namespace Tests\Feature;

use App\Models\ArchivedClinicRecord;
use App\Models\Clinic;
use App\Models\CrmProcessStage;
use App\Models\CrmTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRM etiketleri, süreç aşamaları ve arşiv kayıtları — klinik sınırı.
 *
 * Bu kontrolörün sekiz ucu hiç sınanmamıştı. Okuma tarafı `kapsamUygula` ile
 * varsayılan-ret kapsanıyordu; YAZMA tarafı kapsanmıyordu. Ölçüldü — B
 * kliniği, A kliniğinin hastasına ait süreç aşamasını değiştirebiliyordu:
 *
 *     PUT /api/crm/stages/{A'nın kaydı}  → 200, değer "B-degistirdi"
 *
 * Süreç aşaması hastanın tedavi sürecini anlatır ("ameliyat planlandı",
 * "kontrol bekliyor"). Başka bir kliniğin onu yazabilmesi hem veri
 * bütünlüğünü hem hasta güvenliğini ilgilendiriyor.
 *
 * İkinci hata aynı yerde: etiket silme `update(['is_active' => false])`
 * çağırıyordu ama `is_active` FILLABLE DEĞİL — güncelleme sessizce
 * düşüyordu. Uç "Tag deleted." diyor, etiket duruyordu.
 *
 * Kapsam SORGUYA uygulanıyor, bulunduktan sonra değil: kapsam dışı kayıt
 * 404 döner ve varlığı da ele verilmez.
 */
class CrmKayitKapsamiTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Clinic} */
    private function crmliKlinik(): array
    {
        $sahip = User::factory()->create(['role_id' => 'clinicOwner', 'user_level' => 3]);

        $klinik = Clinic::factory()->create([
            'owner_id'       => $sahip->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        return [$sahip->fresh(), $klinik];
    }

    private function etiket(User $sahip, Clinic $klinik, string $ad = 'etiket'): CrmTag
    {
        return CrmTag::create([
            'doctor_id'  => $sahip->id,
            'patient_id' => User::factory()->patient()->create()->id,
            'clinic_id'  => $klinik->id,
            'tag'        => $ad,
            'created_by' => $sahip->id,
        ]);
    }

    private function asama(User $sahip, Clinic $klinik, string $deger = 'ilk-asama'): CrmProcessStage
    {
        return CrmProcessStage::create([
            'doctor_id'  => $sahip->id,
            'patient_id' => User::factory()->patient()->create()->id,
            'clinic_id'  => $klinik->id,
            'stage'      => $deger,
            'started_at' => now()->toDateString(),
            'updated_by' => $sahip->id,
        ]);
    }

    // ── Yazma sınırı ──

    public function test_baska_klinigin_asamasi_degistirilemiyor(): void
    {
        // ASIL SIZINTI.
        [$sahipA, $klinikA] = $this->crmliKlinik();
        [$sahipB] = $this->crmliKlinik();

        $asama = $this->asama($sahipA, $klinikA, 'A-asamasi');

        $this->actingAs($sahipB, 'sanctum')
            ->putJson("/api/crm/stages/{$asama->id}", ['stage' => 'B-degistirdi'])
            ->assertNotFound();

        $this->assertSame('A-asamasi', $asama->fresh()->stage, 'başka klinik aşamayı değiştirdi');
    }

    public function test_baska_klinigin_etiketi_silinemiyor(): void
    {
        [$sahipA, $klinikA] = $this->crmliKlinik();
        [$sahipB] = $this->crmliKlinik();

        $etiket = $this->etiket($sahipA, $klinikA);

        $this->actingAs($sahipB, 'sanctum')
            ->deleteJson("/api/crm/tags/{$etiket->id}")
            ->assertNotFound();

        $this->assertTrue((bool) $etiket->fresh()->is_active, 'başka klinik etiketi sildi');
    }

    // ── Kendi kaydı ──

    public function test_klinik_kendi_asamasini_degistirebiliyor(): void
    {
        // Ters uç: kapsam fazla dar olursa CRM kullanılamaz hâle gelir ve
        // bunu yalnız "başkası değiştiremiyor" testleriyle fark edemezdik.
        [$sahip, $klinik] = $this->crmliKlinik();
        $asama = $this->asama($sahip, $klinik, 'baslangic');

        $this->actingAs($sahip, 'sanctum')
            ->putJson("/api/crm/stages/{$asama->id}", ['stage' => 'kontrol-bekliyor'])
            ->assertOk();

        $this->assertSame('kontrol-bekliyor', $asama->fresh()->stage);
    }

    public function test_etiket_silme_gercekten_siliyor(): void
    {
        // `is_active` fillable değil: `update()` sessizce düşüyordu ve uç
        // yine de "Tag deleted." diyordu.
        [$sahip, $klinik] = $this->crmliKlinik();
        $etiket = $this->etiket($sahip, $klinik);

        $this->actingAs($sahip, 'sanctum')
            ->deleteJson("/api/crm/tags/{$etiket->id}")
            ->assertOk();

        $this->assertFalse((bool) $etiket->fresh()->is_active, 'silme isteği kaydı değiştirmedi');

        app('auth')->forgetGuards();

        $listede = collect(
            $this->actingAs($sahip, 'sanctum')->getJson('/api/crm/tags')->assertOk()->json('data')
        )->pluck('id');

        $this->assertNotContains($etiket->id, $listede, 'silinen etiket listede duruyor');
    }

    // ── Okuma sınırı ──

    public function test_listeler_baska_klinigin_kaydini_gostermiyor(): void
    {
        [$sahipA, $klinikA] = $this->crmliKlinik();
        [$sahipB] = $this->crmliKlinik();

        $this->etiket($sahipA, $klinikA, 'A-etiketi');
        $this->asama($sahipA, $klinikA, 'A-asamasi');

        $etiketler = $this->actingAs($sahipB, 'sanctum')->getJson('/api/crm/tags')->assertOk()->json('data');
        app('auth')->forgetGuards();
        $asamalar = $this->actingAs($sahipB, 'sanctum')->getJson('/api/crm/stages')->assertOk()->json('data');

        $this->assertSame([], collect($etiketler)->pluck('tag')->intersect(['A-etiketi'])->values()->all());
        $this->assertSame([], collect($asamalar)->pluck('stage')->intersect(['A-asamasi'])->values()->all());
    }

    public function test_arsiv_kayitlari_klinige_kapsanmis(): void
    {
        [$sahipA, $klinikA] = $this->crmliKlinik();
        [$sahipB] = $this->crmliKlinik();

        ArchivedClinicRecord::create([
            'former_doctor_id'    => $sahipA->id,
            'clinic_id'           => $klinikA->id,
            'archived_patient_id' => User::factory()->patient()->create()->id,
            'record_references'   => [],
            'archived_at'         => now()->toDateString(),
        ]);

        $gorunen = $this->actingAs($sahipB, 'sanctum')
            ->getJson('/api/crm/archived-records')->assertOk()->json('data');

        $this->assertSame([], $gorunen, 'başka kliniğin arşiv kaydı görünüyor');
    }
}
