<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hasta-doktor yazışması. Katılımcı olmayan HİÇBİR ŞEY yapamamalı.
 *
 * Bu yazışmalar sağlık verisi taşıyor: şikâyet, tanı, ilaç. Sızması KVKK
 * Md. 6 / GDPR Art. 9 kapsamında özel nitelikli veri ihlali.
 *
 * Erişim `Conversation::forUser()` kapsamına dayanıyor ve her uçta ELLE
 * çağrılıyor — ara katman değil. Yeni bir uç bunu çağırmayı unutursa
 * yazışma herkese açılır, üstelik sessizce. Bu yüzden test tek tek her
 * ucu deniyor.
 *
 * Saldırgan da giriş yapmış geçerli bir kullanıcı (yabancı bir doktor):
 * asıl risk dışarıdan değil, platformdaki başka bir hesaptan gelir.
 */
class SohbetErisimSiniriTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $doktor;
    private User $yabanci;
    private Conversation $sohbet;
    private Message $mesaj;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create();
        $this->doktor = User::factory()->doctor()->create();
        $this->yabanci = User::factory()->doctor()->create();

        $this->sohbet = Conversation::create(['type' => 'direct', 'is_active' => true]);

        foreach ([$this->hasta, $this->doktor] as $k) {
            ConversationParticipant::create([
                'conversation_id' => $this->sohbet->id,
                'user_id'         => $k->id,
                'role'            => 'member',
                'is_active'       => true,
            ]);
        }

        $this->mesaj = Message::create([
            'conversation_id' => $this->sohbet->id,
            'sender_id'       => $this->hasta->id,
            'body'            => 'Sabahları göğsümde baskı hissediyorum',
            'type'            => 'text',
            'is_active'       => true,
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /**
     * Yanıtın her yerinden `body` alanlarını toplar.
     *
     * Ham JSON metninde arama yapılamıyor: Türkçe harfler \uXXXX olarak
     * kaçırıldığı için düz dizge karşılaştırması ASLA eşleşmez ve sızıntı
     * doğrulaması farkında olmadan boşa çıkar — ilk yazımda tam olarak bu
     * oldu.
     */
    private function govdeleriTopla(mixed $dugum): array
    {
        if (!is_array($dugum)) {
            return [];
        }

        $bulunan = [];
        foreach ($dugum as $anahtar => $deger) {
            if ($anahtar === 'body' && is_string($deger)) {
                $bulunan[] = $deger;
            } elseif (is_array($deger)) {
                $bulunan = array_merge($bulunan, $this->govdeleriTopla($deger));
            }
        }

        return $bulunan;
    }

    // ── Katılımcılar erişebiliyor (testin ölçtüğü şeyin var olduğunu doğrular) ──

    public function test_katilimci_yazismasini_okuyabiliyor(): void
    {
        // Bu geçmezse aşağıdaki "yabancı giremiyor" testleri boşuna yeşil
        // olurdu: uç zaten herkese kapalı olabilirdi.
        $this->olarak($this->doktor)
            ->getJson("/api/messages/conversations/{$this->sohbet->id}/messages")
            ->assertOk()
            ->assertJsonFragment(['body' => 'Sabahları göğsümde baskı hissediyorum']);
    }

    // ── Yabancı hiçbir uca giremiyor ──

    public function test_yabanci_mesajlari_okuyamiyor(): void
    {
        $yanit = $this->olarak($this->yabanci)
            ->getJson("/api/messages/conversations/{$this->sohbet->id}/messages");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı mesajları okudu');

        // Ham gövdede metin ARAMAK İŞE YARAMIYOR: JSON, Türkçe harfleri
        // \u00f6 gibi kaçırıyor, dolayısıyla düz dizge araması hiçbir zaman
        // eşleşmez ve doğrulama sessizce boşa çıkar. Çözülmüş yapıya bakılır.
        $this->assertNotContains(
            $this->mesaj->body,
            $this->govdeleriTopla($yanit->json()),
            'yabancıya mesaj gövdesi sızdı',
        );
    }

    public function test_yabanci_sohbet_basligini_goremiyor(): void
    {
        $yanit = $this->olarak($this->yabanci)
            ->getJson("/api/messages/conversations/{$this->sohbet->id}");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı sohbeti gördü');
    }

    public function test_yabanci_sohbete_mesaj_yazamiyor(): void
    {
        // Yazabilmek okumaktan daha ağır: saldırgan kendini doktor gibi
        // gösterip hastaya talimat verebilirdi.
        $yanit = $this->olarak($this->yabanci)
            ->postJson("/api/messages/conversations/{$this->sohbet->id}/messages", [
                'body' => 'İlacınızı bırakın',
            ]);

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı sohbete yazdı');
        $this->assertDatabaseMissing('messages', ['body' => 'İlacınızı bırakın']);
    }

    public function test_yabanci_baskasinin_mesajini_degistiremiyor(): void
    {
        $yanit = $this->olarak($this->yabanci)
            ->putJson("/api/messages/{$this->mesaj->id}", ['body' => 'DEĞİŞTİRİLDİ']);

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı mesajı değiştirdi');
        $this->assertSame(
            'Sabahları göğsümde baskı hissediyorum',
            $this->mesaj->fresh()->body,
            'mesaj gövdesi değişti',
        );
    }

    public function test_yabanci_baskasinin_mesajini_silemiyor(): void
    {
        $yanit = $this->olarak($this->yabanci)
            ->deleteJson("/api/messages/{$this->mesaj->id}");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı mesajı sildi');
        $this->assertTrue((bool) $this->mesaj->fresh()->is_active, 'mesaj pasife çekildi');
    }

    public function test_yabanci_sohbeti_silemiyor(): void
    {
        $yanit = $this->olarak($this->yabanci)
            ->deleteJson("/api/messages/conversations/{$this->sohbet->id}");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı sohbeti sildi');
        $this->assertTrue((bool) $this->sohbet->fresh()->is_active, 'sohbet pasife çekildi');
    }

    public function test_yabanci_okundu_isaretleyemiyor(): void
    {
        // Zararsız görünür ama karşı tarafa "mesajın okundu" bilgisi verir:
        // yazışmanın varlığını ve hareketini sızdırır.
        $yanit = $this->olarak($this->yabanci)
            ->postJson("/api/messages/conversations/{$this->sohbet->id}/read");

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı okundu işaretledi');
    }

    // ── Listeleme ve arama başkasının yazışmasını sızdırmıyor ──

    public function test_sohbet_listesi_yalnizca_kendi_yazismalarini_veriyor(): void
    {
        $yanit = $this->olarak($this->yabanci)->getJson('/api/messages/conversations');

        $yanit->assertOk();
        $this->assertStringNotContainsString(
            $this->sohbet->id,
            $yanit->getContent(),
            'sohbet listesi yabancıya başkasının yazışmasını gösterdi',
        );
    }

    public function test_arama_baskasinin_mesajini_bulmuyor(): void
    {
        // Arama ve okunmamış sayacı, sohbet uçlarından FARKLI bir kapsam
        // kullanıyor (forUser() değil, doğrudan katılımcı sorgusu). O yüzden
        // ayrıca sınanıyorlar — biri kırılırken öbürü ayakta kalabilir.
        //
        // Önce pozitif kontrol: aramanın gerçekten çalıştığını görmeden
        // "yabancı bulamadı" sonucu hiçbir şey kanıtlamaz.
        $katilimci = $this->olarak($this->doktor)
            ->getJson('/api/messages/search?q=göğsümde')->assertOk();

        $this->assertContains(
            $this->mesaj->body,
            $this->govdeleriTopla($katilimci->json()),
            'arama katılımcının kendi mesajını bile bulamıyor',
        );

        $yabanci = $this->olarak($this->yabanci)
            ->getJson('/api/messages/search?q=göğsümde')->assertOk();

        $this->assertNotContains(
            $this->mesaj->body,
            $this->govdeleriTopla($yabanci->json()),
            'arama yabancıya başkasının mesajını verdi',
        );
    }

    private function okunmamisSayisi(User $user): int
    {
        $govde = $this->olarak($user)->getJson('/api/messages/unread-count')
            ->assertOk()
            ->json();

        return (int) ($govde['count'] ?? $govde['unread_count'] ?? $govde['data']['count'] ?? 0);
    }

    public function test_okunmamis_sayisi_baskasinin_mesajini_saymiyor(): void
    {
        // Pozitif kontrol: hastanın mesajı doktorun sayacına düşmeli. Düşmezse
        // sayaç zaten hep sıfırdır ve yabancı için sıfır görmek bir şey demez.
        $this->assertSame(1, $this->okunmamisSayisi($this->doktor), 'sayaç katılımcı için de sıfır');

        $this->assertSame(0, $this->okunmamisSayisi($this->yabanci), 'okunmamış sayacı başkasının mesajını saydı');
    }
}
