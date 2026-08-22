<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Destek talepleri ve kategori yönetimi.
 *
 * Talep gövdesi serbest metin: hasta oraya şikâyetini, ilacını, hatta
 * tahlil sonucunu yazabiliyor. Yani başkasının talebini okuyabilmek sağlık
 * verisi sızıntısı sayılmalı.
 *
 * Bulunan hata KATEGORİ uçlarındaydı: rotalarda "(admin)" yazıyordu ama
 * grup yalnız `auth:sanctum` taşıyor, denetleyicide de rol denetimi yoktu.
 * Ölçüldü — bir HASTA hesabı kategoriyi yeniden adlandırdı (200) ve sildi
 * (200). Yorumun "admin" demesi koruma değildir.
 */
class DestekTalebiTest extends TestCase
{
    use RefreshDatabase;

    private User $sahip;
    private User $yabanci;
    private TicketCategory $kategori;
    private Ticket $talep;

    protected function setUp(): void
    {
        parent::setUp();

        $this->kategori = TicketCategory::create([
            'name'       => ['en' => 'Billing', 'tr' => 'Faturalandirma'],
            'slug'       => 'billing',
            'is_active'  => true,
            'sort_order' => 1,
        ]);

        $this->sahip = User::factory()->patient()->create();
        $this->yabanci = User::factory()->patient()->create();

        $this->talep = Ticket::create([
            'ticket_number' => 'TKT-2026-00001',
            'user_id'       => $this->sahip->id,
            'category_id'   => $this->kategori->id,
            'subject'       => 'Faturamda hata var',
            'status'        => 'open',
            'priority'      => 'normal',
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    // ── Talep erişimi ──

    public function test_sahibi_kendi_talebini_goruyor(): void
    {
        // Pozitif kontrol: uç hiç veri döndürmüyor olsaydı ret testleri
        // hiçbir şey kanıtlamazdı.
        $this->assertStringContainsString(
            'Faturamda hata var',
            $this->olarak($this->sahip)->getJson('/api/support/tickets')->assertOk()->getContent(),
            'sahip kendi talebini göremedi',
        );
    }

    public function test_yabanci_baskasinin_talebini_listede_gormuyor(): void
    {
        $this->assertStringNotContainsString(
            'Faturamda hata var',
            $this->olarak($this->yabanci)->getJson('/api/support/tickets')->assertOk()->getContent(),
            'yabancı başkasının talebini gördü',
        );
    }

    public function test_yabanci_talep_detayina_erisemiyor(): void
    {
        $this->olarak($this->yabanci)
            ->getJson("/api/support/tickets/{$this->talep->id}")
            ->assertStatus(403);
    }

    public function test_yabanci_baskasinin_talebine_yanit_yazamiyor(): void
    {
        $this->olarak($this->yabanci)
            // Alan adı `body`; yanlış ad gönderilirse doğrulama yetki
            // denetiminden ÖNCE çalışıp 422 veriyor ve test yetkiyi ölçmüyor.
            ->postJson("/api/support/tickets/{$this->talep->id}/reply", ['body' => 'Yabanci yanit'])
            ->assertStatus(403);
    }

    public function test_yonetici_butun_talepleri_goruyor(): void
    {
        // Ters uç: destek ekibi talepleri göremezse sistem işe yaramaz.
        $this->assertStringContainsString(
            'Faturamda hata var',
            $this->olarak(User::factory()->admin()->create())
                ->getJson('/api/support/tickets')->assertOk()->getContent(),
        );
    }

    public function test_suzgecle_baskasinin_talebi_cekilemiyor(): void
    {
        // Süzgeçler `$request->all()` olarak servise geçiyor; kapsamın
        // ÜSTÜNE eklenmeli, yerine geçmemeli.
        $this->assertStringNotContainsString(
            'Faturamda hata var',
            $this->olarak($this->yabanci)
                ->getJson('/api/support/tickets?assigned_to=' . $this->sahip->id)
                ->assertOk()->getContent(),
            'süzgeçle başkasının talebi çekildi',
        );
    }

    public function test_hasta_istatistikleri_goremiyor(): void
    {
        $this->olarak($this->sahip)->getJson('/api/support/stats')->assertStatus(403);
    }

    // ── Kategori yönetimi: asıl bulgu ──

    public function test_hasta_kategori_silemiyor(): void
    {
        // Silinen kategori ona bağlı bütün talepleri etkiliyor.
        $this->olarak($this->sahip)
            ->deleteJson("/api/support/categories/{$this->kategori->id}")
            ->assertStatus(403);

        $this->assertNotNull(TicketCategory::find($this->kategori->id), 'hasta kategoriyi sildi');
    }

    public function test_hasta_kategori_adini_degistiremiyor(): void
    {
        $this->olarak($this->sahip)
            ->putJson("/api/support/categories/{$this->kategori->id}", ['name' => ['en' => 'ELE GECIRILDI']])
            ->assertStatus(403);

        // `name` modelde yerelleştirilmiş DİZGE olarak dönüyor (dizi değil):
        // `name['en']` tek bir karakter verirdi.
        $this->assertSame('Billing', $this->kategori->fresh()->name, 'hasta kategori adını değiştirdi');
    }

    public function test_hasta_kategori_olusturamiyor(): void
    {
        $this->olarak($this->sahip)
            ->postJson('/api/support/categories', [
                'name' => ['en' => 'Sahte Kategori'],
                'slug' => 'sahte',
            ])
            ->assertStatus(403);

        $this->assertSame(1, TicketCategory::count(), 'hasta kategori oluşturdu');
    }

    public function test_doktor_da_kategori_yonetemiyor(): void
    {
        // Doktor platformda daha yetkili bir rol; kategori yönetimi yine de
        // yalnız platform yöneticisinde olmalı.
        $this->olarak(User::factory()->doctor()->create())
            ->deleteJson("/api/support/categories/{$this->kategori->id}")
            ->assertStatus(403);

        $this->assertNotNull(TicketCategory::find($this->kategori->id));
    }

    public function test_yonetici_kategori_yonetebiliyor(): void
    {
        // Ters uç: koruma fazla geniş uygulanırsa destek ekibi kategori
        // ekleyemez ve bu, yalnız ret testleriyle gizlenirdi.
        $this->olarak(User::factory()->admin()->create())
            ->putJson("/api/support/categories/{$this->kategori->id}", ['name' => ['en' => 'Odeme']])
            ->assertOk();

        $this->assertSame('Odeme', $this->kategori->fresh()->name);
    }

    public function test_kategori_listesi_herkese_acik_kaliyor(): void
    {
        // Okuma kapatılmamalı: talep açan kullanıcı kategori seçebilmeli.
        $this->olarak($this->sahip)->getJson('/api/support/categories')->assertOk();
    }
}
