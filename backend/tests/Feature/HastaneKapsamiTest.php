<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Hospital;
use App\Models\User;
use App\Support\HastaneKapsami;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Hastane hesabının kapsamı — boş bağ "her şey" demek DEĞİL.
 *
 * Bulunan hata: klinik kapsamı üç ayrı serviste aynı biçimde yazılıydı —
 *
 *     Clinic::where('hospital_id', $user->hospital_id)
 *
 * `hospital_id` boş olduğunda sorgu `WHERE hospital_id IS NULL` oluyor ve
 * BAĞIMSIZ kliniklerin hepsini eşliyor. Hastaneye bağlanmamış (ya da bağı
 * temizlenmiş) bir hastane hesabı, platformdaki bütün bağımsız kliniklerin
 * fatura ve ciro kayıtlarını görüyordu.
 *
 * Randevu listesindeki kusurla aynı sınıf: kapsamın "uygulanmaması" ile
 * "hiçbir şeyi eşlememesi" karıştırılmış. İkisi de sessiz — uç 200 dönüyor,
 * sadece fazla veri veriyor.
 *
 * Testler hem yardımcının kendisini hem UCU deniyor: yardımcı doğru olsa da
 * bir servis onu kullanmayı bırakırsa sızıntı geri gelir.
 */
class HastaneKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $bagimsizKlinik;

    protected function setUp(): void
    {
        parent::setUp();

        $sahip = User::factory()->clinicOwner()->create();
        $this->bagimsizKlinik = Clinic::factory()->create([
            'owner_id'      => $sahip->id,
            'hospital_id'   => null,   // bağımsız klinik
            'is_crm_active' => true,
        ]);
        $sahip->forceFill(['clinic_id' => $this->bagimsizKlinik->id])->save();

        $doktor = User::factory()->doctor()->create(['clinic_id' => $this->bagimsizKlinik->id]);
        $hasta = User::factory()->patient()->create();

        DB::table('invoices')->insert([
            'id'             => (string) Str::uuid(),
            'clinic_id'      => $this->bagimsizKlinik->id,
            'doctor_id'      => $doktor->id,
            'patient_id'     => $hasta->id,
            'invoice_number' => 'FTR-BAGIMSIZ-001',
            'subtotal'       => 10000,
            'grand_total'    => 10000,
            'status'         => 'paid',
            'issue_date'     => now()->toDateString(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
    }

    private function hastaneHesabi(?string $hastaneId): User
    {
        $u = User::factory()->create([
            'role_id'     => 'hospital',
            'user_level'  => 4,
            'hospital_id' => $hastaneId,
        ]);
        // CRM kapısı ayrı bir koruma; burada ölçülen o değil, veri kapsamı.
        $u->forceFill(['is_crm_active' => true])->save();

        return $u;
    }

    private function faturalar(User $user): \Illuminate\Testing\TestResponse
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/crm/billing/invoices');
    }

    // ── Yardımcının kendisi ──

    public function test_bagi_olmayan_hastane_hicbir_klinik_kapsamiyor(): void
    {
        $this->assertTrue(
            HastaneKapsami::klinikKimlikleri($this->hastaneHesabi(null))->isEmpty(),
            'boş hastane bağı klinik eşledi',
        );
    }

    public function test_bagi_olan_hastane_yalnizca_kendi_kliniklerini_kapsiyor(): void
    {
        // Ters uç: kapsam fazla dar olsaydı hastane kendi işini göremezdi.
        $kayit = Hospital::create([
            'name'     => 'Deneme Hastanesi',
            'fullname' => 'Deneme Hastanesi',
            'codename' => 'deneme-hastanesi-kapsam',
        ]);
        $kendiKlinigi = Clinic::factory()->create(['hospital_id' => $kayit->id]);

        $kimlikler = HastaneKapsami::klinikKimlikleri($this->hastaneHesabi($kayit->id));

        $this->assertContains($kendiKlinigi->id, $kimlikler->all(), 'hastane kendi kliniğini kapsamadı');
        $this->assertNotContains(
            $this->bagimsizKlinik->id,
            $kimlikler->all(),
            'bağımsız klinik hastane kapsamına girdi',
        );
    }

    // ── Uç üzerinden ──

    public function test_bagi_olmayan_hastane_bagimsiz_klinigin_faturasini_gormuyor(): void
    {
        $yanit = $this->faturalar($this->hastaneHesabi(null))->assertOk();

        $this->assertStringNotContainsString(
            'FTR-BAGIMSIZ-001',
            $yanit->getContent(),
            'bağı olmayan hastane bağımsız kliniğin faturasını gördü',
        );
    }

    public function test_klinik_sahibi_kendi_faturasini_goruyor(): void
    {
        // Pozitif kontrol: fatura ucu hiç veri döndürmüyor olsaydı yukarıdaki
        // test boşuna geçerdi.
        $sahip = User::find($this->bagimsizKlinik->owner_id);
        $sahip->forceFill(['is_crm_active' => true])->save();

        $this->assertStringContainsString(
            'FTR-BAGIMSIZ-001',
            $this->faturalar($sahip)->assertOk()->getContent(),
            'klinik sahibi kendi faturasını göremedi',
        );
    }

    public function test_baska_hastanenin_hesabi_gormuyor(): void
    {
        $kayit = Hospital::create([
            'name'     => 'Baska Hastane',
            'fullname' => 'Baska Hastane',
            'codename' => 'baska-hastane-kapsam',
        ]);

        $yanit = $this->faturalar($this->hastaneHesabi($kayit->id))->assertOk();

        $this->assertStringNotContainsString(
            'FTR-BAGIMSIZ-001',
            $yanit->getContent(),
            'yabancı hastane bağımsız kliniğin faturasını gördü',
        );
    }
}
