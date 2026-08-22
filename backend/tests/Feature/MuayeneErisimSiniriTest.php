<?php

namespace Tests\Feature;

use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Muayene kayıtları ve reçete PDF'i — yalnız kaydı açan hekim.
 *
 * Taşıdığı veri tanı notu, muayene bulgusu, tedavi planı ve reçete. Reçete
 * ayrıca yasal bir belge: barkodlu PDF üretiliyor.
 *
 * Kapsam burada rol zincirine DEĞİL, tek bir koşula dayanıyor:
 * `doctor_id = $doctor->id`. Bu, bu kod tabanında bulduğum kapsam
 * hatalarının hiçbirine açık değil — boş değer sorunu yok, eşleşmeyen rol
 * dalı yok. Katı olduğu için doğru.
 *
 * Testler bunu ÇİVİLİYOR: kapsamın ileride "kliniği de görsün" diye
 * gevşetilmesi kolay ve o değişiklik sessizce başka hekimlerin muayene
 * kayıtlarını açar. Karar verilirse bu testler kasten kırılacak.
 */
class MuayeneErisimSiniriTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;
    private User $yabanciDoktor;
    private User $hasta;
    private PatientRecord $muayene;

    protected function setUp(): void
    {
        parent::setUp();

        // HER İKİ hekimin de CRM aboneliği AÇIK olmalı. Yabancı hekime
        // abonelik vermezsem uç zaten 403 döner ve testler kapsamı değil
        // abonelik kapısını ölçmüş olur — ilk yazımda tam olarak öyleydi.
        $this->doktor = $this->aboneliHekim();
        $this->yabanciDoktor = $this->aboneliHekim();
        $this->hasta = User::factory()->patient()->create();

        $this->muayene = PatientRecord::create([
            'patient_id'       => $this->hasta->id,
            'doctor_id'        => $this->doktor->id,
            'clinic_id'        => null,
            'record_type'      => 'examination',
            'file_url'         => 'https://ornek.test/muayene.pdf',
            'upload_date'      => now()->toDateString(),
            'diagnosis_note'   => 'GIZLI TANI NOTU',
            'examination_note' => 'Muayene bulgusu',
            'treatment_plan'   => 'Tedavi plani',
            'prescriptions'    => [['name' => 'Metformin', 'dose' => '1000mg']],
        ]);
    }

    private function aboneliHekim(): User
    {
        $u = User::factory()->doctor()->create(['is_verified' => true]);
        $u->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        return $u;
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    // ── Pozitif kontroller ──

    public function test_kaydi_acan_hekim_listede_goruyor(): void
    {
        // Olmazsa aşağıdaki ret testleri, uç hiç veri döndürmediği için de
        // geçerdi.
        $this->assertStringContainsString(
            'GIZLI TANI NOTU',
            $this->olarak($this->doktor)->getJson('/api/crm/examinations')->assertOk()->getContent(),
            'hekim kendi muayene kaydını göremedi',
        );
    }

    public function test_kaydi_acan_hekim_detayi_goruyor(): void
    {
        $this->olarak($this->doktor)
            ->getJson("/api/crm/examinations/{$this->muayene->id}")
            ->assertOk();
    }

    // ── Yabancı hekim ──

    public function test_yabanci_hekim_listede_gormuyor(): void
    {
        $this->assertStringNotContainsString(
            'GIZLI TANI NOTU',
            $this->olarak($this->yabanciDoktor)->getJson('/api/crm/examinations')->getContent(),
            'yabancı hekim muayene kaydını gördü',
        );
    }

    public function test_yabanci_hekim_detaya_erisemiyor(): void
    {
        $yanit = $this->olarak($this->yabanciDoktor)
            ->getJson("/api/crm/examinations/{$this->muayene->id}");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı hekim detayı açtı');
        $this->assertStringNotContainsString('GIZLI TANI NOTU', $yanit->getContent());
    }

    public function test_yabanci_hekim_kaydi_degistiremiyor(): void
    {
        $yanit = $this->olarak($this->yabanciDoktor)
            ->putJson("/api/crm/examinations/{$this->muayene->id}", [
                'diagnosis_note' => 'DEGISTIRILDI',
            ]);

        $this->assertContains($yanit->getStatusCode(), [403, 404, 422], 'yabancı hekim kaydı değiştirdi');
        $this->assertSame(
            'GIZLI TANI NOTU',
            $this->muayene->fresh()->diagnosis_note,
            'tanı notu değişti',
        );
    }

    public function test_yabanci_hekim_kaydi_silemiyor(): void
    {
        // Muayene kaydı tıbbi belge; silinmesi yasal saklama yükümlülüğünü
        // de ihlal eder.
        $yanit = $this->olarak($this->yabanciDoktor)
            ->deleteJson("/api/crm/examinations/{$this->muayene->id}");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı hekim kaydı sildi');
        $this->assertNotNull(PatientRecord::find($this->muayene->id), 'muayene kaydı silindi');
    }

    // ── Reçete PDF'i ──

    public function test_yabanci_hekim_recete_pdfini_alamiyor(): void
    {
        // Reçete yasal belge ve hasta adını, ilacı, dozu taşıyor.
        $yanit = $this->olarak($this->yabanciDoktor)
            ->get("/api/crm/examinations/{$this->muayene->id}/prescription-pdf");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı hekim reçete PDF aldı');
        $this->assertStringNotContainsString('Metformin', $yanit->getContent());
    }

    public function test_kaydi_acan_hekim_recete_pdfini_alabiliyor(): void
    {
        // Ters uç: kapsam fazla dar olsaydı hekim kendi reçetesini basamazdı.
        $this->olarak($this->doktor)
            ->get("/api/crm/examinations/{$this->muayene->id}/prescription-pdf")
            ->assertOk();
    }

    // ── Hasta ──

    public function test_hasta_bu_uctan_kendi_kaydini_gormuyor(): void
    {
        // MEVCUT DAVRANIŞ ÇİVİLENİYOR, onaylanmıyor: uç yalnız hekime göre
        // kapsıyor, dolayısıyla hasta kendi muayene kaydına buradan
        // ulaşamıyor. Hastanın kendi kaydını görmesi gerekiyorsa çözüm bu
        // ucu gevşetmek DEĞİL, hastaya ayrı bir uç vermek — aksi hâlde
        // kapsam hekimden koparılır ve başka hekimlerin kayıtları açılır.
        $yanit = $this->olarak($this->hasta)->getJson('/api/crm/examinations');

        $this->assertStringNotContainsString('GIZLI TANI NOTU', $yanit->getContent());
    }

    public function test_yabanci_hasta_kimligiyle_suzmek_veri_vermiyor(): void
    {
        // Süzgeç kapsamın ÜSTÜNE ekleniyor olmalı, yerine geçmemeli.
        $this->assertStringNotContainsString(
            'GIZLI TANI NOTU',
            $this->olarak($this->yabanciDoktor)
                ->getJson('/api/crm/examinations?patient_id=' . $this->hasta->id)
                ->getContent(),
            'süzgeçle başka hekimin kaydı çekildi',
        );
    }
}
