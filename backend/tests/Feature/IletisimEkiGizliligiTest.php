<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * İletişim mesajı ekleri de herkese açık diske yazılmamalı.
 *
 * Sohbet ekleriyle (bkz. SohbetEkiGizliligiTest) birebir aynı sınıf, bir
 * tuhaflık fazlasıyla: YETKİLİ İNDİRME UCU ZATEN VARDI
 * (`/contact-messages/{id}/download/{attachmentId}`, `auth:sanctum` arkasında)
 * ama arayüz ondan geçmiyordu. `formatMessage` eki `/storage/<yol>` olarak
 * döndürüyor, ekran da onu doğrudan `<img src>` ve "indir" bağlantısı yapıyordu.
 * Yani güvenli yol yazılmış, döşenmiş ve kullanılmamıştı.
 *
 * Bu ekleri hasta gönderiyor: bir sağlık sorusuna iliştirilmiş rapor ya da
 * fotoğraf olabiliyor. Herkese açık diskteki adres kimliksiz, süresiz ve
 * denetimsizdi.
 */
class IletisimEkiGizliligiTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $hekim;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create();
        $this->hekim = User::factory()->doctor()->create(['is_verified' => true]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function mesajGonder(UploadedFile $dosya): array
    {
        $yanit = $this->olarak($this->hasta)
            ->postJson('/api/contact-messages', [
                'receiver_id'   => $this->hekim->id,
                'receiver_type' => 'doctor',
                'subject'       => 'Tahlil sorusu',
                'body'          => 'Ekteki sonucu değerlendirebilir misiniz?',
                'attachments'   => [$dosya],
            ])
            ->assertStatus(201);

        return $yanit->json('data');
    }

    public function test_ek_herkese_acik_diske_yazilmiyor(): void
    {
        $onceki = Storage::disk('public')->allFiles();

        $this->mesajGonder(UploadedFile::fake()->create('tahlil.pdf', 10, 'application/pdf'));

        $this->assertSame(
            $onceki,
            Storage::disk('public')->allFiles(),
            'iletişim eki herkese açık diske yazıldı: adres kimliksiz indirilebilir',
        );
    }

    public function test_donen_adres_kalici_storage_adresi_degil(): void
    {
        $mesaj = $this->mesajGonder(UploadedFile::fake()->image('rapor.jpg', 30, 30));

        $adres = (string) ($mesaj['attachments'][0]['file_path'] ?? '');

        $this->assertNotSame('', $adres, 'ek adresi dönmedi');
        $this->assertStringNotContainsString('/storage/', $adres, 'kalıcı herkese açık adres dönüyor');
        $this->assertStringContainsString('signature=', $adres, 'ek adresi imzalı değil');
    }

    public function test_imzasiz_ve_bozuk_imzali_istek_reddediliyor(): void
    {
        $mesaj = $this->mesajGonder(UploadedFile::fake()->create('epikriz.pdf', 8, 'application/pdf'));
        $adres = (string) $mesaj['attachments'][0]['file_path'];

        $this->get(strtok($adres, '?'))->assertStatus(403);

        $this->get(preg_replace('/signature=[a-f0-9]+/', 'signature=' . str_repeat('0', 64), $adres))
            ->assertStatus(403);
    }

    public function test_imzali_adres_dosyayi_veriyor(): void
    {
        // Aşırı kilitleyip özelliği bozmadığımızın kanıtı.
        $mesaj = $this->mesajGonder(UploadedFile::fake()->create('sonuc.pdf', 8, 'application/pdf'));

        $yanit = $this->get((string) $mesaj['attachments'][0]['file_path'])->assertOk();

        $onbellek = (string) $yanit->headers->get('Cache-Control');

        $this->assertStringContainsString('no-store', $onbellek);
        $this->assertStringContainsString('private', $onbellek);
    }

    public function test_yetkili_indirme_ucu_calismaya_devam_ediyor(): void
    {
        // Uç zaten vardı ve kullanılmıyordu; dosyalar özel diske taşınınca
        // KIRILMAMIŞ olmalı — yoksa güvenli yol da çalışmaz hale gelirdi.
        $mesaj = $this->mesajGonder(UploadedFile::fake()->create('sonuc.pdf', 8, 'application/pdf'));
        $ekId = $mesaj['attachments'][0]['id'];

        $this->olarak($this->hekim)
            ->get("/api/contact-messages/{$mesaj['id']}/download/{$ekId}")
            ->assertOk();
    }

    public function test_elenen_dosya_sessizce_yutulmuyor(): void
    {
        // Tür listesinde olmayan dosya `continue` ile atılıyor ve istek 201
        // dönüyordu: gönderen raporunu ilettiğini sanıyor, alıcı ekte hiçbir
        // şey görmüyor, ortada hata da yok. Aynı sınıf: başarısızlık başarı
        // gibi sunuluyor.
        $yanit = $this->olarak($this->hasta)
            ->postJson('/api/contact-messages', [
                'receiver_id'   => $this->hekim->id,
                'receiver_type' => 'doctor',
                'body'          => 'Ekteki dosyaya bakabilir misiniz?',
                'attachments'   => [UploadedFile::fake()->create('kayit.exe', 4, 'application/x-msdownload')],
            ])
            ->assertStatus(201);

        $this->assertSame([], $yanit->json('data.attachments'), 'yasaklı tür kabul edilmiş');

        $elenen = $yanit->json('rejected_attachments');

        $this->assertCount(1, $elenen, 'elenen dosya bildirilmiyor: gönderen ekin gitmediğini bilmiyor');
        $this->assertSame('kayit.exe', $elenen[0]['file_name']);
    }

    public function test_kabul_edilen_dosyada_elenen_listesi_bos(): void
    {
        $yanit = $this->olarak($this->hasta)
            ->postJson('/api/contact-messages', [
                'receiver_id'   => $this->hekim->id,
                'receiver_type' => 'doctor',
                'body'          => 'Tahlil ektedir.',
                'attachments'   => [UploadedFile::fake()->create('tahlil.pdf', 8, 'application/pdf')],
            ])
            ->assertStatus(201);

        $this->assertSame([], $yanit->json('rejected_attachments'));
        $this->assertCount(1, $yanit->json('data.attachments'));
    }

    public function test_ilgisiz_kullanici_yetkili_uctan_indiremiyor(): void
    {
        $mesaj = $this->mesajGonder(UploadedFile::fake()->create('sonuc.pdf', 8, 'application/pdf'));
        $ekId = $mesaj['attachments'][0]['id'];

        $yabanci = User::factory()->doctor()->create(['is_verified' => true]);

        $yanit = $this->olarak($yabanci)
            ->get("/api/contact-messages/{$mesaj['id']}/download/{$ekId}");

        $this->assertContains(
            $yanit->status(),
            [403, 404],
            'mesajla ilgisi olmayan kullanıcı eki indirebiliyor',
        );
    }
}
