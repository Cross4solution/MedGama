<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\DoctorFaq;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Profil varlıkları — akreditasyon, şube, hekim SSS'i.
 *
 * Üçü de bir sağlayıcının vitrinini oluşturuyor ve üçünde de aynı soru var:
 * başkasının vitrinine yazabiliyor musun?
 *
 * Akreditasyon bu üçünün en ağırı: "JCI akrediteli" ibaresi hastanın hekim
 * seçimini doğrudan etkileyen bir güven işareti — klinik doğrulama rozetiyle
 * aynı sınıf. Kendine takabilmek ya da rakibinkini sökebilmek doğrudan
 * yanıltıcı sağlık pazarlaması olurdu.
 *
 * Bu turda hata çıkmadı; testler mevcut korumaları çiviliyor. Üçü de ayrı
 * denetleyicide ve ayrı biçimde koruyor (akreditasyonda sahiplik denetimi,
 * şubede hastane üzerinden kapsam, SSS'te doctor_id kapsamı), yani birinin
 * gevşemesi öbürlerinden anlaşılmaz.
 */
class ProfilVarliklariSahiplikTest extends TestCase
{
    use RefreshDatabase;

    private User $sahip;
    private Clinic $klinik;
    private string $akreditasyonId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sahip = User::factory()->clinicOwner()->create();
        $this->klinik = Clinic::factory()->create(['owner_id' => $this->sahip->id]);
        $this->sahip->forceFill(['clinic_id' => $this->klinik->id])->save();

        $this->akreditasyonId = (string) Str::uuid();
        DB::table('accreditations')->insert([
            'id'         => $this->akreditasyonId,
            'name'       => 'JCI Accredited',
            'category'   => 'certification',
            'is_active'  => true,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function akreditasyonSayisi(): int
    {
        return DB::table('clinic_accreditations')->where('clinic_id', $this->klinik->id)->count();
    }

    private function takmayiDene(User $user)
    {
        return $this->olarak($user)->postJson(
            "/api/clinics/{$this->klinik->id}/accreditations",
            ['accreditation_ids' => [$this->akreditasyonId]],
        );
    }

    // ── Akreditasyon ──

    public function test_klinik_sahibi_kendi_akreditasyonunu_ekleyebiliyor(): void
    {
        // Pozitif kontrol: uç tümden kapalıysa aşağıdaki ret testleri hiçbir
        // şey kanıtlamaz.
        $this->takmayiDene($this->sahip)->assertSuccessful();

        $this->assertSame(1, $this->akreditasyonSayisi(), 'sahip kendi akreditasyonunu ekleyemedi');
    }

    public function test_yabanci_klinik_sahibi_akreditasyon_takamiyor(): void
    {
        // Rakibin vitrinine sahte güven işareti asmak.
        $yabanci = User::factory()->clinicOwner()->create();
        Clinic::factory()->create(['owner_id' => $yabanci->id]);

        $this->takmayiDene($yabanci)->assertStatus(403);
        $this->assertSame(0, $this->akreditasyonSayisi(), 'yabancı klinik sahibi akreditasyon taktı');
    }

    public function test_hasta_akreditasyon_takamiyor(): void
    {
        $this->takmayiDene(User::factory()->patient()->create())->assertStatus(403);

        $this->assertSame(0, $this->akreditasyonSayisi());
    }

    public function test_doktor_akreditasyon_takamiyor(): void
    {
        $this->takmayiDene(User::factory()->doctor()->create())->assertStatus(403);

        $this->assertSame(0, $this->akreditasyonSayisi());
    }

    public function test_yabanci_baskasinin_akreditasyonunu_sokemiyor(): void
    {
        // Ters yön: rakibin gerçek belgesini kaldırmak da aynı ölçüde zararlı.
        $this->takmayiDene($this->sahip)->assertSuccessful();

        $yabanci = User::factory()->clinicOwner()->create();
        Clinic::factory()->create(['owner_id' => $yabanci->id]);

        $this->olarak($yabanci)
            ->deleteJson("/api/clinics/{$this->klinik->id}/accreditations/{$this->akreditasyonId}")
            ->assertStatus(403);

        $this->assertSame(1, $this->akreditasyonSayisi(), 'yabancı akreditasyonu söktü');
    }

    // ── Hekim SSS'i ──

    public function test_hekim_kendi_sssini_duzenleyebiliyor(): void
    {
        $hekim = User::factory()->doctor()->create(['is_verified' => true]);

        $this->olarak($hekim)
            ->postJson('/api/doctor-profile/faqs', [
                'question' => 'Randevu nasil alinir?',
                'answer'   => 'Profil sayfasindan uygun saati secerek.',
            ])
            ->assertSuccessful();

        $this->assertSame(1, DoctorFaq::where('doctor_id', $hekim->id)->count());
    }

    public function test_yabanci_hekim_baskasinin_sssini_degistiremiyor(): void
    {
        // SSS hekimin ağzından konuşuyor: başkası adına yazmak, hastaya
        // yanlış bilgi vermenin doğrudan yolu.
        $hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $sss = DoctorFaq::create([
            'doctor_id' => $hekim->id,
            'question'  => 'Randevu nasil alinir?',
            'answer'    => 'DOGRU CEVAP',
            'sort_order' => 1,
        ]);

        $yabanci = User::factory()->doctor()->create(['is_verified' => true]);

        $this->olarak($yabanci)
            ->putJson("/api/doctor-profile/faqs/{$sss->id}", ['answer' => 'YANLIS CEVAP'])
            ->assertStatus(404);

        $this->assertSame('DOGRU CEVAP', $sss->fresh()->answer, 'yabancı hekim SSS cevabını değiştirdi');
    }

    public function test_yabanci_hekim_baskasinin_sssini_silemiyor(): void
    {
        $hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $sss = DoctorFaq::create([
            'doctor_id'  => $hekim->id,
            'question'   => 'Soru',
            'answer'     => 'Cevap',
            'sort_order' => 1,
        ]);

        $this->olarak(User::factory()->doctor()->create(['is_verified' => true]))
            ->deleteJson("/api/doctor-profile/faqs/{$sss->id}")
            ->assertStatus(404);

        $this->assertNotNull(DoctorFaq::find($sss->id), 'yabancı hekim SSS sildi');
    }

    // ── Şube ──

    public function test_hastane_kendi_subesini_yonetebiliyor(): void
    {
        [$hastane, $sube] = $this->hastaneVeSube();

        $this->olarak($hastane)
            ->putJson("/api/branches/{$sube}", ['name' => 'Yeni Sube Adi'])
            ->assertSuccessful();
    }

    public function test_yabanci_hastane_baskasinin_subesini_yonetemiyor(): void
    {
        [, $sube] = $this->hastaneVeSube();

        $yabanciKayit = Hospital::create([
            'name'     => 'Yabanci Hastane',
            'fullname' => 'Yabanci Hastane',
            'codename' => 'yabanci-hastane',
        ]);
        $yabanci = User::factory()->create([
            'role_id'     => 'hospital',
            'user_level'  => 4,
            'hospital_id' => $yabanciKayit->id,
        ]);

        $this->olarak($yabanci)
            ->deleteJson("/api/branches/{$sube}")
            ->assertStatus(404);
    }

    /** @return array{0: User, 1: string} */
    private function hastaneVeSube(): array
    {
        $kayit = Hospital::create([
            'name'     => 'Deneme Hastanesi',
            'fullname' => 'Deneme Hastanesi',
            'codename' => 'deneme-hastanesi-sube',
        ]);
        $hastane = User::factory()->create([
            'role_id'     => 'hospital',
            'user_level'  => 4,
            'hospital_id' => $kayit->id,
        ]);

        $yanit = $this->olarak($hastane)
            ->postJson('/api/branches', ['name' => 'Merkez Sube', 'address' => 'Adres'])
            ->assertSuccessful();

        $id = $yanit->json('branch.id') ?? $yanit->json('id') ?? $yanit->json('data.id');
        $this->assertNotNull($id, 'şube yanıtında kimlik yok');

        return [$hastane, $id];
    }
}
