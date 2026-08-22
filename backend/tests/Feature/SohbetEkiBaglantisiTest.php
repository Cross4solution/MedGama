<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Services\EncryptedFileStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Sohbet ekleri — tahlil sonucu, rapor, röntgen. Bağlantı korumanın TAMAMI.
 *
 * Uç bilinçli olarak `signed` ara katmanıyla açık: <img src> Authorization
 * başlığı gönderemiyor, o yüzden dosya jetonla değil imzalı bağlantıyla
 * servis ediliyor. Bunun bedeli, denetleyicide sahiplik denetiminin HİÇ
 * OLMAMASI — geçerli imza tek kapı.
 *
 * Dolayısıyla iki şey kanıtlanmak zorunda: imza gerçekten zorunlu, ve
 * bağlantı gerçekten SÜRELİ. `signedRoute` ile `temporarySignedRoute`
 * arasındaki tek kelimelik fark, sağlık belgesini sonsuza dek açık bırakan
 * fark demek — ve kod okunarak ayırt edilmesi kolay kaçırılır.
 */
class SohbetEkiBaglantisiTest extends TestCase
{
    use RefreshDatabase;

    private MessageAttachment $ek;

    protected function setUp(): void
    {
        parent::setUp();

        $hasta = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create();

        $sohbet = Conversation::create(['type' => 'direct', 'is_active' => true]);
        foreach ([$hasta, $doktor] as $k) {
            ConversationParticipant::create([
                'conversation_id' => $sohbet->id,
                'user_id'         => $k->id,
                'role'            => 'member',
                'is_active'       => true,
            ]);
        }

        $mesaj = Message::create([
            'conversation_id' => $sohbet->id,
            'sender_id'       => $hasta->id,
            'body'            => null,
            'type'            => 'file',
            'is_active'       => true,
        ]);

        // Gerçek şifreli diske yaz: uç dosyayı oradan okuyor, sahte yol 404 verir
        // ve test korumayı değil eksik dosyayı ölçmüş olur.
        $yol = app(EncryptedFileStorage::class)
            ->putContents('sohbet-ekleri/tahlil.pdf', 'GIZLI TAHLIL SONUCU');

        $this->ek = MessageAttachment::create([
            'message_id' => $mesaj->id,
            'file_name'  => 'tahlil.pdf',
            'file_path'  => $yol,
            'file_type'  => 'application/pdf',
            'file_size'  => 19,
            'is_active'  => true,
        ]);
    }

    public function test_gecerli_imzali_baglanti_dosyayi_veriyor(): void
    {
        // Pozitif kontrol: aşağıdaki ret testleri, uç zaten hep 403 verdiği
        // için değil, İMZA denetimi çalıştığı için geçmeli.
        $yanit = $this->get($this->ek->url);

        $yanit->assertOk();
        // Dosya şifreli diskte duruyor: çözülmüş halde gelmeli, yoksa uç
        // çalışıyor görünüp kullanıcıya bozuk içerik verir.
        $this->assertSame('GIZLI TAHLIL SONUCU', $yanit->getContent());
    }

    public function test_imzasiz_istek_reddediliyor(): void
    {
        // Ek kimliği tahmin edilebilir olmasa da sızabilir: kayıtlar, tarayıcı
        // geçmişi, yönlendiren başlığı. İmzasız erişim kapalı olmalı.
        $this->get("/api/messages/attachments/{$this->ek->id}/file")
            ->assertStatus(403);
    }

    public function test_imzasi_bozulmus_baglanti_reddediliyor(): void
    {
        $bozuk = preg_replace('/signature=[0-9a-f]+/', 'signature=' . str_repeat('0', 64), $this->ek->url);

        $this->assertNotSame($this->ek->url, $bozuk, 'imza parametresi bulunamadı, test bir şey ölçmedi');
        $this->get($bozuk)->assertStatus(403);
    }

    public function test_suresi_dolmus_baglanti_reddediliyor(): void
    {
        // ASIL RİSK BURADA. `signedRoute` (süresiz) ile `temporarySignedRoute`
        // arasındaki fark gözle ayırt edilemiyor; süresiz olsaydı bir kez
        // paylaşılan tahlil sonucu sonsuza dek açık kalırdı.
        $baglanti = $this->ek->url;

        $this->travel(31)->minutes();

        $this->get($baglanti)->assertStatus(403);
    }

    public function test_baglanti_suresi_dolmadan_gecerli_kaliyor(): void
    {
        // Ters uç: süre çok kısa olsaydı sohbetteki görseller kullanıcının
        // gözü önünde bozulurdu.
        $baglanti = $this->ek->url;

        $this->travel(29)->minutes();

        $this->get($baglanti)->assertOk();
    }

    public function test_baska_ek_icin_uretilmis_imza_kullanilamiyor(): void
    {
        // İmza kaynağa bağlı olmalı; olmasaydı kendi ekine aldığı geçerli
        // bağlantıyla başkasının dosyası çekilebilirdi.
        $baskaEk = MessageAttachment::create([
            'message_id' => $this->ek->message_id,
            'file_name'  => 'baska.pdf',
            'file_path'  => app(EncryptedFileStorage::class)->putContents('sohbet-ekleri/baska.pdf', 'DIGER'),
            'file_type'  => 'application/pdf',
            'file_size'  => 5,
            'is_active'  => true,
        ]);

        $imzaliBaskasi = $baskaEk->url;
        $takas = str_replace($baskaEk->id, $this->ek->id, $imzaliBaskasi);

        $this->assertNotSame($imzaliBaskasi, $takas, 'kimlik takası yapılamadı, test bir şey ölçmedi');
        $this->get($takas)->assertStatus(403);
    }

    public function test_pasife_alinan_ek_gecerli_imzayla_bile_verilmiyor(): void
    {
        // Kullanıcı eki sildiğinde önceden dağıtılmış bağlantı ölmeli.
        $baglanti = $this->ek->url;
        $this->ek->update(['is_active' => false]);

        $this->get($baglanti)->assertStatus(404);
    }

    public function test_uretilen_baglanti_suresiz_degil(): void
    {
        // Doğrudan ölçüm: imzalı bağlantıda son kullanma parametresi var mı.
        // Yukarıdaki süre testi zaman yolculuğuna dayanıyor; bu ise
        // `signedRoute`'a geri dönüşü tek bakışta yakalar.
        $this->assertStringContainsString(
            'expires=',
            $this->ek->url,
            'bağlantı süresiz üretilmiş — temporarySignedRoute yerine signedRoute kullanılmış',
        );
    }

    public function test_dosya_onbelleklenmiyor(): void
    {
        // Sağlık belgesi ara sunucuda ya da tarayıcı diskinde kalmamalı.
        // Tam dizge karşılaştırılmıyor: Laravel başlığı normalleştirip
        // `must-revalidate, no-cache` de ekliyor. Ölçüt, saklamayı yasaklayan
        // yönergelerin bulunması.
        $baslik = $this->get($this->ek->url)->assertOk()
            ->headers->get('Cache-Control');

        $this->assertStringContainsString('no-store', $baslik, 'dosya saklanabilir işaretlendi');
        $this->assertStringContainsString('private', $baslik, 'dosya ara sunucuda saklanabilir');
    }

    public function test_dosya_indirmeye_zorlanmadan_gomulu_gosteriliyor(): void
    {
        $yanit = $this->get($this->ek->url)->assertOk();

        $this->assertStringStartsWith('inline', $yanit->headers->get('Content-Disposition'));
    }

    protected function tearDown(): void
    {
        URL::forceRootUrl('');
        parent::tearDown();
    }
}
