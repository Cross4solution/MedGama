<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * İletişim kutusuna yazılan metin şifreli saklanmalı.
 *
 * Hasta kliniğe "üç gündür göğsümde ağrı var, tahlilimi ekledim" yazdığında o
 * cümle sağlık verisi oluyor — KVKK md. 6 anlamında özel nitelikli, GDPR md. 9
 * kapsamında. Ekler zaten şifreli diske taşınmıştı; tahlili şifreleyip onu
 * anlatan cümleyi düz metin bırakmak savunması zor bir tutarsızlıktı.
 *
 * Bedeli açıkça kabul edildi: gelen kutusunda mesaj İÇİNDE kelime araması
 * artık yapılamıyor. Şifreli sütunda alt dize eşleşmez, ve sorguda bırakmak
 * "arama bozuldu" değil "sonuç yok" gibi görünürdü. Arama konu başlığı
 * üzerinden sürüyor; `subject` bilerek düz metin — `varchar(255)` ve şifreli
 * değer taşardı.
 */
class IletisimMesajiSifrelemeTest extends TestCase
{
    use RefreshDatabase;

    private function mesaj(string $govde = 'Üç gündür göğsümde ağrı var.'): ContactMessage
    {
        return ContactMessage::create([
            'sender_id'     => User::factory()->patient()->create()->id,
            'receiver_id'   => User::factory()->create(['role_id' => 'doctor'])->id,
            'receiver_type' => 'doctor',
            'subject'       => 'Tahlil sorusu',
            'body'          => $govde,
        ]);
    }

    public function test_govde_veritabaninda_okunamiyor(): void
    {
        $mesaj = $this->mesaj();

        // Ham sütun: modelden değil, doğrudan sürücüden okunuyor.
        $ham = DB::table('contact_messages')->where('id', $mesaj->id)->value('body');

        $this->assertStringNotContainsString(
            'göğsümde',
            (string) $ham,
            'hasta şikayeti veritabanında düz metin duruyor',
        );
    }

    public function test_uygulama_govdeyi_dogru_okuyor(): void
    {
        $mesaj = $this->mesaj();

        $this->assertSame('Üç gündür göğsümde ağrı var.', $mesaj->fresh()->body);
    }

    public function test_konu_basligi_aranabilir_kaliyor(): void
    {
        // Şifreleme aramanın TAMAMINI öldürmemeli; konu üzerinden çalışıyor.
        $mesaj = $this->mesaj();
        $alici = User::find($mesaj->receiver_id);

        $yanit = $this->actingAs($alici, 'sanctum')
            ->getJson('/api/contact-messages/inbox?search=Tahlil')
            ->assertOk()
            ->json();

        $this->assertStringContainsString($mesaj->id, json_encode($yanit));
    }

    public function test_hesap_silme_govdeyi_okunamaz_birakmiyor(): void
    {
        /*
         * Silme gövdeyi boşaltıyor. Sorgu kurucusuyla yazmak şifrelemeyi
         * ATLAR ve satır bir daha çözülemez — aynı tuzağa sohbet
         * mesajlarında düşülmüştü. Model üzerinden yazılıyor.
         */
        $mesaj = $this->mesaj();
        $gonderen = User::find($mesaj->sender_id);

        app(AuthService::class)->deleteAccount($gonderen->fresh());

        $taze = ContactMessage::find($mesaj->id);

        $this->assertNotNull($taze, 'satır kaldırılmamalı');
        $this->assertSame('', (string) $taze->body, 'gövde temizlenmemiş ya da okunamıyor');
    }

    // ── Var olan düz metin satırlar ────────────────────────────────────

    public function test_goc_eski_duz_metni_sifreliyor(): void
    {
        $mesaj = $this->mesaj();

        // Cast'i atlayarak DÜZ metin yaz: göçten önceki hâl.
        DB::table('contact_messages')->where('id', $mesaj->id)->update(['body' => 'ESKI DUZ METIN']);

        $this->gocuCalistir();

        $ham = DB::table('contact_messages')->where('id', $mesaj->id)->value('body');
        $this->assertStringNotContainsString('ESKI DUZ METIN', (string) $ham);
        $this->assertSame('ESKI DUZ METIN', ContactMessage::find($mesaj->id)->body);
    }

    public function test_goc_ikinci_kez_calisinca_bozmuyor(): void
    {
        /*
         * Zaten şifreli bir değeri yeniden şifrelemek onu çift sarmalar:
         * okunduğunda düz metin yerine şifreli metin döner. Sessiz ve geri
         * dönüşü zor bir bozulma — göç bu yüzden her satırı önce sınıyor.
         */
        $mesaj = $this->mesaj('Tekrar denemesi');

        $this->gocuCalistir();
        $this->gocuCalistir();

        $this->assertSame('Tekrar denemesi', ContactMessage::find($mesaj->id)->body);
    }

    public function test_bos_govde_goce_takilmiyor(): void
    {
        $mesaj = $this->mesaj();
        DB::table('contact_messages')->where('id', $mesaj->id)->update(['body' => '']);

        $this->gocuCalistir();

        $this->assertSame('', (string) ContactMessage::find($mesaj->id)->body);
    }

    private function gocuCalistir(): void
    {
        $yol = database_path('migrations/2026_08_27_110000_iletisim_mesaji_govdesini_sifrele.php');
        (require $yol)->up();
    }
}
