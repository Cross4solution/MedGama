<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\ContactMessageAttachment;
use App\Models\User;
use App\Services\EncryptedFileStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * İletişim eki bağlantısı her zaman imzalı ve süreli olmalı.
 *
 * Eski ekler herkese açık diskte duruyordu ve kutu bunların bağlantısını
 * `/storage/contact-messages/...` diye veriyordu: oturum yok, imza yok, süre
 * yok. İletişim kutusuna hasta yazıyor ve rapor, reçete, tetkik sonucu
 * ekliyor. O adres bir kez sızdığında — tarayıcı geçmişi, ekran görüntüsü,
 * kopyalanmış bağlantı — kalıcı olarak açık kalıyordu.
 *
 * Bağlantı üretimi artık ayrım yapmıyor; her ek 30 dakikalık imzalı uçtan
 * geçiyor. Uç dosyayı EncryptedFileStorage ile okuyor, o da özel diskte
 * bulamazsa herkese açık diske ve şifresiz eski biçime düşüyor — geçmiş
 * kutular kırılmıyor.
 *
 * Dosyanın kendisi eski adreste kaldığı sürece adresi bilen erişmeye devam
 * eder; `php artisan ekler:tasi` onları şifreli özel diske taşıyor.
 */
class IletisimEkiImzaliBaglantiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Sahte disk şart: ölçüt hem herkese açık hem özel diske yazıyor ve
        // `ekler:tasi` komutunu gerçekten çalıştırıyor. Sahtelemeden geliştirme
        // makinesindeki gerçek ekleri taşır ve her koşuda arkasında dosya
        // bırakır.
        Storage::fake('public');
        Storage::fake('local');
    }

    private function ekliMesaj(bool $eskiBicim): array
    {
        $gonderen = User::factory()->create(['role_id' => 'patient']);
        $alici    = User::factory()->create(['role_id' => 'doctor']);

        $mesaj = ContactMessage::create([
            'sender_id'     => $gonderen->id,
            'receiver_id'   => $alici->id,
            'receiver_type' => 'doctor',
            'subject'       => 'Tetkik sonucu',
            'body'          => 'Ekteki raporu iletiyorum.',
        ]);

        $yol = 'contact-messages/' . $mesaj->id . '/rapor.bin';

        if ($eskiBicim) {
            // Şifresiz, herkese açık diskte — taşınmamış eski kayıt.
            Storage::disk('public')->put($yol, 'ESKI-RAPOR-ICERIGI');
        } else {
            app(EncryptedFileStorage::class)->putContents($yol, 'YENI-RAPOR-ICERIGI');
        }

        $ek = ContactMessageAttachment::create([
            'contact_message_id' => $mesaj->id,
            'file_path'          => $yol,
            'file_name'          => 'rapor.pdf',
            'mime_type'          => 'application/pdf',
            'file_size'          => 18,
        ]);

        return [$gonderen, $alici, $mesaj, $ek];
    }

    private function baglanti(User $kullanici, ContactMessage $mesaj): string
    {
        $yanit = $this->actingAs($kullanici, 'sanctum')
            ->getJson("/api/contact-messages/{$mesaj->id}")
            ->assertOk()
            ->json();

        $ham = json_encode($yanit, JSON_UNESCAPED_SLASHES);
        $this->assertMatchesRegularExpression('#https?://[^"]+attachment/[^"]+#', $ham, 'ek bağlantısı yanıtta yok');
        preg_match('#(https?://[^"]+attachment/[^"]+)#', $ham, $m);

        return $m[1];
    }

    public function test_eski_ek_de_imzali_baglanti_aliyor(): void
    {
        [$gonderen, , $mesaj] = $this->ekliMesaj(eskiBicim: true);

        $baglanti = $this->baglanti($gonderen, $mesaj);

        $this->assertStringNotContainsString(
            '/storage/',
            $baglanti,
            'eski ek hâlâ herkese açık /storage adresinden veriliyor',
        );
        $this->assertStringContainsString('signature=', $baglanti);
        $this->assertStringContainsString('expires=', $baglanti);
    }

    public function test_eski_ek_imzali_uctan_okunabiliyor(): void
    {
        // Kapatma geçmiş kutuları kırmamalı: şifresiz eski dosya da açılmalı.
        [$gonderen, , $mesaj] = $this->ekliMesaj(eskiBicim: true);

        $this->get($this->baglanti($gonderen, $mesaj))
            ->assertOk()
            ->assertSee('ESKI-RAPOR-ICERIGI');
    }

    public function test_yeni_sifreli_ek_okunabiliyor(): void
    {
        [$gonderen, , $mesaj] = $this->ekliMesaj(eskiBicim: false);

        $this->get($this->baglanti($gonderen, $mesaj))
            ->assertOk()
            ->assertSee('YENI-RAPOR-ICERIGI');
    }

    public function test_imzasiz_istek_reddediliyor(): void
    {
        [, , $mesaj, $ek] = $this->ekliMesaj(eskiBicim: true);

        $this->get("/api/contact-messages/{$mesaj->id}/attachment/{$ek->id}")
            ->assertStatus(403);
    }

    public function test_bozulmus_imza_reddediliyor(): void
    {
        [$gonderen, , $mesaj] = $this->ekliMesaj(eskiBicim: true);
        $baglanti = $this->baglanti($gonderen, $mesaj);

        $this->get(preg_replace('/signature=./', 'signature=0', $baglanti, 1))
            ->assertStatus(403);
    }

    public function test_tasima_komutu_dosyayi_acik_diskten_kaldiriyor(): void
    {
        [$gonderen, , $mesaj, $ek] = $this->ekliMesaj(eskiBicim: true);

        $this->assertTrue(Storage::disk('public')->exists($ek->file_path));

        $this->artisan('ekler:tasi')->assertSuccessful();

        $this->assertFalse(
            Storage::disk('public')->exists($ek->file_path),
            'dosya hâlâ herkese açık diskte — eski adresi bilen erişmeye devam eder',
        );

        // Ve içerik kaybolmamalı.
        $this->get($this->baglanti($gonderen, $mesaj))
            ->assertOk()
            ->assertSee('ESKI-RAPOR-ICERIGI');
    }

    public function test_tasima_komutu_kuru_calismada_dokunmuyor(): void
    {
        [, , , $ek] = $this->ekliMesaj(eskiBicim: true);

        $this->artisan('ekler:tasi --kuru-calisma')->assertSuccessful();

        $this->assertTrue(Storage::disk('public')->exists($ek->file_path));
    }
}
