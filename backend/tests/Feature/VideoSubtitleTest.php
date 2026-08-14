<?php

namespace Tests\Feature;

use App\Captions\TranscriptionEngine;
use App\Models\MedStreamPost;
use App\Models\User;
use App\Models\VideoSubtitle;
use App\Services\VideoSubtitleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Gönderi videolarının alt yazıları. Motor yerine sahte bir çevirici
 * bağlanıyor — sınanan şey saklama, çeviri ve düzeltme kuralları.
 */
class VideoSubtitleTest extends TestCase
{
    use RefreshDatabase;

    private User $doctor;
    private MedStreamPost $post;

    protected function setUp(): void
    {
        parent::setUp();

        $this->doctor = User::factory()->doctor()->create();
        $this->post = MedStreamPost::factory()->create(['author_id' => $this->doctor->id]);
    }

    private function servis(): VideoSubtitleService
    {
        return $this->app->make(VideoSubtitleService::class);
    }

    public function test_motor_yokken_alt_yazi_uretilmez_ve_gonderi_etkilenmez(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new \App\Captions\UnavailableEngine());

        $sonuc = $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        $this->assertNull($sonuc);
        $this->assertSame(0, VideoSubtitle::count());
    }

    public function test_video_yaziya_dokulur_ve_saklanir(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new SahteMotor());

        $altyazi = $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        $this->assertSame(VideoSubtitle::HAZIR, $altyazi->status);
        $this->assertSame('tr', $altyazi->language);
        $this->assertCount(2, $altyazi->segments);
        $this->assertStringContainsString('WEBVTT', $altyazi->toVtt());
        $this->assertStringContainsString('00:00:00.000 --> 00:00:02.500', $altyazi->toVtt());
    }

    public function test_baska_dil_istenince_ozgunden_cevrilir_ve_zaman_damgalari_korunur(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new SahteMotor());
        $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        $de = $this->servis()->getir($this->post, 0, 'de');

        $this->assertNotNull($de);
        $this->assertSame('translation', $de->kind);
        $this->assertCount(2, $de->segments);
        // Zaman bilgisi çeviriden etkilenmemeli.
        $this->assertSame(0.0, (float) $de->segments[0]['start']);
        $this->assertSame(2.5, (float) $de->segments[0]['end']);
    }

    public function test_ayni_dil_ikinci_kez_istenince_yeniden_uretilmez(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new SahteMotor());
        $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        $ilk = $this->servis()->getir($this->post, 0, 'de');
        $ikinci = $this->servis()->getir($this->post, 0, 'de');

        $this->assertSame($ilk->id, $ikinci->id);
        $this->assertSame(2, VideoSubtitle::count(), 'Bir özgün + bir çeviri olmalı');
    }

    public function test_duzeltilen_alt_yazi_otomatik_uretimle_bozulmaz(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new SahteMotor());
        $altyazi = $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        $this->servis()->duzelt($altyazi, [
            ['start' => 0, 'end' => 2.5, 'text' => 'Miyokard enfarktüsü'],
        ], $this->doctor);

        // Aynı video yeniden işlenirse düzeltme korunmalı.
        $tekrar = $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        $this->assertTrue($tekrar->edited);
        $this->assertSame('Miyokard enfarktüsü', $tekrar->segments[0]['text']);
    }

    public function test_ozgun_duzeltilince_eski_ceviriler_silinir(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new SahteMotor());
        $altyazi = $this->servis()->uret($this->post, 0, '/tmp/video.mp4');
        $this->servis()->getir($this->post, 0, 'de');

        $this->assertSame(2, VideoSubtitle::count());

        $this->servis()->duzelt($altyazi, [['start' => 0, 'end' => 1, 'text' => 'Düzeltildi']], $this->doctor);

        // Çeviri artık yanlış metne dayanıyor; yeniden üretilmeli.
        $this->assertSame(1, VideoSubtitle::count());
    }

    public function test_baskasi_alt_yaziyi_duzenleyemez(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new SahteMotor());
        $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        Sanctum::actingAs(User::factory()->patient()->create());

        $this->putJson("/api/medstream/posts/{$this->post->id}/subtitles/tr", [
            'segments' => [['start' => 0, 'end' => 1, 'text' => 'değiştirildi']],
        ])->assertStatus(403);
    }

    public function test_alt_yazi_webvtt_olarak_servis_edilir(): void
    {
        $this->app->bind(TranscriptionEngine::class, fn () => new SahteMotor());
        $this->servis()->uret($this->post, 0, '/tmp/video.mp4');

        $this->get("/api/medstream/posts/{$this->post->id}/subtitles/tr")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/vtt; charset=UTF-8')
            ->assertSee('WEBVTT');
    }

    public function test_hazir_olmayan_alt_yazi_404_doner(): void
    {
        $this->get("/api/medstream/posts/{$this->post->id}/subtitles/tr")
            ->assertStatus(404);
    }
}

/** Sahte yazıya dökücü — gerçek ses işleme yok. */
class SahteMotor implements TranscriptionEngine
{
    public function kullanilabilir(): bool
    {
        return true;
    }

    public function oturumAc(string $appointmentId, string $konusmaDili): array
    {
        return ['url' => 'wss://sahte', 'token' => 'x', 'expires_in' => 600];
    }

    public function dosyaCevir(string $dosyaYolu, ?string $dil = null): ?array
    {
        return [
            'language' => 'tr',
            'segments' => [
                ['start' => 0.0, 'end' => 2.5, 'text' => 'Merhaba, ben Dr. Demo.'],
                ['start' => 2.5, 'end' => 5.0, 'text' => 'Bugün kalp sağlığından bahsedeceğiz.'],
            ],
        ];
    }

    public function dosyaCevirisiVarMi(): bool
    {
        return true;
    }

    public function diller(): array
    {
        return ['tr', 'en'];
    }

    public function ad(): string
    {
        return 'sahte';
    }
}
