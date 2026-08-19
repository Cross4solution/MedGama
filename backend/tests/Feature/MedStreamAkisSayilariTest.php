<?php

namespace Tests\Feature;

use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Akıştaki beğeni/yorum sayıları ve "en çok etkileşim" sıralaması.
 *
 * Akış her satır için beş ayrı alt sorgu çalıştırıyordu; ikisi hiç
 * kullanılmayan değerler içindi. Kaldırıldılar. Bu testler kaldırılanların
 * gerçekten gereksiz olduğunu sabitliyor: sayılar doğru gelmeye devam etmeli
 * ve etkileşime göre sıralama çalışmalı.
 */
class MedStreamAkisSayilariTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->doktor = User::factory()->doctor()->create();
    }

    private function begeni(MedStreamPost $gonderi, int $adet, bool $aktif = true): void
    {
        for ($i = 0; $i < $adet; $i++) {
            DB::table('med_stream_likes')->insert([
                'id'         => (string) Str::uuid(),
                'post_id'    => $gonderi->id,
                'user_id'    => User::factory()->patient()->create()->id,
                'is_active'  => $aktif,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function yorum(MedStreamPost $gonderi, int $adet, bool $gizli = false): void
    {
        for ($i = 0; $i < $adet; $i++) {
            DB::table('med_stream_comments')->insert([
                'id'         => (string) Str::uuid(),
                'post_id'    => $gonderi->id,
                'author_id'  => User::factory()->patient()->create()->id,
                'content'    => 'Test yorumu',
                'is_hidden'  => $gizli,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function akistanBul(string $gonderiId, string $sort = 'recent'): ?array
    {
        $govde = $this->getJson("/api/medstream/posts?per_page=50&sort={$sort}")->assertOk()->json();

        foreach ($govde['data'] ?? [] as $g) {
            if (($g['id'] ?? null) === $gonderiId) {
                return $g;
            }
        }

        return null;
    }

    public function test_begeni_ve_yorum_sayilari_akista_dogru(): void
    {
        $gonderi = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);
        $this->begeni($gonderi, 3);
        $this->yorum($gonderi, 2);

        $akistaki = $this->akistanBul($gonderi->id);
        $this->assertNotNull($akistaki, 'Gönderi akışta yok.');

        $this->assertSame(3, $akistaki['engagement_counter']['like_count']);
        $this->assertSame(2, $akistaki['engagement_counter']['comment_count']);
    }

    public function test_geri_alinan_begeni_ve_gizlenen_yorum_sayilmiyor(): void
    {
        $gonderi = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);
        $this->begeni($gonderi, 2);
        $this->begeni($gonderi, 3, aktif: false);   // geri alınmış beğeniler
        $this->yorum($gonderi, 1);
        $this->yorum($gonderi, 4, gizli: true);      // moderasyonla gizlenmiş

        $akistaki = $this->akistanBul($gonderi->id);

        // Denormalize sayaç tablosuna düşülseydi bu ayrım kaybolurdu.
        $this->assertSame(2, $akistaki['engagement_counter']['like_count']);
        $this->assertSame(1, $akistaki['engagement_counter']['comment_count']);
    }

    public function test_en_cok_etkilesim_siralamasi_calisiyor(): void
    {
        $sakin  = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);
        $populer = MedStreamPost::factory()->create(['author_id' => $this->doktor->id]);

        // Etkileşim puanı sayaç tablosundan okunuyor; sıralamanın çalışması
        // için oraya yazılması gerekiyor.
        foreach ([[$sakin->id, 1, 0], [$populer->id, 40, 20]] as [$id, $begeni, $yorum]) {
            DB::table('med_stream_engagement_counters')->insert([
                'id'            => (string) Str::uuid(),
                'post_id'       => $id,
                'like_count'    => $begeni,
                'comment_count' => $yorum,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        $govde = $this->getJson('/api/medstream/posts?per_page=50&sort=top')->assertOk()->json();
        $sira  = array_column($govde['data'] ?? [], 'id');

        $this->assertContains($populer->id, $sira);
        $this->assertLessThan(
            array_search($sakin->id, $sira, true),
            array_search($populer->id, $sira, true),
            'Etkileşimi yüksek gönderi üstte değil — "top" sıralaması bozuldu.',
        );
    }

    public function test_varsayilan_siralama_en_yeniden_eskiye(): void
    {
        $eski = MedStreamPost::factory()->create([
            'author_id'  => $this->doktor->id,
            'created_at' => now()->subDays(3),
        ]);
        $yeni = MedStreamPost::factory()->create([
            'author_id'  => $this->doktor->id,
            'created_at' => now(),
        ]);

        $sira = array_column($this->getJson('/api/medstream/posts?per_page=50')->json()['data'] ?? [], 'id');

        $this->assertLessThan(
            array_search($eski->id, $sira, true),
            array_search($yeni->id, $sira, true),
            'Varsayılan akış tarihe göre sıralanmıyor.',
        );
    }
}
