<?php

namespace Tests\Feature;

use App\Models\MedStreamComment;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * MedStream — kim yayınlayabilir, kim başkasının içeriğine dokunabilir.
 *
 * Akış hastaya açık ve gönderiler "doktor" etiketiyle görünüyor. İki ayrı
 * güvence var:
 *
 *   1. YAYIN HAKKI — hasta gönderi yazamaz, DOĞRULANMAMIŞ doktor da yazamaz.
 *      İkincisi asıl mesele: doğrulanmamış bir hesabın tıbbi içerik
 *      yayınlaması, platformun hekim etiketini güvenilmez kılar. Aynı kural
 *      yoruma da uygulanıyor, çünkü yorum da "doktor" rozetiyle görünüyor.
 *
 *   2. SAHİPLİK — başkasının gönderisi/yorumu düzenlenemez, silinemez.
 *
 * Kural ÜÇ bağımsız katmanda yazılı ve bu ölçülerek doğrulandı: ara
 * katmanlar (publish/comment), politika sınıfları, ve FormRequest'lerin
 * `authorize()` metotları. Ara katman ile politikayı birlikte devre dışı
 * bıraktığımda gönderi uçları hâlâ 403 verdi — üçüncü katman tuttu.
 *
 * Katmanlar aynı kuralı yazmıyor ama; farkları da burada çivileniyor.
 */
class MedStreamYayinVeSahiplikTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;
    private User $yabanciDoktor;
    private User $hasta;
    private MedStreamPost $gonderi;

    protected function setUp(): void
    {
        parent::setUp();

        $this->doktor = User::factory()->doctor()->create(['is_verified' => true]);
        $this->yabanciDoktor = User::factory()->doctor()->create(['is_verified' => true]);
        $this->hasta = User::factory()->patient()->create();

        $this->gonderi = MedStreamPost::factory()->create([
            'author_id' => $this->doktor->id,
            'post_type' => 'text',
            'content'   => 'Kis aylarinda D vitamini hakkinda',
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    // ── Yayın hakkı ──

    public function test_dogrulanmis_doktor_gonderi_yazabiliyor(): void
    {
        // Pozitif kontrol: yayın ucu tümden kapalı olsaydı aşağıdaki ret
        // testleri hiçbir şey kanıtlamazdı.
        $this->olarak($this->doktor)
            ->postJson('/api/medstream/posts', [
                'post_type' => 'text',
                'content'   => 'Yeni gonderi',
            ])
            ->assertStatus(201);
    }

    public function test_hasta_gonderi_yazamiyor(): void
    {
        $this->olarak($this->hasta)
            ->postJson('/api/medstream/posts', ['post_type' => 'text', 'content' => 'Hasta gonderisi'])
            ->assertStatus(403);

        $this->assertDatabaseMissing('med_stream_posts', ['content' => 'Hasta gonderisi']);
    }

    public function test_dogrulanmamis_doktor_gonderi_yazamiyor(): void
    {
        // Rozet güveni: doğrulanmamış hesap "doktor" etiketiyle tıbbi içerik
        // yayınlayabilseydi etiketin anlamı kalmazdı.
        $ham = User::factory()->doctor()->create(['is_verified' => false]);

        $this->olarak($ham)
            ->postJson('/api/medstream/posts', ['post_type' => 'text', 'content' => 'Dogrulanmamis gonderi'])
            ->assertStatus(403);

        $this->assertDatabaseMissing('med_stream_posts', ['content' => 'Dogrulanmamis gonderi']);
    }

    public function test_dogrulanmamis_doktor_yorum_da_yazamiyor(): void
    {
        // Yorum ayrı bir ara katman: yayın kuralı düzeltilip yorum unutulursa
        // aynı rozet yorum üzerinden kullanılabilir.
        $ham = User::factory()->doctor()->create(['is_verified' => false]);

        $this->olarak($ham)
            ->postJson("/api/medstream/posts/{$this->gonderi->id}/comments", ['content' => 'Ham yorum'])
            ->assertStatus(403);

        $this->assertDatabaseMissing('med_stream_comments', ['content' => 'Ham yorum']);
    }

    public function test_hasta_yorum_yazabiliyor(): void
    {
        // Ters uç: kural fazla geniş uygulanırsa hasta akışla etkileşemez.
        $this->olarak($this->hasta)
            ->postJson("/api/medstream/posts/{$this->gonderi->id}/comments", ['content' => 'Tesekkurler'])
            ->assertStatus(201);
    }

    // ── Gönderi sahipliği ──

    public function test_yabanci_baskasinin_gonderisini_duzenleyemiyor(): void
    {
        $this->olarak($this->yabanciDoktor)
            ->putJson("/api/medstream/posts/{$this->gonderi->id}", ['content' => 'ELE GECIRILDI'])
            ->assertStatus(403);

        $this->assertSame(
            'Kis aylarinda D vitamini hakkinda',
            $this->gonderi->fresh()->content,
            'gönderi içeriği değişti',
        );
    }

    public function test_yabanci_baskasinin_gonderisini_silemiyor(): void
    {
        $this->olarak($this->yabanciDoktor)
            ->deleteJson("/api/medstream/posts/{$this->gonderi->id}")
            ->assertStatus(403);

        $this->assertNotNull(MedStreamPost::find($this->gonderi->id), 'gönderi silindi');
    }

    public function test_sahibi_kendi_gonderisini_duzenleyebiliyor(): void
    {
        $this->olarak($this->doktor)
            ->putJson("/api/medstream/posts/{$this->gonderi->id}", ['content' => 'Guncellendi'])
            ->assertOk();

        $this->assertSame('Guncellendi', $this->gonderi->fresh()->content);
    }

    // ── Yorum sahipliği ──

    public function test_yabanci_baskasinin_yorumunu_duzenleyemiyor(): void
    {
        $yorum = MedStreamComment::create([
            'post_id'   => $this->gonderi->id,
            'author_id' => $this->hasta->id,
            'content'   => 'Hastanin yorumu',
            'is_active' => true,
        ]);

        $this->olarak($this->yabanciDoktor)
            ->putJson("/api/medstream/comments/{$yorum->id}", ['content' => 'DEGISTIRILDI'])
            ->assertStatus(403);

        $this->assertSame('Hastanin yorumu', $yorum->fresh()->content, 'yorum içeriği değişti');
    }

    public function test_gonderi_sahibi_kendi_gonderisindeki_yorumu_silebiliyor(): void
    {
        // Moderasyon: hekim kendi gönderisindeki yorumu kaldırabilmeli.
        $yorum = MedStreamComment::create([
            'post_id'   => $this->gonderi->id,
            'author_id' => $this->hasta->id,
            'content'   => 'Silinecek yorum',
            'is_active' => true,
        ]);

        $this->olarak($this->doktor)
            ->deleteJson("/api/medstream/comments/{$yorum->id}")
            ->assertOk();
    }

    public function test_baska_gonderinin_sahibi_yorumu_silemiyor(): void
    {
        // Moderasyon yetkisi KENDİ gönderisiyle sınırlı olmalı; olmasaydı her
        // doktor akıştaki her yorumu silebilirdi.
        $yorum = MedStreamComment::create([
            'post_id'   => $this->gonderi->id,
            'author_id' => $this->hasta->id,
            'content'   => 'Korunacak yorum',
            'is_active' => true,
        ]);

        $this->olarak($this->yabanciDoktor)
            ->deleteJson("/api/medstream/comments/{$yorum->id}")
            ->assertStatus(403);

        $this->assertNotNull(MedStreamComment::find($yorum->id), 'yorum silindi');
    }

    public function test_yorum_sahibi_kendi_yorumunu_silebiliyor(): void
    {
        $yorum = MedStreamComment::create([
            'post_id'   => $this->gonderi->id,
            'author_id' => $this->hasta->id,
            'content'   => 'Kendi yorumum',
            'is_active' => true,
        ]);

        $this->olarak($this->hasta)
            ->deleteJson("/api/medstream/comments/{$yorum->id}")
            ->assertOk();
    }

    public function test_hastane_baska_hesabin_gonderisini_duzenleyemiyor(): void
    {
        // DİKKAT — bu da bir tutarsızlığı KAYDEDİYOR, onaylamıyor.
        //
        // MedStreamPostPolicy::update, hastane hesabının KENDİ hastanesine
        // ait gönderileri düzenlemesine izin veriyor. UpdatePostRequest
        // ::authorize() ise yalnız yazara ve yöneticiye bakıyor. İstek sınıfı
        // politikadan ÖNCE çalıştığı için hastane pratikte düzenleyemiyor:
        // politikadaki dal ölü.
        //
        // Kapalı tarafta hata verdiği için düzeltilmedi — hastanenin kendi
        // gönderilerini yönetip yönetmeyeceği ürün kararı. Karar verilince bu
        // test kasten kırılacak ve iki katmanın ayrıştığı görülecek.
        $hastane = User::factory()->create(['role_id' => 'hospital', 'user_level' => 4]);

        $this->olarak($hastane)
            ->putJson("/api/medstream/posts/{$this->gonderi->id}", ['content' => 'HASTANE DUZENLEDI'])
            ->assertStatus(403);
    }

    // ── Gizlenen gönderi ──

    public function test_gizlenen_gonderi_akista_gorunmuyor(): void
    {
        $gizli = MedStreamPost::factory()->create([
            'author_id' => $this->doktor->id,
            'content'   => 'Gizlenmis icerik',
            'is_hidden' => true,
        ]);

        $yanit = $this->olarak($this->hasta)->getJson('/api/medstream/feed')->assertOk();

        $this->assertStringNotContainsString($gizli->id, $yanit->getContent(), 'gizlenen gönderi akışta çıktı');
    }
}
