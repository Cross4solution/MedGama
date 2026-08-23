<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Favorite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Favoriler ve takip — kullanıcının kendi listesi.
 *
 * Bu kontrolörün 12 ucu hiç sınanmamıştı. Taşıdığı veri kişisel: kimin hangi
 * kliniği/hekimi kaydettiği. Sızarsa bir kişinin hangi uzmanlıklarla
 * ilgilendiği görünür — sağlık bağlamında bu tek başına hassas bilgi.
 *
 * Ölçütler:
 *  • Liste, sayaç ve "favoride mi" yanıtı YALNIZCA çağıranın kaydını görsün.
 *  • Başkasının favorisi silinemesin.
 *  • Aynı kayıt iki kez eklenmesin (sayaç şişer).
 *  • Silinmiş bir hedef listeyi bozmasın.
 */
class SosyalFavoriTest extends TestCase
{
    use RefreshDatabase;

    private function hasta(): User
    {
        return User::factory()->patient()->create();
    }

    private function hekim(): User
    {
        return User::factory()->doctor()->create(['is_active' => true]);
    }

    private function favorile(User $kullanici, string $tur, string $kimlik)
    {
        return $this->actingAs($kullanici, 'sanctum')->postJson('/api/social/favorite', [
            'target_type' => $tur,
            'target_id'   => $kimlik,
        ]);
    }

    // ── Kapsam ──

    public function test_liste_yalnizca_kendi_favorilerini_gosteriyor(): void
    {
        $ben = $this->hasta();
        $baskasi = $this->hasta();

        $benimHekim = $this->hekim();
        $onunHekimi = $this->hekim();

        $this->favorile($ben, 'doctor', $benimHekim->id)->assertOk();
        app('auth')->forgetGuards();
        $this->favorile($baskasi, 'doctor', $onunHekimi->id)->assertOk();
        app('auth')->forgetGuards();

        $yanit = $this->actingAs($ben, 'sanctum')->getJson('/api/social/favorites')->assertOk();

        $kimlikler = collect($yanit->json('data'))->filter()->pluck('id');

        $this->assertTrue($kimlikler->contains($benimHekim->id));
        $this->assertFalse(
            $kimlikler->contains($onunHekimi->id),
            'başka kullanıcının favorisi listede görünüyor',
        );
    }

    public function test_sayac_baskasinin_favorilerini_saymiyor(): void
    {
        $ben = $this->hasta();
        $baskasi = $this->hasta();

        $this->favorile($baskasi, 'doctor', $this->hekim()->id)->assertOk();
        app('auth')->forgetGuards();

        $this->actingAs($ben, 'sanctum')
            ->getJson('/api/social/favorites/count')
            ->assertOk()
            ->assertJsonPath('count', 0);
    }

    public function test_favoride_mi_yaniti_kullaniciya_ozel(): void
    {
        $ben = $this->hasta();
        $baskasi = $this->hasta();
        $hekim = $this->hekim();

        $this->favorile($baskasi, 'doctor', $hekim->id)->assertOk();
        app('auth')->forgetGuards();

        $this->actingAs($ben, 'sanctum')
            ->getJson("/api/social/is-favorited?target_type=doctor&target_id={$hekim->id}")
            ->assertOk()
            ->assertJsonPath('favorited', false);
    }

    public function test_baskasinin_favorisi_silinemiyor(): void
    {
        $ben = $this->hasta();
        $baskasi = $this->hasta();
        $hekim = $this->hekim();

        $this->favorile($baskasi, 'doctor', $hekim->id)->assertOk();
        app('auth')->forgetGuards();

        // Aynı hedefi "favoriden çıkar" — kendi kaydım olmadığı için
        // başkasınınkine dokunmamalı.
        $this->actingAs($ben, 'sanctum')->postJson('/api/social/unfavorite', [
            'target_type' => 'doctor',
            'target_id'   => $hekim->id,
        ])->assertOk();

        $this->assertDatabaseHas('favorites', [
            'user_id'        => $baskasi->id,
            'favoritable_id' => $hekim->id,
        ]);
    }

    // ── Kayıt bütünlüğü ──

    public function test_ayni_hedef_iki_kez_eklenmiyor(): void
    {
        // Çift kayıt sayacı şişirir ve listede aynı hekim iki kez görünür.
        $ben = $this->hasta();
        $hekim = $this->hekim();

        $this->favorile($ben, 'doctor', $hekim->id)->assertOk();
        app('auth')->forgetGuards();
        $this->favorile($ben, 'doctor', $hekim->id)->assertOk();
        app('auth')->forgetGuards();

        $this->assertSame(1, Favorite::where('user_id', $ben->id)->count());

        $this->actingAs($ben, 'sanctum')
            ->getJson('/api/social/favorites/count')
            ->assertJsonPath('count', 1);
    }

    public function test_olmayan_hedef_favorilenemiyor(): void
    {
        // Doğrulanmayan bir kimlik, listede çözülemeyen kayıt bırakırdı.
        $this->actingAs($this->hasta(), 'sanctum')->postJson('/api/social/favorite', [
            'target_type' => 'doctor',
            'target_id'   => '00000000-0000-4000-8000-000000000000',
        ])->assertNotFound();
    }

    public function test_pasif_hekim_favorilenemiyor(): void
    {
        $pasif = User::factory()->doctor()->create(['is_active' => false]);

        $this->actingAs($this->hasta(), 'sanctum')->postJson('/api/social/favorite', [
            'target_type' => 'doctor',
            'target_id'   => $pasif->id,
        ])->assertNotFound();
    }

    public function test_silinen_hedef_listeyi_bozmuyor(): void
    {
        // Favorilenen klinik sonradan silinirse liste o kaydı ÇÖZEMİYOR.
        // Ölçüt: yanıt yine de geçerli olsun ve arayüza boş kayıt gitmesin.
        $ben = $this->hasta();
        $klinik = Clinic::factory()->create();

        $this->favorile($ben, 'clinic', $klinik->id)->assertOk();
        app('auth')->forgetGuards();

        $klinik->delete();

        $yanit = $this->actingAs($ben, 'sanctum')->getJson('/api/social/favorites')->assertOk();

        $this->assertIsArray($yanit->json('data'));
        $this->assertNotContains(null, $yanit->json('data'), 'silinen hedef listeye null olarak giriyor');
    }

    // ── Takip ──

    public function test_kullanici_kendini_takip_edemiyor(): void
    {
        $hekim = $this->hekim();

        $this->actingAs($hekim, 'sanctum')->postJson('/api/social/follow', [
            'target_type' => 'doctor',
            'target_id'   => $hekim->id,
        ])->assertStatus(422);
    }

    public function test_oturumsuz_favori_uclarina_erisilemiyor(): void
    {
        // Kapının kendisi: bu uçların hepsi kişisel veri taşıyor.
        $this->postJson('/api/social/favorite', [
            'target_type' => 'doctor',
            'target_id'   => $this->hekim()->id,
        ])->assertUnauthorized();

        $this->getJson('/api/social/favorites')->assertUnauthorized();
        $this->getJson('/api/social/favorites/count')->assertUnauthorized();
    }
}
