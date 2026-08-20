<?php

namespace Tests\Feature;

use App\Models\ChatConversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Güvenlik sertleştirmeleri.
 *
 * Denetimde bulunan açıkların kapalı kaldığını sabitler. Buradaki her test
 * bir REDDİ doğruluyor — doğru cevabın "hayır" olduğu durumlar.
 */
class GuvenlikSertlestirmeTest extends TestCase
{
    use RefreshDatabase;

    private function sohbetKur(): array
    {
        $hasta  = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create();

        $sohbet = ChatConversation::factory()->create([
            'user_one_id' => $hasta->id,
            'user_two_id' => $doktor->id,
        ]);

        return [$hasta, $sohbet];
    }

    public function test_sohbete_calistirilabilir_dosya_eklenemiyor(): void
    {
        [$hasta, $sohbet] = $this->sohbetKur();

        // İçeriği PHP olan bir dosya: uzantı ne olursa olsun reddedilmeli.
        $dosya = UploadedFile::fake()->createWithContent('fatura.php', '<?php system($_GET["c"]); ?>');

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->postJson("/api/messages/conversations/{$sohbet->id}/messages", [
                'body'        => 'ek',
                'attachments' => [$dosya],
            ]);

        $this->assertSame(422, $yanit->getStatusCode(), 'Çalıştırılabilir dosya kabul edildi.');
    }

    public function test_sohbete_svg_eklenemiyor(): void
    {
        [$hasta, $sohbet] = $this->sohbetKur();

        // SVG betik taşıyabilir; görsel gibi görünüp XSS aracı olur.
        $svg = UploadedFile::fake()->createWithContent(
            'resim.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        );

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->postJson("/api/messages/conversations/{$sohbet->id}/messages", [
                'body'        => 'ek',
                'attachments' => [$svg],
            ]);

        $this->assertSame(422, $yanit->getStatusCode(), 'SVG kabul edildi.');
    }

    public function test_sohbete_pdf_eklenebiliyor(): void
    {
        [$hasta, $sohbet] = $this->sohbetKur();

        // Kısıt fazla geniş olmamalı: meşru tıbbi belge geçmeli.
        $pdf = UploadedFile::fake()->create('tahlil.pdf', 120, 'application/pdf');

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->postJson("/api/messages/conversations/{$sohbet->id}/messages", [
                'body'        => 'tahlil sonucum',
                'attachments' => [$pdf],
            ]);

        $this->assertNotSame(422, $yanit->getStatusCode(), 'Meşru PDF reddedildi.');
    }

    public function test_uretimde_api_dokumantasyonu_kapali(): void
    {
        // Dokümantasyon tüm uçların haritasıdır; saldırının ilk adımı keşiftir.
        app()['env'] = 'production';
        $this->app->detectEnvironment(fn () => 'production');

        $this->assertTrue(
            app()->environment('production'),
            'Ortam üretime çevrilemedi, test anlamsız.',
        );

        $this->get('/api/documentation')->assertNotFound();
    }

    public function test_yerelde_dokumantasyon_acik_kaliyor(): void
    {
        // Geliştirme için gerekli; sertleştirme onu da kapatmamalı.
        $this->assertFalse(app()->environment('production'));

        $kod = $this->get('/api/documentation')->getStatusCode();
        $this->assertNotSame(404, $kod, 'Dokümantasyon yerelde de kapandı.');
    }
}
