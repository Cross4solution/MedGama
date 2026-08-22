<?php

namespace Tests\Feature;

use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * MedStream etkileşimi — beğeni, takip ve içerik şikâyeti.
 *
 * Beğeni sayısı akışta sıralamayı ve algılanan güveni etkiliyor, o yüzden
 * şişirilebilir olmamalı. Kritik nokta beğeninin AÇMA/KAPAMA olması:
 * sayaç ayrı bir tabloda tutuluyor ve her geçişte artırılıp azaltılıyor.
 * Sayaç ile gerçek beğeni sayısının ayrışması sessiz bir hata — akış
 * çalışmaya devam eder, sadece rakam yalan söyler.
 *
 * Şikâyet tarafında soru yetkilendirme: herkes şikâyet edebilmeli, ama
 * şikâyetleri GÖRMEK ve karara bağlamak yalnız moderasyonun işi.
 */
class MedStreamEtkilesimTest extends TestCase
{
    use RefreshDatabase;

    private User $yazar;
    private User $okur;
    private MedStreamPost $gonderi;

    protected function setUp(): void
    {
        parent::setUp();

        $this->yazar = User::factory()->doctor()->create(['is_verified' => true]);
        $this->okur = User::factory()->patient()->create();

        $this->gonderi = MedStreamPost::factory()->create([
            'author_id' => $this->yazar->id,
            'post_type' => 'text',
            'content'   => 'D vitamini hakkinda',
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function begen(User $user)
    {
        return $this->olarak($user)->postJson("/api/medstream/posts/{$this->gonderi->id}/like");
    }

    // ── Beğeni ──

    public function test_begeni_sayaci_artiyor(): void
    {
        // Pozitif kontrol: beğeni hiç işlemiyorsa aşağıdaki testler de
        // anlamsız olur.
        $this->assertSame(1, $this->begen($this->okur)->assertStatus(201)->json('like_count'));
    }

    public function test_ayni_kullanici_sayaci_sisiremiyor(): void
    {
        // Uç AÇMA/KAPAMA: ikinci istek beğeniyi geri alır, ikiye çıkarmaz.
        $this->begen($this->okur)->assertStatus(201);
        $ikinci = $this->begen($this->okur)->assertOk();

        $this->assertFalse($ikinci->json('liked'), 'ikinci istek beğeniyi kaldırmadı');
        $this->assertSame(0, $ikinci->json('like_count'), 'beğeni sayacı şişti');
    }

    public function test_arka_arkaya_gecisler_sayaci_bozmuyor(): void
    {
        // Sayaç ayrı tabloda artırılıp azaltılıyor; gerçek beğeni sayısıyla
        // ayrışması sessiz bir hata.
        for ($i = 0; $i < 5; $i++) {
            $this->begen($this->okur);
        }

        // Tek sayı: son durum beğenilmiş
        $son = $this->begen($this->okur);
        $this->assertSame(
            $son->json('liked') ? 1 : 0,
            $son->json('like_count'),
            'sayaç gerçek beğeni sayısından ayrıştı',
        );
    }

    public function test_farkli_kullanicilar_ayri_sayiliyor(): void
    {
        $this->begen($this->okur)->assertStatus(201);

        $ikinciOkur = User::factory()->patient()->create();
        $this->assertSame(2, $this->begen($ikinciOkur)->assertStatus(201)->json('like_count'));
    }

    public function test_giris_yapmamis_begenemiyor(): void
    {
        $this->postJson("/api/medstream/posts/{$this->gonderi->id}/like")->assertStatus(401);
    }

    // ── Takip ──

    public function test_kullanici_kendini_takip_edemiyor(): void
    {
        // Kendini takip etmek takipçi sayısını şişirmenin en kolay yolu.
        $yanit = $this->olarak($this->yazar)
            ->postJson("/api/medstream/follow/{$this->yazar->id}")
            ->assertOk();

        $this->assertFalse($yanit->json('following'), 'kullanıcı kendini takip etti');

        $this->assertSame(
            0,
            $this->olarak($this->yazar)
                ->getJson("/api/medstream/follow-counts/{$this->yazar->id}")
                ->assertOk()->json('followers'),
            'kendini takip takipçi sayısına eklendi',
        );
    }

    public function test_takip_sayaci_dogru(): void
    {
        $this->olarak($this->okur)->postJson("/api/medstream/follow/{$this->yazar->id}")->assertOk();

        $sayilar = $this->olarak($this->okur)
            ->getJson("/api/medstream/follow-counts/{$this->yazar->id}")->assertOk()->json();

        $this->assertSame(1, $sayilar['followers']);
    }

    public function test_takibi_birakinca_sayac_dusuyor(): void
    {
        $yol = "/api/medstream/follow/{$this->yazar->id}";
        $this->olarak($this->okur)->postJson($yol)->assertOk();
        $this->olarak($this->okur)->postJson($yol)->assertOk();

        $this->assertSame(
            0,
            $this->olarak($this->okur)
                ->getJson("/api/medstream/follow-counts/{$this->yazar->id}")->assertOk()->json('followers'),
            'takip bırakılınca sayaç düşmedi',
        );
    }

    public function test_ayni_kisiyi_iki_kez_takip_sayaci_sisiremiyor(): void
    {
        $yol = "/api/medstream/follow/{$this->yazar->id}";
        $this->olarak($this->okur)->postJson($yol)->assertOk();
        $this->olarak($this->okur)->postJson($yol)->assertOk();
        $this->olarak($this->okur)->postJson($yol)->assertOk();

        $this->assertSame(
            1,
            $this->olarak($this->okur)
                ->getJson("/api/medstream/follow-counts/{$this->yazar->id}")->assertOk()->json('followers'),
            'takipçi sayacı şişti',
        );
    }

    // ── Şikâyet ve moderasyon ──

    public function test_kullanici_gonderiyi_sikayet_edebiliyor(): void
    {
        // Şikâyet herkese açık olmalı; kapalı olsaydı zararlı içerik
        // bildirilemezdi.
        $this->olarak($this->okur)
            ->postJson("/api/medstream/posts/{$this->gonderi->id}/report", [
                // Alan adı `description`; açıklama ZORUNLU, boş şikâyetle
                // moderasyon kuyruğu doldurulamasın diye.
                'reason'      => 'spam',
                'description' => 'Tibbi olmayan reklam icerigi',
            ])
            ->assertStatus(201);
    }

    public function test_hasta_sikayet_listesini_goremiyor(): void
    {
        // Şikâyet listesi kimin kimi bildirdiğini gösteriyor; moderasyon dışı
        // kimseye açılmamalı.
        $this->olarak($this->okur)->getJson('/api/medstream/reports')->assertStatus(403);
    }

    public function test_doktor_sikayet_listesini_goremiyor(): void
    {
        $this->olarak($this->yazar)->getJson('/api/medstream/reports')->assertStatus(403);
    }

    public function test_yonetici_sikayet_listesini_gorebiliyor(): void
    {
        // Ters uç: koruma fazla geniş olursa moderasyon hiç çalışmaz.
        $this->olarak(User::factory()->admin()->create())
            ->getJson('/api/medstream/reports')
            ->assertOk();
    }

    public function test_hasta_sikayeti_karara_baglayamiyor(): void
    {
        $this->olarak($this->okur)
            ->postJson("/api/medstream/posts/{$this->gonderi->id}/report", [
                'reason'      => 'spam',
                'description' => 'Tibbi olmayan reklam icerigi',
            ])
            ->assertStatus(201);

        $rapor = \App\Models\MedStreamReport::firstOrFail();

        $this->olarak($this->okur)
            ->putJson("/api/medstream/reports/{$rapor->id}", ['status' => 'dismissed'])
            ->assertStatus(403);

        $this->assertNotSame('dismissed', $rapor->fresh()->status, 'hasta şikâyeti kapattı');
    }

    public function test_gonderi_sahibi_kendi_sikayetini_kapatamiyor(): void
    {
        // En doğrudan kötüye kullanım: hakkındaki şikâyeti yazarın kendisi
        // düşürmesi.
        $this->olarak($this->okur)
            ->postJson("/api/medstream/posts/{$this->gonderi->id}/report", [
                'reason'      => 'spam',
                'description' => 'Tibbi olmayan reklam icerigi',
            ])
            ->assertStatus(201);

        $rapor = \App\Models\MedStreamReport::firstOrFail();

        $this->olarak($this->yazar)
            ->putJson("/api/medstream/reports/{$rapor->id}", ['status' => 'dismissed'])
            ->assertStatus(403);

        $this->assertNotSame('dismissed', $rapor->fresh()->status, 'gönderi sahibi şikâyeti kapattı');
    }
}
