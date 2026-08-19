<?php

namespace Tests\Feature;

use App\Models\MedStreamBookmark;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kaydedilen gönderiler listesi.
 *
 * Canlıda ekran "4 gönderi kaydedildi" yazıp altında "kayıtlı gönderi yok"
 * gösteriyordu: kaydedilen dört gönderi de silinmişti, yer imi satırları
 * yerinde kalmıştı. Sayaç satırları sayıyor, liste ise gönderisi olmayanları
 * eliyordu.
 *
 * Bu yüzden buradaki testler sayıyı ve listeyi HER ZAMAN birlikte doğrular —
 * ikisinin ayrışması hatanın kendisiydi.
 */
class KaydedilenGonderilerTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $doktor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hasta  = User::factory()->patient()->create();
        $this->doktor = User::factory()->doctor()->create();
    }

    private function yerImiEkle(MedStreamPost $gonderi): MedStreamBookmark
    {
        return MedStreamBookmark::create([
            'user_id'         => $this->hasta->id,
            'bookmarked_type' => 'post',
            'target_id'       => $gonderi->id,
            'is_active'       => true,
        ]);
    }

    /** @return array{0:int,1:int} sayaç ve listedeki kayıt adedi */
    private function listele(): array
    {
        $yanit = $this->actingAs($this->hasta, 'sanctum')
            ->getJson('/api/medstream/bookmarks?type=post&per_page=20');

        $yanit->assertOk();
        $govde = $yanit->json();

        return [(int) ($govde['total'] ?? 0), count($govde['data'] ?? [])];
    }

    public function test_kaydedilen_gonderi_listede_ve_sayacta_gorunuyor(): void
    {
        $gonderi = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);
        $this->yerImiEkle($gonderi);

        [$sayac, $adet] = $this->listele();
        $this->assertSame(1, $sayac);
        $this->assertSame(1, $adet);
    }

    public function test_gonderi_silinince_sayac_da_liste_de_bosaliyor(): void
    {
        $gonderi = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);
        $this->yerImiEkle($gonderi);

        $gonderi->delete();

        [$sayac, $adet] = $this->listele();
        $this->assertSame(0, $adet, 'Silinen gönderi listede görünüyor.');
        $this->assertSame(
            0,
            $sayac,
            "Sayaç {$sayac} diyor ama liste boş — kullanıcı yine çelişki görür.",
        );
    }

    public function test_gizlenen_gonderi_de_ayni_sekilde_dusuyor(): void
    {
        $gonderi = MedStreamPost::factory()->create([
            'author_id' => $this->doktor->id,
            'is_hidden' => true,
        ]);
        $this->yerImiEkle($gonderi);

        [$sayac, $adet] = $this->listele();
        $this->assertSame(0, $adet, 'Gizlenen gönderi listede görünüyor.');
        $this->assertSame(0, $sayac, 'Gizlenen gönderi sayaçta duruyor.');
    }

    public function test_duran_gonderiler_silinenlerden_etkilenmiyor(): void
    {
        $duran  = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);
        $silinen = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);

        $this->yerImiEkle($duran);
        $this->yerImiEkle($silinen);
        $silinen->delete();

        // Süzgeç fazla geniş olsaydı sağlam kaydı da düşürürdü.
        [$sayac, $adet] = $this->listele();
        $this->assertSame(1, $adet);
        $this->assertSame(1, $sayac);
    }
}
