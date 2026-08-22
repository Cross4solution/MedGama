<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hasta kayıtları ve CRM listeleri — boş klinik bağı "hepsi" demek DEĞİL.
 *
 * `/api/patient-records` bu ailenin en açık ucu: üzerinde yalnız
 * `auth:sanctum` var, rol süzgeci ve CRM abonelik kapısı YOK. Yani buradaki
 * bir kapsam hatasını maskeleyecek ikinci bir koruma da yok.
 *
 * Taşıdığı veri tahlil sonucu, tanı notu ve reçete — KVKK Md. 6 / GDPR
 * Art. 9 kapsamında özel nitelikli.
 *
 * Bulunan hata: kliniği olmayan bir klinik sahibi hesabı bağımsız
 * doktorların kayıtlarını görüyordu. `where('clinic_id', null)` Laravel
 * tarafından `IS NULL`'a çevriliyor ve kliniğe bağlı OLMAYAN her kaydı
 * eşliyor. Ölçüldü: HTTP 200 ve kayıt içerikte.
 *
 * Aynı sınıfın dördüncü örneği. Arşiv kayıtlarında ise zincir yalnız
 * clinicOwner'ı ele alıyordu — bir doktor bütün kliniklerin arşivini
 * görebiliyordu.
 */
class HastaKaydiVeCrmKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private User $bagimsizDoktor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bagimsizDoktor = User::factory()->doctor()->create(['clinic_id' => null]);
        $hasta = User::factory()->patient()->create(['fullname' => 'Kayit Hastasi Z']);

        PatientRecord::create([
            'patient_id'  => $hasta->id,
            'doctor_id'   => $this->bagimsizDoktor->id,
            'clinic_id'   => null,   // bağımsız doktor: kliniğe bağlı değil
            'record_type' => 'labResult',
            'file_url'    => 'https://ornek.test/gizli-tahlil.pdf',
            'description' => 'GIZLI TAHLIL NOTU',
            'upload_date' => now()->toDateString(),
        ]);
    }

    private function kayitlar(User $user): \Illuminate\Testing\TestResponse
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/patient-records');
    }

    private function kayitGorunmedi(User $user, string $senaryo): void
    {
        // Ölçüt yanıt kodu değil: 403 de boş 200 de kabul. Önemli olan
        // kaydın içerikte olmaması.
        $this->assertStringNotContainsString(
            'GIZLI TAHLIL NOTU',
            $this->kayitlar($user)->getContent(),
            "[$senaryo] hasta kaydı sızdı",
        );
    }

    // ── Pozitif kontrol ──

    public function test_doktor_kendi_kaydini_goruyor(): void
    {
        // Olmazsa aşağıdaki testler, liste hep boş olduğu için de geçerdi.
        $this->assertStringContainsString(
            'GIZLI TAHLIL NOTU',
            $this->kayitlar($this->bagimsizDoktor)->assertOk()->getContent(),
            'doktor kendi kaydını göremedi',
        );
    }

    // ── Asıl bulgu ──

    public function test_kliniksiz_klinik_sahibi_bagimsiz_doktorun_kaydini_gormuyor(): void
    {
        $sahip = User::factory()->create([
            'role_id'    => 'clinicOwner',
            'user_level' => 3,
            'clinic_id'  => null,
        ]);

        $this->kayitGorunmedi($sahip, 'kliniksiz klinik sahibi');
    }

    public function test_yabanci_klinigin_sahibi_gormuyor(): void
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $this->kayitGorunmedi($sahip, 'yabancı klinik sahibi');
    }

    public function test_yabanci_doktor_gormuyor(): void
    {
        $this->kayitGorunmedi(
            User::factory()->doctor()->create(['clinic_id' => null]),
            'yabancı doktor',
        );
    }

    public function test_hasta_baskasinin_kaydini_gormuyor(): void
    {
        $this->kayitGorunmedi(User::factory()->patient()->create(), 'yabancı hasta');
    }

    public function test_hastane_gormuyor(): void
    {
        $this->kayitGorunmedi(
            User::factory()->create(['role_id' => 'hospital', 'user_level' => 4, 'hospital_id' => null]),
            'hastane',
        );
    }

    // ── Meşru kapsam ──

    public function test_klinik_sahibi_kendi_kliniginin_kaydini_goruyor(): void
    {
        // Ters uç: kapsam fazla dar olsaydı klinik kendi kaydını göremezdi ve
        // bu, yalnız sızıntıyı ölçen testlerle gizlenirdi.
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $klinikDoktoru = User::factory()->doctor()->create(['clinic_id' => $klinik->id]);
        PatientRecord::create([
            'patient_id'  => User::factory()->patient()->create()->id,
            'doctor_id'   => $klinikDoktoru->id,
            'clinic_id'   => $klinik->id,
            'record_type' => 'labResult',
            'file_url'    => 'https://ornek.test/klinik-tahlil.pdf',
            'description' => 'KLINIK TAHLIL NOTU',
            'upload_date' => now()->toDateString(),
        ]);

        $this->assertStringContainsString(
            'KLINIK TAHLIL NOTU',
            $this->kayitlar($sahip)->assertOk()->getContent(),
            'klinik sahibi kendi kaydını göremedi',
        );
    }

    public function test_hasta_kendi_kaydini_goruyor(): void
    {
        $hasta = User::factory()->patient()->create();
        PatientRecord::create([
            'patient_id'  => $hasta->id,
            'doctor_id'   => $this->bagimsizDoktor->id,
            'clinic_id'   => null,
            'record_type' => 'labResult',
            'file_url'    => 'https://ornek.test/kendi.pdf',
            'description' => 'KENDI TAHLILIM',
            'upload_date' => now()->toDateString(),
        ]);

        $this->assertStringContainsString(
            'KENDI TAHLILIM',
            $this->kayitlar($hasta)->assertOk()->getContent(),
            'hasta kendi kaydını göremedi',
        );
    }
}
