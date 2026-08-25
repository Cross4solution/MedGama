<?php

namespace Tests\Feature;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Sohbet ekleri herkese açık diske YAZILMAMALI.
 *
 * Canlı sohbet sistemi (`ChatService` / `/api/chat/*`) eklerini `public`
 * diskine koyuyordu ve dönen adres `/storage/chat/attachments/...` idi. Üretimde
 * bu adresi nginx doğrudan servis ediyor: `try_files $uri` + entrypoint'in
 * kurduğu `public/storage` bağı. Yani dosya
 *
 *   • kimlik doğrulaması olmadan,
 *   • süresi dolmadan,
 *   • konuşmanın katılımcısı olup olmadığına bakılmadan
 *
 * indirilebiliyordu. Adres iki UUID taşıdığı için tahmin edilemezdi, ama
 * tahmin bu tehdidin yolu değil: adres tarayıcı geçmişinden, ekran
 * görüntüsünden, iletilen bir bağlantıdan sızar ve sızdıktan sonra süresiz
 * geçerli kalır. Konuşmadan çıkarılan biri de erişimini korur.
 *
 * Sohbete tahlil sonucu, reçete ve yara fotoğrafı geliyor.
 *
 * Proje doğru mekanizmayı `MessageAttachment` için ZATEN kurmuştu:
 * private+şifreli disk, kısa süreli imzalı bağlantı. Canlı sohbet sistemi
 * ondan yararlanmıyordu; bu ölçüt artık yararlandığını kilitliyor.
 */
class SohbetEkiGizliligiTest extends TestCase
{
    use RefreshDatabase;

    private User $hekim;
    private User $hasta;
    private ChatConversation $konusma;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $this->hasta = User::factory()->patient()->create();

        $this->konusma = ChatConversation::factory()->create([
            'user_one_id' => $this->hekim->id,
            'user_two_id' => $this->hasta->id,
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function ekGonder(UploadedFile $dosya): array
    {
        $yanit = $this->olarak($this->hekim)
            ->postJson("/api/chat/conversations/{$this->konusma->id}/messages", [
                'content'    => 'Tahlil sonucu ektedir.',
                'attachment' => $dosya,
            ])
            ->assertStatus(201);

        return $yanit->json('data') ?? $yanit->json();
    }

    public function test_ek_herkese_acik_diske_yazilmiyor(): void
    {
        $onceki = Storage::disk('public')->allFiles();

        $this->ekGonder(UploadedFile::fake()->create('tahlil.pdf', 12, 'application/pdf'));

        $this->assertSame(
            $onceki,
            Storage::disk('public')->allFiles(),
            'sohbet eki herkese açık diske yazıldı: adres kimliksiz indirilebilir',
        );
    }

    public function test_gorsel_ek_de_herkese_acik_diske_yazilmiyor(): void
    {
        // Görsel dalı ayrı kod yolu: GD ile yeniden boyutlanıp WebP'ye
        // çevriliyordu ve doğrudan `Storage::disk('public')->path()` ile
        // yazılıyordu — şifreleme katmanını tümüyle atlayarak.
        $onceki = Storage::disk('public')->allFiles();

        $this->ekGonder(UploadedFile::fake()->image('yara.jpg', 40, 40));

        $this->assertSame(
            $onceki,
            Storage::disk('public')->allFiles(),
            'görsel sohbet eki herkese açık diske yazıldı',
        );
    }

    public function test_donen_adres_kalici_storage_adresi_degil(): void
    {
        $mesaj = $this->ekGonder(UploadedFile::fake()->create('recete.pdf', 8, 'application/pdf'));

        $adres = (string) ($mesaj['attachment_url'] ?? '');

        $this->assertNotSame('', $adres, 'ek adresi dönmedi');
        $this->assertStringNotContainsString(
            '/storage/',
            $adres,
            'kalıcı herkese açık adres dönüyor',
        );
        $this->assertStringContainsString(
            'signature=',
            $adres,
            'ek adresi imzalı değil: süresiz ve denetimsiz kalır',
        );
    }

    public function test_imzasiz_istek_dosyayi_vermiyor(): void
    {
        $mesaj = $this->ekGonder(UploadedFile::fake()->create('epikriz.pdf', 8, 'application/pdf'));

        $kimlik = ChatMessage::where('conversation_id', $this->konusma->id)
            ->whereNotNull('attachment_url')
            ->latest('created_at')
            ->first()
            ->id;

        // İmzayı atıp doğrudan uca gitmek çalışmamalı.
        $this->get("/api/chat/attachments/{$kimlik}/file")->assertStatus(403);

        // Bozulmuş imza da geçmemeli.
        $adres = (string) $mesaj['attachment_url'];
        $this->get(preg_replace('/signature=[a-f0-9]+/', 'signature=' . str_repeat('0', 64), $adres))
            ->assertStatus(403);
    }

    public function test_imzali_adres_dosyayi_veriyor(): void
    {
        // Aşırı kilitleyip özelliği bozmadığımızın kanıtı.
        $mesaj = $this->ekGonder(UploadedFile::fake()->create('sonuc.pdf', 8, 'application/pdf'));

        $yanit = $this->get((string) $mesaj['attachment_url'])->assertOk();

        // Laravel başlığı genişletiyor ('must-revalidate, no-cache, ...'), bu
        // yüzden tam eşitlik değil İKİ YÖNERGENİN varlığı ölçülüyor: dosya
        // ara belleklerde kalmamalı.
        $onbellek = $yanit->headers->get('Cache-Control');

        $this->assertStringContainsString('no-store', $onbellek);
        $this->assertStringContainsString('private', $onbellek);
    }
}
