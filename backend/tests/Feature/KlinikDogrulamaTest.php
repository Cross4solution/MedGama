<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\ClinicVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Klinik doğrulama — "doğrulanmış" rozetinin kimden geldiği.
 *
 * Rozet hastaya "bu kliniğin ruhsatı denetlendi" diyor. İki ayrı güvence:
 *
 *   1. Rozeti YALNIZ yönetici verebilir. Klinik kendine veremez.
 *   2. Yüklenen belgeler — ticaret sicili, işletme ruhsatı, vergi levhası
 *      ve YETKİLİ KİMLİĞİ — yalnız yöneticiye ve belgeyi gönderen kliniğe
 *      açık. Kimlik belgesi sızması ayrı bir zarar.
 *
 * `is_verified` ve `verification_status` Clinic modelinde $fillable içinde,
 * yani koruma tümüyle yazma uçlarının doğrulanmış açık dizi kullanmasına
 * bağlı — CRM abonelik alanlarındaki durumun aynısı. O yüzden test modele
 * değil UÇLARA saldırıyor.
 */
class KlinikDogrulamaTest extends TestCase
{
    use RefreshDatabase;

    private User $sahip;
    private Clinic $klinik;
    private ClinicVerification $basvuru;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->sahip = User::factory()->clinicOwner()->create();
        $this->klinik = Clinic::factory()->create([
            'owner_id'            => $this->sahip->id,
            'is_verified'         => false,
            'verification_status' => 'unverified',
            'is_active'           => true,
        ]);
        $this->sahip->forceFill(['clinic_id' => $this->klinik->id])->save();

        $this->basvuru = ClinicVerification::create([
            'clinic_id'             => $this->klinik->id,
            'submitted_by'          => $this->sahip->id,
            'business_registration' => 'dogrulama/sicil.pdf',
            'operating_license'     => 'dogrulama/ruhsat.pdf',
            'tax_plate'             => 'dogrulama/vergi.pdf',
            'representative_id'     => 'dogrulama/kimlik.pdf',
            'status'                => 'pending_review',
        ]);

        Storage::disk('local')->put('dogrulama/kimlik.pdf', 'YETKILI KIMLIK BELGESI');
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function rozetYok(string $senaryo): void
    {
        $this->klinik->refresh();

        $this->assertFalse((bool) $this->klinik->is_verified, "[$senaryo] klinik doğrulanmış işaretlendi");
        $this->assertNotSame('verified', $this->klinik->verification_status, "[$senaryo] durum verified oldu");
    }

    // ── Rozeti kim verebilir ──

    public function test_yonetici_onaylayinca_klinik_dogrulaniyor(): void
    {
        // Pozitif kontrol: onay hiç çalışmıyor olsaydı aşağıdaki ret
        // testleri hiçbir şey kanıtlamazdı.
        $this->olarak(User::factory()->admin()->create())
            ->putJson("/api/admin/clinic-verifications/{$this->basvuru->id}/approve", ['notes' => 'Belgeler tamam'])
            ->assertOk();

        $this->klinik->refresh();
        $this->assertTrue((bool) $this->klinik->is_verified, 'yönetici onayı rozeti vermedi');
        $this->assertSame('verified', $this->klinik->verification_status);
    }

    public function test_klinik_sahibi_kendi_basvurusunu_onaylayamiyor(): void
    {
        // En doğrudan kötüye kullanım: kendi rozetini kendin ver.
        $this->olarak($this->sahip)
            ->putJson("/api/admin/clinic-verifications/{$this->basvuru->id}/approve", ['notes' => 'Kendim onayladım'])
            ->assertStatus(403);

        $this->rozetYok('sahip kendi başvurusunu onayladı');
    }

    public function test_doktor_onaylayamiyor(): void
    {
        $this->olarak(User::factory()->doctor()->create())
            ->putJson("/api/admin/clinic-verifications/{$this->basvuru->id}/approve", ['notes' => 'Onay'])
            ->assertStatus(403);

        $this->rozetYok('doktor onayladı');
    }

    public function test_hasta_onaylayamiyor(): void
    {
        $this->olarak(User::factory()->patient()->create())
            ->putJson("/api/admin/clinic-verifications/{$this->basvuru->id}/approve", ['notes' => 'Onay'])
            ->assertStatus(403);

        $this->rozetYok('hasta onayladı');
    }

    public function test_hastane_hesabi_onaylayamiyor(): void
    {
        // Hastane platformda üst seviye bir rol; yine de rozet verme yetkisi
        // yalnız platform yöneticisinde olmalı.
        $this->olarak(User::factory()->create(['role_id' => 'hospital', 'user_level' => 4]))
            ->putJson("/api/admin/clinic-verifications/{$this->basvuru->id}/approve", ['notes' => 'Onay'])
            ->assertStatus(403);

        $this->rozetYok('hastane onayladı');
    }

