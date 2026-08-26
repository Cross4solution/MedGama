<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorFollow;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\PatientDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Okuma uçlarının kapsamı — kalan beşi.
 *
 * Bu turda iki sızıntı çıktı (hasta araması, iletişim kutusu) ve ikisi de aynı
 * sebepten: rol süzgeci olmayan bir uçta kapsamın tamamı denetleyicinin kendi
 * dallanmasına bağlıydı. Kalan uçlar DOĞRU yazılmış — bu ölçüt kusur
 * bildirmiyor, o kapsamların yerinde durduğunu kaydediyor.
 *
 *   crm/billing/outstanding     borçlu hasta adı, e-postası, telefonu, tutarı
 *   crm/leads/stats             satış hattının aşama başına değeri
 *   patient-documents/stats     kişinin belge sayısı ve toplam boyutu
 *   social/following            kimi takip ettiği
 *   telehealth/{id}/transcription-token
 *                               canlı altyazı anahtarı — üstelik KVKK/HIPAA
 *                               gereği varsayılan olarak KAPALI olmalı
 */
class OkumaKapsamlariTest extends TestCase
{
    use RefreshDatabase;

    private User $sahip;
    private Clinic $klinik;
    private User $hekim;
    private User $hasta;

    private User $yabanciSahip;
    private Clinic $yabanciKlinik;

    protected function setUp(): void
    {
        parent::setUp();

        [$this->sahip, $this->klinik] = $this->klinikKur();
        [$this->yabanciSahip, $this->yabanciKlinik] = $this->klinikKur();

        $this->hekim = User::factory()->doctor()->create([
            'clinic_id'   => $this->klinik->id,
            'is_verified' => true,
        ]);
        $this->hekim->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->addYear()])->save();

        $this->hasta = User::factory()->patient()->create(['fullname' => 'Borclu Hasta']);
    }

    /** @return array{0: User, 1: Clinic} */
    private function klinikKur(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create([
            'owner_id'       => $sahip->id,
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

    public function test_borc_listesi_baska_klinigin_hastasini_vermiyor(): void
    {
        Invoice::create([
            'invoice_number' => 'TEST-1',
            'patient_id'     => $this->hasta->id,
            'doctor_id'      => $this->hekim->id,
            'clinic_id'      => $this->klinik->id,
            'status'         => 'pending',
            'issue_date'     => now()->toDateString(),
            'subtotal'       => 100,
            'grand_total'    => 100,
            'currency'       => 'EUR',
        ]);

        $benim = $this->olarak($this->sahip)
            ->getJson('/api/crm/billing/outstanding')
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('Borclu Hasta', $benim, 'kendi borçlusunu görmüyor');

        $yabanci = $this->olarak($this->yabanciSahip)
            ->getJson('/api/crm/billing/outstanding')
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString(
            'Borclu Hasta',
            $yabanci,
            'başka kliniğin borçlu hastası adı ve iletişimiyle dönüyor',
        );
    }

    public function test_lead_istatistigi_baska_klinigin_degerini_saymiyor(): void
    {
        Lead::create([
            'clinic_id'       => $this->klinik->id,
            'full_name'       => 'Deger Adayi',
            'stage'           => 'new',
            'estimated_value' => 5000,
        ]);

        $yanit = $this->olarak($this->yabanciSahip)
            ->getJson('/api/crm/leads/stats')
            ->assertOk()
            ->json();

        $toplam = collect($yanit['by_stage'] ?? $yanit)
            ->pluck('total_value')
            ->filter()
            ->sum();

        $this->assertSame(0.0, (float) $toplam, 'başka kliniğin satış hattı değeri sayılıyor');
    }

    public function test_belge_istatistigi_yalnizca_kendi_belgelerini_sayiyor(): void
    {
        $baskasi = User::factory()->patient()->create();

        PatientDocument::create([
            'patient_id' => $baskasi->id,
            'uploaded_by' => $baskasi->id,
            'title'      => 'Tahlil sonucu',
            'category'   => 'lab_result',
            'file_name'  => 'tahlil.pdf',
            'file_path'  => 'patient-documents/x/tahlil.pdf',
            'file_size'  => 1234,
            'mime_type'  => 'application/pdf',
        ]);

        $yanit = $this->olarak($this->hasta)
            ->getJson('/api/patient-documents/stats')
            ->assertOk()
            ->json();

        $this->assertSame(0, (int) ($yanit['total_documents'] ?? $yanit['total'] ?? 0),
            'başka hastanın belgeleri sayılıyor');
    }

    public function test_takip_listesi_yalnizca_kendi_takiplerini_veriyor(): void
    {
        $hedef = User::factory()->doctor()->create(['is_active' => true, 'is_verified' => true]);
        $baskasi = User::factory()->patient()->create();

        DoctorFollow::create([
            'follower_id'    => $baskasi->id,
            'following_id'   => $hedef->id,
            'following_type' => 'doctor',
            'is_active'      => true,
        ]);

        $kimlikler = $this->olarak($this->hasta)
            ->getJson('/api/social/following')
            ->assertOk()
            ->json('following_ids');

        $this->assertSame([], $kimlikler, 'başkasının takip listesi dönüyor');
    }

    public function test_transkripsiyon_anahtari_yabanciya_verilmiyor(): void
    {
        $randevu = Appointment::factory()->create([
            'doctor_id'        => $this->hekim->id,
            'patient_id'       => $this->hasta->id,
            'appointment_type' => 'online',
            'status'           => 'confirmed',
        ]);

        $this->olarak(User::factory()->patient()->create())
            ->getJson("/api/telehealth/{$randevu->id}/transcription-token")
            ->assertStatus(403);
    }

    public function test_transkripsiyon_varsayilan_olarak_kapali(): void
    {
        // Ses, ABD'deki üçüncü taraf bir buluta gidiyor. KVKK Md. 9 / HIPAA
        // gereği BAA ve açık rıza olmadan açılamaz; unutulursa KAPALI kalmalı.
        $this->assertFalse(config('telehealth.recording'));

        $this->assertStringContainsString(
            "env('TELEHEALTH_RECORDING', false)",
            (string) file_get_contents(config_path('telehealth.php')),
            'transkripsiyon varsayılanı açık',
        );

        $this->assertMatchesRegularExpression(
            '/key:\s*TELEHEALTH_RECORDING\s*\n\s*value:\s*false/',
            (string) file_get_contents(base_path('../render.yaml')),
            'render.yaml transkripsiyonu açıkça kapatmıyor',
        );
    }
}
