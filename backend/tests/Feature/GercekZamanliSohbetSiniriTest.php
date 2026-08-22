<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /chat/* — ikinci mesajlaşma sistemi (/messages/* ile ayrı).
 *
 * Burada uçlar rota-model bağlama kullanıyor: `ChatConversation $conversation`
 * doğrudan kimlikten çözülüyor, sorguda kapsam YOK. Erişimi tümüyle
 * ChatConversationPolicy tutuyor. Tek kapı olduğu için ayrıca sınanıyor —
 * `$this->authorize()` çağrısını düşüren bir uç, sohbeti sessizce açar.
 *
 * İkinci kural: hasta, randevusu olmayan bir doktora yazamaz. Bu ticari
 * değil güvenlik kuralı — onsuz platformdaki her doktor, her hastadan
 * doğrudan mesaj alabilir hale gelir.
 */
class GercekZamanliSohbetSiniriTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $doktor;
    private User $yabanci;
    private ChatConversation $sohbet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create();
        $this->doktor = User::factory()->doctor()->create();
        $this->yabanci = User::factory()->patient()->create();

        $this->sohbet = ChatConversation::findOrCreateBetween($this->hasta->id, $this->doktor->id);

        ChatMessage::factory()->create([
            'conversation_id' => $this->sohbet->id,
            'sender_id'       => $this->hasta->id,
            'content'         => 'Recetemi yenileyebilir misiniz',
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    // ── Pozitif kontroller ──

    public function test_katilimci_mesajlari_okuyabiliyor(): void
    {
        // Olmazsa aşağıdaki ret testleri, uç herkese kapalı olduğu için de
        // geçebilirdi.
        $this->olarak($this->doktor)
            ->getJson("/api/chat/conversations/{$this->sohbet->id}/messages")
            ->assertOk()
            ->assertJsonFragment(['content' => 'Recetemi yenileyebilir misiniz']);
    }

    public function test_katilimci_mesaj_gonderebiliyor(): void
    {
        $this->olarak($this->doktor)
            ->postJson("/api/chat/conversations/{$this->sohbet->id}/messages", [
                'content' => 'Tabii, yeniledim',
            ])
            ->assertStatus(201);
    }

    // ── Yabancı hiçbir uca giremiyor ──

    public function test_yabanci_mesajlari_okuyamiyor(): void
    {
        $this->olarak($this->yabanci)
            ->getJson("/api/chat/conversations/{$this->sohbet->id}/messages")
            ->assertStatus(403);
    }

    public function test_yabanci_sohbete_yazamiyor(): void
    {
        $this->olarak($this->yabanci)
            ->postJson("/api/chat/conversations/{$this->sohbet->id}/messages", [
                'content' => 'Ilacinizi birakin',
            ])
            ->assertStatus(403);

        $this->assertDatabaseMissing('chat_messages', ['sender_id' => $this->yabanci->id]);
    }

    public function test_yabanci_okundu_isaretleyemiyor(): void
    {
        $this->olarak($this->yabanci)
            ->postJson("/api/chat/conversations/{$this->sohbet->id}/read")
            ->assertStatus(403);
    }

    public function test_yabanci_yaziyor_bildirimi_yayinlayamiyor(): void
    {
        // Zararsız görünür ama karşı tarafa gerçek zamanlı sinyal gönderir:
        // sohbetin varlığını doğrular ve taciz aracına dönüşür.
        $this->olarak($this->yabanci)
            ->postJson("/api/chat/conversations/{$this->sohbet->id}/typing", ['is_typing' => true])
            ->assertStatus(403);
    }

    public function test_sohbet_listesi_baskasinin_yazismasini_vermiyor(): void
    {
        $yanit = $this->olarak($this->yabanci)->getJson('/api/chat/conversations')->assertOk();

        $this->assertStringNotContainsString(
            $this->sohbet->id,
            $yanit->getContent(),
            'sohbet listesi yabancıya başkasının yazışmasını gösterdi',
        );
    }

    // ── Hasta, randevusu olmayan doktora yazamaz ──

    public function test_randevusuz_hasta_doktora_sohbet_acamiyor(): void
    {
        $baskaDoktor = User::factory()->doctor()->create();

        $this->olarak($this->hasta)
            ->postJson('/api/chat/conversations', ['recipient_id' => $baskaDoktor->id])
            ->assertStatus(403);
    }

    public function test_bekleyen_randevu_sohbet_acmaya_yetmiyor(): void
    {
        // Yalnız 'confirmed'/'completed' sayılıyor. 'pending' yetseydi herkes
        // randevu talebi bırakıp istediği doktora yazabilirdi.
        $baskaDoktor = User::factory()->doctor()->create();
        Appointment::factory()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $baskaDoktor->id,
            'status'     => 'pending',
        ]);

        $this->olarak($this->hasta)
            ->postJson('/api/chat/conversations', ['recipient_id' => $baskaDoktor->id])
            ->assertStatus(403);
    }

    public function test_onayli_randevusu_olan_hasta_sohbet_acabiliyor(): void
    {
        // Kuralın ters ucu: kural fazla sıkı olsaydı hasta doktoruna hiç
        // ulaşamazdı.
        $baskaDoktor = User::factory()->doctor()->create();
        Appointment::factory()->confirmed()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $baskaDoktor->id,
        ]);

        $yanit = $this->olarak($this->hasta)
            ->postJson('/api/chat/conversations', ['recipient_id' => $baskaDoktor->id]);

        $this->assertContains($yanit->getStatusCode(), [200, 201], 'randevulu hasta sohbet açamadı');
    }

    public function test_iptal_edilen_randevu_sohbet_acmaya_yetmiyor(): void
    {
        $baskaDoktor = User::factory()->doctor()->create();
        Appointment::factory()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $baskaDoktor->id,
            'status'     => 'cancelled',
        ]);

        $this->olarak($this->hasta)
            ->postJson('/api/chat/conversations', ['recipient_id' => $baskaDoktor->id])
            ->assertStatus(403);
    }
}
