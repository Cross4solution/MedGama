<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Faq;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRM raporları ve SSS — iki kontrolör de hiç sınanmamıştı.
 *
 * Raporlar toplu sayı döndürüyor: randevu adedi, hasta sayısı, gelmeme oranı,
 * şehir dağılımı. Kapsam kaçarsa tek bir istek platformdaki bütün kliniklerin
 * hasta hacmini verir — rakip bir klinik için doğrudan ticari istihbarat.
 *
 * Kapsam zinciri ölçüldü ve SAĞLAM çıktı. Kritik ayrıntı, kliniği olmayan
 * kullanıcı için `clinic_id ?? '__none__'` yazılmış olması: `null` yazılsaydı
 * Laravel bunu `IS NULL`'a çevirir ve kliniğe bağlı OLMAYAN her randevuyu
 * eşlerdi — bu projede aynı hata beş ayrı yerde çıktı.
 *
 * Rota rol listesi de `salesperson`'ı dışarıda bırakıyor; kapsam zincirinde
 * o rol ele alınmadığı için içeri girseydi kapsamsız kalırdı. Test bunu da
 * sabitliyor: liste genişletilirse kapsam da genişletilmeli.
 */
class RaporVeSssTest extends TestCase
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

    private function randevu(Clinic $klinik, User $doktor): Appointment
    {
        return Appointment::factory()->create([
            'clinic_id'  => $klinik->id,
            'doctor_id'  => $doktor->id,
            'patient_id' => User::factory()->patient()->create()->id,
        ]);
    }

    // ── Rapor kapsamı ──

    public function test_klinik_yalnizca_kendi_randevularini_sayiyor(): void
    {
        [$sahipA, $klinikA] = $this->crmliKlinik();
        [$sahipB, $klinikB] = $this->crmliKlinik();

        $doktorA = User::factory()->doctor()->create(['clinic_id' => $klinikA->id]);
        $doktorB = User::factory()->doctor()->create(['clinic_id' => $klinikB->id]);

        $this->randevu($klinikA, $doktorA);
        $this->randevu($klinikB, $doktorB);
        $this->randevu($klinikB, $doktorB);

        $this->actingAs($sahipA, 'sanctum')
            ->getJson('/api/crm/reports/appointments')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_hasta_sayisi_baska_klinigi_icermiyor(): void
    {
        [$sahipA, $klinikA] = $this->crmliKlinik();
        [$sahipB, $klinikB] = $this->crmliKlinik();

        $doktorB = User::factory()->doctor()->create(['clinic_id' => $klinikB->id]);
        $this->randevu($klinikB, $doktorB);
        $this->randevu($klinikB, $doktorB);

        $this->actingAs($sahipA, 'sanctum')
            ->getJson('/api/crm/reports/patients')
            ->assertOk()
            ->assertJsonPath('total_patients', 0);
    }

    public function test_hekim_yalnizca_kendi_randevularini_goruyor(): void
    {
        [$sahip, $klinik] = $this->crmliKlinik();

        $benimHekim = User::factory()->doctor()->create(['clinic_id' => $klinik->id]);
        $digerHekim = User::factory()->doctor()->create(['clinic_id' => $klinik->id]);

        $this->randevu($klinik, $benimHekim);
        $this->randevu($klinik, $digerHekim);
        $this->randevu($klinik, $digerHekim);

        // Aynı klinikte bile hekim yalnız kendi randevusunu sayar.
        $this->actingAs($benimHekim, 'sanctum')
            ->getJson('/api/crm/reports/appointments')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_kliniksiz_kullanici_hicbir_sey_gormuyor(): void
    {
        // Tekrar eden hata sınıfı: boş kapsam değeri "hepsi" gibi davranıyor.
        // Kodda `clinic_id ?? '__none__'` yazılmış; `null` yazılsaydı Laravel
        // bunu `IS NULL`'a çevirir ve kliniğe bağlı OLMAYAN her randevuyu
        // eşlerdi.
        //
        // Kliniği olmayan bir HASTANE hesabı kullanılıyor: CRM aboneliği
        // hastanede kendi üzerinde tutuluyor, dolayısıyla uca girebiliyor ama
        // kapsam değeri boş. (Kliniksiz bir clinicOwner zaten aboneliksiz
        // olduğu için 403 alır — o yol bu kapsamı hiç sınamaz.)
        [$sahip, $klinik] = $this->crmliKlinik();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id]);
        $this->randevu($klinik, $doktor);

        $kliniksizHastane = User::factory()->create([
            'role_id'        => 'hospital',
            'user_level'     => 4,
            'clinic_id'      => null,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $this->actingAs($kliniksizHastane, 'sanctum')
            ->getJson('/api/crm/reports/appointments')
            ->assertOk()
            ->assertJsonPath('total', 0);
    }

    public function test_hasta_rapor_uclarina_giremiyor(): void
    {
        $this->actingAs(User::factory()->patient()->create(), 'sanctum')
            ->getJson('/api/crm/reports/appointments')
            ->assertForbidden();
    }

    public function test_rapor_rol_listesi_kapsanmayan_rol_icermiyor(): void
    {
        // YAPISAL: kapsam zinciri doctor / clinicOwner / hospital / admin
        // ele alıyor. Rota rol listesine bunların dışında biri eklenirse
        // (ör. salesperson) o rol KAPSAMSIZ kalır ve platformun tamamını
        // görür. Liste genişletilirse kapsam da genişletilmeli.
        $kapsanan = ['doctor', 'clinicOwner', 'hospital', 'superAdmin', 'saasAdmin'];

        $rota = collect(\Illuminate\Support\Facades\Route::getRoutes())
            ->first(fn ($r) => $r->uri() === 'api/crm/reports/appointments');

        $this->assertNotNull($rota);

        // `gatherMiddleware()` TAKMA ADI döndürüyor ('role:...'), çözülmüş
        // sınıf adını değil — `route:list` çıktısıyla karışmamalı.
        $rolAra = collect($rota->gatherMiddleware())
            ->first(fn ($m) => is_string($m) && str_starts_with($m, 'role:'));

        $this->assertNotNull($rolAra, 'rapor uçlarında rol denetimi yok');

        $roller = explode(',', explode(':', $rolAra)[1]);

        $this->assertSame(
            [],
            array_values(array_diff($roller, $kapsanan)),
            'Rapor rotasında kapsam zincirinde ele alınmayan rol var: '
            . implode(', ', array_diff($roller, $kapsanan)),
        );
    }

    // ── SSS ──

    public function test_herkese_acik_liste_yalnizca_yayimlanmislari_veriyor(): void
    {
        Faq::create([
            'question' => ['en' => 'Published?'], 'answer' => ['en' => 'Yes'],
            'sort_order' => 1, 'is_published' => true,
        ]);
        Faq::create([
            'question' => ['en' => 'Draft only'], 'answer' => ['en' => 'Hidden'],
            'sort_order' => 2, 'is_published' => false,
        ]);

        $yanit = $this->getJson('/api/faqs')->assertOk();

        // Yanıt `question`'ı yürürlükteki dile çözülmüş DÜZ METİN veriyor;
        // çeviri haritası ayrı alanda (`question_translations`).
        $sorular = collect($yanit->json())->pluck('question');

        $this->assertTrue($sorular->contains('Published?'));
        $this->assertFalse($sorular->contains('Draft only'), 'yayımlanmamış SSS herkese açık listede');
    }

    public function test_sss_yonetimi_yonetici_disina_kapali(): void
    {
        $hasta = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')->getJson('/api/admin/faqs')->assertForbidden();
        app('auth')->forgetGuards();
        $this->actingAs($hasta, 'sanctum')->postJson('/api/admin/faqs', [
            'question' => ['en' => 'x'], 'answer' => ['en' => 'y'],
        ])->assertForbidden();
    }

    public function test_yonetici_sss_ekleyip_silebiliyor(): void
    {
        $yonetici = User::factory()->create(['role_id' => 'superAdmin', 'user_level' => 5]);

        $olusan = $this->actingAs($yonetici, 'sanctum')->postJson('/api/admin/faqs', [
            'question'     => ['en' => 'How?'],
            'answer'       => ['en' => 'Like this'],
            'is_published' => true,
        ])->assertCreated()->json();

        app('auth')->forgetGuards();

        $this->actingAs($yonetici, 'sanctum')
            ->deleteJson("/api/admin/faqs/{$olusan['id']}")
            ->assertOk();

        $this->assertNull(Faq::find($olusan['id']), 'silinen SSS duruyor');
    }
}
