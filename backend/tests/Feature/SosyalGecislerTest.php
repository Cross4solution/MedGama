<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Takip ve favori geçişleri — `POST /api/social/toggle-follow|toggle-favorite`.
 *
 * Kapsanmayan yazma uçları arasındaydılar. "Geçiş" (toggle) uçlarının kendine
 * özgü bir sessiz hata sınıfı var: iki kez çağrıldığında BAŞLANGIÇ DURUMUNA
 * dönmeleri gerekir. Dönmezlerse her tıklama bir kayıt daha yazar; takipçi
 * sayısı şişer, kullanıcı "takip ediliyor" görürken sunucu iki satır tutar.
 * Hiçbir yerde hata görünmez, yalnız sayılar yalan söyler.
 *
 * Ölçülenler:
 *   • Geçiş simetrik: aç-kapa başlangıca dönüyor, ikinci satır yazılmıyor.
 *   • Kimse kendini takip edemiyor.
 *   • Var olmayan ya da pasif hedef kabul edilmiyor — aksi hâlde silinmiş bir
 *     hekim için takip kaydı üretilebilirdi.
 *   • Bir kullanıcının geçişi başkasınınkini etkilemiyor.
 */
class SosyalGecislerTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $hekim;
    private Clinic $klinik;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create();
        $this->hekim = User::factory()->doctor()->create(['is_active' => true, 'is_verified' => true]);

        $sahip = User::factory()->clinicOwner()->create();
        $this->klinik = Clinic::factory()->create(['owner_id' => $sahip->id, 'is_active' => true]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function gecis(User $user, string $uc, string $tur, string $kimlik)
    {
        return $this->olarak($user)->postJson("/api/social/$uc", [
            'target_type' => $tur,
            'target_id'   => $kimlik,
        ]);
    }

    public function test_takip_gecisi_simetrik(): void
    {
        $ac = $this->gecis($this->hasta, 'toggle-follow', 'doctor', $this->hekim->id)->assertOk();
        $this->assertTrue($ac->json('following'), 'ilk geçiş takibi açmıyor');

        $kapa = $this->gecis($this->hasta, 'toggle-follow', 'doctor', $this->hekim->id)->assertOk();
        $this->assertFalse($kapa->json('following'), 'ikinci geçiş takibi kapatmıyor');

        // Asıl mesele: iki satır birikmemiş olmalı.
        $this->assertDatabaseCount('doctor_follows', 1);
    }

    public function test_favori_gecisi_simetrik_ve_kayit_birakmiyor(): void
    {
        $this->gecis($this->hasta, 'toggle-favorite', 'clinic', $this->klinik->id)->assertOk();
        $this->assertDatabaseCount('favorites', 1);

        $this->gecis($this->hasta, 'toggle-favorite', 'clinic', $this->klinik->id)->assertOk();

        // Favori geçişi kaydı SİLİYOR (takip ise bayrak çeviriyor); ikisi ayrı
        // tasarım ve ikisi de burada kayda geçiyor.
        $this->assertDatabaseCount('favorites', 0);
    }

    public function test_kimse_kendini_takip_edemiyor(): void
    {
        $this->gecis($this->hekim, 'toggle-follow', 'doctor', $this->hekim->id)
            ->assertStatus(422);

        $this->assertDatabaseCount('doctor_follows', 0);
    }

    public function test_var_olmayan_hedef_kabul_edilmiyor(): void
    {
        $this->gecis($this->hasta, 'toggle-follow', 'doctor', (string) \Illuminate\Support\Str::uuid())
            ->assertStatus(404);

        $this->gecis($this->hasta, 'toggle-favorite', 'clinic', (string) \Illuminate\Support\Str::uuid())
            ->assertStatus(404);

        $this->assertDatabaseCount('doctor_follows', 0);
        $this->assertDatabaseCount('favorites', 0);
    }

    public function test_pasif_hedef_takip_edilemiyor(): void
    {
        // Pasife alınmış bir hekim listelerde görünmüyor; takip kaydı üretmek
        // onu arka kapıdan geri getirir.
        $pasifHekim = User::factory()->doctor()->create(['is_active' => false]);
        $pasifKlinik = Clinic::factory()->create([
            'owner_id'  => User::factory()->clinicOwner()->create()->id,
            'is_active' => false,
        ]);

        $this->gecis($this->hasta, 'toggle-follow', 'doctor', $pasifHekim->id)->assertStatus(404);
        $this->gecis($this->hasta, 'toggle-favorite', 'clinic', $pasifKlinik->id)->assertStatus(404);

        $this->assertDatabaseCount('doctor_follows', 0);
        $this->assertDatabaseCount('favorites', 0);
    }

    public function test_bir_kullanicinin_gecisi_digerini_etkilemiyor(): void
    {
        $digerHasta = User::factory()->patient()->create();

        $this->gecis($this->hasta, 'toggle-follow', 'doctor', $this->hekim->id)->assertOk();

        // İkincisi için bu İLK geçiş; kapatma değil açma olmalı.
        $yanit = $this->gecis($digerHasta, 'toggle-follow', 'doctor', $this->hekim->id)->assertOk();

        $this->assertTrue($yanit->json('following'), 'başkasının takibi bu kullanıcının durumunu belirliyor');
        $this->assertDatabaseCount('doctor_follows', 2);
    }
}