    public function test_reddedilen_basvuru_rozet_vermiyor(): void
    {
        $this->olarak(User::factory()->admin()->create())
            ->putJson("/api/admin/clinic-verifications/{$this->basvuru->id}/reject", ['notes' => 'Belgeler eksik'])
            ->assertOk();

        $this->rozetYok('ret sonrası');
        $this->assertSame('rejected', $this->klinik->fresh()->verification_status);
    }

    // ── Rozet kendi kendine alınamıyor ──

    public function test_klinik_guncellemesiyle_rozet_alinamiyor(): void
    {
        // `is_verified` $fillable içinde: koruma yalnız ucun doğrulanmış açık
        // dizi kullanmasından geliyor. Tek bir toplu atama rozeti bedavaya
        // verir.
        $this->olarak($this->sahip)
            ->putJson("/api/clinics/{$this->klinik->id}", [
                'name'                => 'Yeni Ad',
                'is_verified'         => true,
                'verification_status' => 'verified',
            ]);

        $this->rozetYok('PUT /clinics/{id}');
    }

    public function test_onboarding_ile_rozet_alinamiyor(): void
    {
        $this->olarak($this->sahip)
            ->putJson('/api/clinic-onboarding', [
                'step'                => 0,
                'name'                => 'Onboarding Klinigi',
                'is_verified'         => true,
                'verification_status' => 'verified',
            ]);

        $this->rozetYok('PUT /clinic-onboarding');
    }

    // ── Belgeler ──

    public function test_yabanci_klinik_sahibi_belgeyi_indiremiyor(): void
    {
        // Yetkili kimliği burada: sızması kimlik belgesi ifşasıdır.
        $yabanci = User::factory()->clinicOwner()->create();
        Clinic::factory()->create(['owner_id' => $yabanci->id]);

        $yanit = $this->olarak($yabanci)
            ->get("/api/clinic-verifications/{$this->basvuru->id}/document/representative_id");

        $this->assertSame(403, $yanit->getStatusCode(), 'yabancı klinik sahibi kimlik belgesini indirdi');
        $this->assertStringNotContainsString('YETKILI KIMLIK', $yanit->getContent());
    }

    public function test_hasta_belgeyi_indiremiyor(): void
    {
        $yanit = $this->olarak(User::factory()->patient()->create())
            ->get("/api/clinic-verifications/{$this->basvuru->id}/document/representative_id");

        $this->assertSame(403, $yanit->getStatusCode());
        $this->assertStringNotContainsString('YETKILI KIMLIK', $yanit->getContent());
    }

    public function test_basvuruyu_yapan_klinik_kendi_belgesini_indirebiliyor(): void
    {
        // Ters uç: erişim fazla dar olsaydı klinik ne gönderdiğini göremezdi.
        $this->olarak($this->sahip)
            ->get("/api/clinic-verifications/{$this->basvuru->id}/document/representative_id")
            ->assertOk();
    }

    public function test_yonetici_belgeyi_indirebiliyor(): void
    {
        $this->olarak(User::factory()->admin()->create())
            ->get("/api/clinic-verifications/{$this->basvuru->id}/document/business_registration")
            ->assertStatus(404); // dosya sahte diske yazılmadı: yetki geçti, dosya yok

        $this->olarak(User::factory()->admin()->create())
            ->get("/api/clinic-verifications/{$this->basvuru->id}/document/representative_id")
            ->assertOk();
    }

    public function test_listede_olmayan_alan_adi_reddediliyor(): void
    {
        // Alan adı doğrudan modelden okunuyor: beyaz liste olmasaydı
        // `admin_notes` ya da başka bir sütun dosya yolu sanılıp okunurdu.
        $this->olarak(User::factory()->admin()->create())
            ->get("/api/clinic-verifications/{$this->basvuru->id}/document/admin_notes")
            ->assertStatus(404);
    }

    // ── Başvuru ──

    public function test_basvuru_dogrudan_dogrulanmis_yapmiyor(): void
    {
        $sahip2 = User::factory()->clinicOwner()->create();
        $klinik2 = Clinic::factory()->create([
            'owner_id'            => $sahip2->id,
            'is_verified'         => false,
            'verification_status' => 'unverified',
        ]);
        $sahip2->forceFill(['clinic_id' => $klinik2->id])->save();

        $this->olarak($sahip2)->post('/api/clinic-verification/submit', [
            'business_registration' => UploadedFile::fake()->create('sicil.pdf', 100, 'application/pdf'),
            'operating_license'     => UploadedFile::fake()->create('ruhsat.pdf', 100, 'application/pdf'),
            'tax_plate'             => UploadedFile::fake()->create('vergi.pdf', 100, 'application/pdf'),
            'representative_id'     => UploadedFile::fake()->create('kimlik.pdf', 100, 'application/pdf'),
        ])->assertStatus(201);

        $klinik2->refresh();
        $this->assertFalse((bool) $klinik2->is_verified, 'başvuru doğrudan rozet verdi');
        $this->assertSame('pending_review', $klinik2->verification_status);
    }
}
