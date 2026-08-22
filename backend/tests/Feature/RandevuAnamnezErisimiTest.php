<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\HealthDataAuditLog;
use App\Models\PatientDocument;
use App\Models\User;
use App\Services\EncryptedFileStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Randevu üzerinden hastanın anamnezine ve belgelerine erişim.
 *
 * Bu iki uç platformdaki en hassas veriyi veriyor: tanılar, kullanılan
 * ilaçlar, aşılar, hekim notu ve şifreli diskteki belgeler. KVKK Md. 6 /
 * GDPR Art. 9 kapsamında özel nitelikli veri.
 *
 * Koruma tek bir yardımcıya bağlı: `isAppointmentParty()`. Politika sınıfı
 * DEĞİL — yani randevu politikasında yapılan bir değişiklik buraya
 * yansımıyor, ve tersi. İkisi ayrı olduğu için ayrı sınanıyor.
 *
 * Denetim kaydı da işin parçası: hastanın verisine hasta dışında biri
 * eriştiğinde iz bırakılmak zorunda ("sağlık verime kim baktı?" raporu
 * buna dayanıyor). İz bırakmayan bir erişim, teknik olarak çalışsa da
 * uyum açısından kusurlu.
 */
class RandevuAnamnezErisimiTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $doktor;
    private User $yabanci;
    private Appointment $randevu;
    private PatientDocument $belge;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create([
            'medical_history' => json_encode([
                'conditions'  => ['Tip 2 diyabet'],
                'medications' => ['Metformin 1000mg'],
                'notes'       => 'Aile öyküsünde kalp hastalığı var',
            ]),
        ]);
        $this->doktor = User::factory()->doctor()->create();
        $this->yabanci = User::factory()->doctor()->create();

        $this->randevu = Appointment::factory()->confirmed()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $this->doktor->id,
        ]);

        $this->belge = PatientDocument::create([
            'patient_id'  => $this->hasta->id,
            'uploaded_by' => $this->hasta->id,
            'title'       => 'Kan tahlili',
            'category'    => 'lab',
            'file_path'   => app(EncryptedFileStorage::class)
                ->putContents('hasta-belgeleri/tahlil.pdf', 'HEMOGRAM SONUCU'),
            'file_name'   => 'tahlil.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 15,
            'is_active'   => true,
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function anamnez(User $user)
    {
        return $this->olarak($user)->getJson("/api/appointments/{$this->randevu->id}/medical-context");
    }

    private function indir(User $user, ?string $belgeId = null)
    {
        $id = $belgeId ?? $this->belge->id;

        return $this->olarak($user)->get("/api/appointments/{$this->randevu->id}/documents/{$id}/download");
    }

    // ── Pozitif kontroller ──

    public function test_randevunun_doktoru_anamnezi_gorebiliyor(): void
    {
        // Olmazsa aşağıdaki ret testleri, uç herkese kapalı olduğu için de
        // geçerdi.
        $this->anamnez($this->doktor)
            ->assertOk()
            ->assertJsonFragment(['conditions' => ['Tip 2 diyabet']]);
    }

    public function test_hasta_kendi_anamnezini_gorebiliyor(): void
    {
        $this->anamnez($this->hasta)->assertOk();
    }

    public function test_randevunun_doktoru_belgeyi_indirebiliyor(): void
    {
        $yanit = $this->indir($this->doktor)->assertOk();

        // Belge diskte şifreli; çözülmüş gelmeli, yoksa uç çalışıyor görünüp
        // hekime okunmaz dosya verir.
        //
        // Yanıt AKIŞ DEĞİL düz `response()`; streamedContent() burada boş
        // döner ve doğrulama gerçek içeriği hiç görmez.
        $this->assertSame('HEMOGRAM SONUCU', $yanit->getContent());

        // Çözülmüş sağlık verisi ara sunucuda ya da tarayıcı diskinde kalmamalı.
        $baslik = $yanit->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $baslik, 'belge saklanabilir işaretlendi');
        $this->assertStringContainsString('private', $baslik, 'belge ara sunucuda saklanabilir');
    }

    // ── Yabancı hiçbirine erişemiyor ──

    public function test_yabanci_anamnezi_goremiyor(): void
    {
        $yanit = $this->anamnez($this->yabanci);

        $yanit->assertStatus(403);
        $this->assertStringNotContainsString('diyabet', $yanit->getContent());
        $this->assertStringNotContainsString('Metformin', $yanit->getContent());
    }

    public function test_yabanci_belgeyi_indiremiyor(): void
    {
        $yanit = $this->indir($this->yabanci);

        $this->assertSame(403, $yanit->getStatusCode());
        $this->assertStringNotContainsString('HEMOGRAM', $yanit->getContent());
    }

    public function test_baska_hastanin_belgesi_bu_randevudan_cekilemiyor(): void
    {
        // Belge kimliği randevunun hastasına bağlı olmalı; olmasaydı meşru
        // bir doktor, kendi randevusu üzerinden başka bir hastanın belgesini
        // çekebilirdi.
        $baskaHasta = User::factory()->patient()->create();
        $baskaBelge = PatientDocument::create([
            'patient_id'  => $baskaHasta->id,
            'uploaded_by' => $baskaHasta->id,
            'title'       => 'Baska tahlil',
            'category'    => 'lab',
            'file_path'   => app(EncryptedFileStorage::class)
                ->putContents('hasta-belgeleri/baska.pdf', 'BASKA HASTANIN SONUCU'),
            'file_name'   => 'baska.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 21,
            'is_active'   => true,
        ]);

        $yanit = $this->indir($this->doktor, $baskaBelge->id);

        $this->assertSame(404, $yanit->getStatusCode(), 'başka hastanın belgesi indirildi');
        $this->assertStringNotContainsString('BASKA HASTANIN', $yanit->getContent());
    }

    // ── Denetim kaydı ──

    public function test_doktor_eristiginde_denetim_kaydi_dusuyor(): void
    {
        $this->assertSame(0, HealthDataAuditLog::count(), 'başlangıçta kayıt olmamalı');

        $this->anamnez($this->doktor)->assertOk();

        $this->assertSame(1, HealthDataAuditLog::count(), 'doktorun erişimi iz bırakmadı');
    }

    public function test_hasta_kendi_verisine_bakinca_kayit_dusmuyor(): void
    {
        // "Sağlık verime kim baktı?" raporu hastanın kendi bakışıyla
        // dolarsa okunamaz hale gelir.
        $this->anamnez($this->hasta)->assertOk();

        $this->assertSame(0, HealthDataAuditLog::count(), 'hastanın kendi erişimi kaydedildi');
    }

    public function test_belge_indirmesi_ayrica_kaydediliyor(): void
    {
        // Anamnezi görmekle belgeyi indirmek farklı ağırlıkta; ikisi ayrı
        // kaydedilmezse rapor "hangi belge indirildi" sorusunu yanıtlayamaz.
        $this->indir($this->doktor)->assertOk();

        $this->assertSame(1, HealthDataAuditLog::count(), 'belge indirmesi iz bırakmadı');
    }

    public function test_reddedilen_erisim_kaydedilmiyor(): void
    {
        // Başarısız denemenin kaydı, raporu yabancı kayıtlarla doldurur.
        $this->anamnez($this->yabanci)->assertStatus(403);

        $this->assertSame(0, HealthDataAuditLog::count(), 'reddedilen erişim kaydedildi');
    }

    // ── Klinik sahibi: mevcut davranış çivileniyor ──

    public function test_klinik_sahibi_anamneze_erisemiyor(): void
    {
        // DİKKAT — bu bir tutarsızlığı KAYDEDİYOR, onaylamıyor.
        //
        // `isAppointmentParty()` kullanıcı kimliğini randevunun `clinic_id`
        // değeriyle karşılaştırıyor. Bir kullanıcı kimliği hiçbir zaman bir
        // klinik kimliğine eşit olamayacağı için o dal ölü: klinik sahibi
        // reddediliyor. Oysa AppointmentPolicy::view klinik sahibine randevuyu
        // GÖRME izni veriyor.
        //
        // Güvenlik açısından kapalı tarafta hata veriyor, o yüzden burada
        // düzeltilmedi: kliniğin hastanın anamnezini görmesi gerekip
        // gerekmediği ürün kararı. Karar verilince bu test kasten kırılacak
        // ve tutarsızlık gündeme gelecek.
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();
        $this->randevu->forceFill(['clinic_id' => $klinik->id])->save();

        $this->anamnez($sahip)->assertStatus(403);
    }

    public function test_yonetici_erisebiliyor_ve_iz_birakiyor(): void
    {
        $yonetici = User::factory()->admin()->create();

        $this->anamnez($yonetici)->assertOk();

        $this->assertSame(1, HealthDataAuditLog::count(), 'yöneticinin erişimi iz bırakmadı');
    }
}
