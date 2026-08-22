<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /api/crm/patients — CRM hasta listesi kapsamı.
 *
 * Liste hasta adını, e-postasını ve randevu geçmişini veriyor. Kapsam
 * hatası doğrudan hasta kimliği sızdırıyor.
 *
 * Bulunan hata: kapsam zinciri yalnız doctor/clinicOwner'ı ele alıyor,
 * eşleşmeyen roller hiç kapsanmıyordu. Ölçüldü — hastane hesabı bağımsız
 * bir doktorun hastasını adı ve e-postasıyla gördü.
 *
 * İkinci kusur aynı zincirin içindeydi: `clinic_id` boşken
 * `where('clinic_id', null)` Laravel tarafından `IS NULL`'a çevriliyor ve
 * kliniğe bağlı OLMAYAN her kaydı eşliyor. Boş kapsam değeri "hiçbir şey"
 * değil "hepsi" anlamına geliyordu.
 *
 * Bu, aynı sınıfın ÜÇÜNCÜ örneği (randevu listesi ve hastane faturaları
 * ilk ikisiydi), o yüzden testler tek uca değil rol matrisine bakıyor.
 */
class CrmHastaListesiKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private User $bagimsizDoktor;

    protected function setUp(): void
    {
        parent::setUp();

        // Bağımsız doktor: clinic_id NULL — sızıntının hedefi tam olarak bu,
        // çünkü kliniğe bağlı olmayan kayıtlar `IS NULL` ile eşleşiyordu.
        $this->bagimsizDoktor = User::factory()->doctor()->create(['clinic_id' => null]);
        $this->bagimsizDoktor->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        $hasta = User::factory()->patient()->create([
            'fullname' => 'Gizli Hasta X',
            'email'    => 'gizli.hasta.x@ornek.test',
        ]);

        Appointment::factory()->confirmed()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $this->bagimsizDoktor->id,
            'clinic_id'  => null,
        ]);
    }

    private function aboneli(array $nitelik): User
    {
        $u = User::factory()->create($nitelik);
        // CRM kapısı ayrı bir koruma; burada ölçülen o değil, veri kapsamı.
        $u->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        return $u;
    }

    private function liste(User $user): \Illuminate\Testing\TestResponse
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/crm/patients');
    }

    private function hastaGorunmedi(User $user, string $senaryo): void
    {
        $yanit = $this->liste($user);

        // 403 de kabul: kapsam boş dönmüş ya da erişim kesilmiş olabilir.
        // Ölçüt yanıt kodu değil, hasta kimliğinin görünmemesi.
        $this->assertStringNotContainsString(
            'Gizli Hasta X',
            $yanit->getContent(),
            "[$senaryo] hasta adı sızdı",
        );
        $this->assertStringNotContainsString(
            'gizli.hasta.x@ornek.test',
            $yanit->getContent(),
            "[$senaryo] hasta e-postası sızdı",
        );
    }

    // ── Pozitif kontrol ──

    public function test_doktor_kendi_hastasini_goruyor(): void
    {
        // Olmazsa aşağıdaki testler, liste hep boş olduğu için de geçerdi.
        $this->assertStringContainsString(
            'Gizli Hasta X',
            $this->liste($this->bagimsizDoktor)->assertOk()->getContent(),
            'doktor kendi hastasını göremedi',
        );
    }

    // ── Asıl bulgu ──

    public function test_hastane_bagimsiz_doktorun_hastasini_gormuyor(): void
    {
        $this->hastaGorunmedi(
            $this->aboneli(['role_id' => 'hospital', 'user_level' => 4, 'hospital_id' => null]),
            'bağı olmayan hastane',
        );
    }

    public function test_baska_hastanenin_hesabi_gormuyor(): void
    {
        $kayit = Hospital::create([
            'name'     => 'Baska Hastane',
            'fullname' => 'Baska Hastane',
            'codename' => 'baska-hastane-hasta',
        ]);

        $this->hastaGorunmedi(
            $this->aboneli(['role_id' => 'hospital', 'user_level' => 4, 'hospital_id' => $kayit->id]),
            'yabancı hastane',
        );
    }

    public function test_kliniksiz_klinik_sahibi_gormuyor(): void
    {
        // DİKKAT: bu senaryoyu kapsam DEĞİL, CRM abonelik kapısı kesiyor —
        // kliniği olmayan sahibin aboneliği de yok, uç 403 veriyor. Ölçüldü:
        // kusurlu kapsamla da bu test geçiyor.
        //
        // Yine de duruyor: abonelik kuralı gevşetilirse (ör. deneme süresi)
        // koruma kapsamda olmak zorunda ve o gün burası kırılır.
        //
        // İlgili kusur: `where('clinic_id', null)` Laravel'de `IS NULL`'a
        // dönüşüp kliniğe bağlı olmayan her kaydı eşliyor.
        $this->hastaGorunmedi(
            $this->aboneli(['role_id' => 'clinicOwner', 'user_level' => 3, 'clinic_id' => null]),
            'kliniksiz klinik sahibi',
        );
    }

    public function test_yabanci_klinigin_sahibi_gormuyor(): void
    {
        $sahip = $this->aboneli(['role_id' => 'clinicOwner', 'user_level' => 3]);
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id, 'is_crm_active' => true]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $this->hastaGorunmedi($sahip, 'yabancı klinik sahibi');
    }

    public function test_baska_doktor_gormuyor(): void
    {
        $yabanci = $this->aboneli(['role_id' => 'doctor', 'user_level' => 2, 'clinic_id' => null]);

        $this->hastaGorunmedi($yabanci, 'yabancı doktor');
    }

    // ── Meşru kapsam ──

    public function test_klinik_sahibi_kendi_kliniginin_hastasini_goruyor(): void
    {
        // Ters uç: kapsam fazla dar olsaydı klinik kendi hastasını göremezdi
        // ve bu, yalnız sızıntıyı ölçen testlerle gizlenirdi.
        $sahip = $this->aboneli(['role_id' => 'clinicOwner', 'user_level' => 3]);
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id, 'is_crm_active' => true]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $klinikHastasi = User::factory()->patient()->create(['fullname' => 'Klinik Hastasi']);
        Appointment::factory()->confirmed()->create([
            'patient_id' => $klinikHastasi->id,
            'doctor_id'  => User::factory()->doctor()->create(['clinic_id' => $klinik->id])->id,
            'clinic_id'  => $klinik->id,
        ]);

        $this->assertStringContainsString(
            'Klinik Hastasi',
            $this->liste($sahip)->assertOk()->getContent(),
            'klinik sahibi kendi hastasını göremedi',
        );
    }
}
