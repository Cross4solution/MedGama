<?php

namespace Tests\Feature;

use App\Models\Translation;
use App\Models\User;
use App\Services\TranslationService;
use App\Translation\TranslationEngine;
use App\Translation\UnavailableEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * İçerik çevirisi. Motor yerine sahte bir çevirmen bağlanıyor — test edilen
 * şey önbellek ve davranış kuralları, motorun kendisi değil.
 */
class TranslationTest extends TestCase
{
    use RefreshDatabase;

    private function servis(): TranslationService
    {
        return $this->app->make(TranslationService::class);
    }

    private function motorBagla(TranslationEngine $motor): void
    {
        $this->app->bind(TranslationEngine::class, fn () => $motor);
    }

    public function test_motor_yokken_ozgun_metin_doner(): void
    {
        $this->motorBagla(new UnavailableEngine());

        $s = $this->servis()->cevir('post', 'abc', 'body', 'Merhaba', 'de');

        $this->assertSame('Merhaba', $s['text']);
        $this->assertFalse($s['translated']);
        $this->assertSame(0, Translation::count(), 'Çeviri yokken kayıt açılmamalı');
    }

    public function test_ceviri_saklanir_ve_ikinci_istekte_motora_gidilmez(): void
    {
        $motor = new SahteCevirmen();
        $this->motorBagla($motor);

        $ilk = $this->servis()->cevir('post', 'abc', 'body', 'Merhaba', 'de', 'tr');
        $this->assertTrue($ilk['translated']);
        $this->assertSame('[de] Merhaba', $ilk['text']);
        $this->assertSame(1, $motor->cagri);

        $ikinci = $this->servis()->cevir('post', 'abc', 'body', 'Merhaba', 'de', 'tr');
        $this->assertSame('[de] Merhaba', $ikinci['text']);
        $this->assertSame(1, $motor->cagri, 'Önbellekteki çeviri için motora gidilmemeli');
    }

    public function test_icerik_duzenlenirse_eski_ceviri_kullanilmaz(): void
    {
        $motor = new SahteCevirmen();
        $this->motorBagla($motor);

        $this->servis()->cevir('post', 'abc', 'body', 'Merhaba', 'de', 'tr');
        $yeni = $this->servis()->cevir('post', 'abc', 'body', 'Merhaba dünya', 'de', 'tr');

        $this->assertSame('[de] Merhaba dünya', $yeni['text']);
        $this->assertSame(2, $motor->cagri, 'Metin değişince yeniden çevrilmeli');
        $this->assertSame(1, Translation::count(), 'Aynı içerik+dil için tek kayıt kalmalı');
    }

    public function test_kaynak_ve_hedef_dil_ayniysa_cevrilmez(): void
    {
        $motor = new SahteCevirmen();
        $this->motorBagla($motor);

        $s = $this->servis()->cevir('post', 'abc', 'body', 'Merhaba', 'tr', 'tr');

        $this->assertFalse($s['translated']);
        $this->assertSame(0, $motor->cagri);
    }

    public function test_motor_hata_verirse_ozgun_metin_gosterilir(): void
    {
        $this->motorBagla(new PatlayanCevirmen());

        $s = $this->servis()->cevir('message', 'm1', 'body', 'Ağrım var', 'en', 'tr');

        // Çeviri bir kolaylıktır; başarısızlığı içeriği gizlemeye dönüşmemeli.
        $this->assertSame('Ağrım var', $s['text']);
        $this->assertFalse($s['translated']);
    }

    public function test_toplu_ceviri_anahtarlariyla_doner(): void
    {
        $this->motorBagla(new SahteCevirmen());

        $sonuc = $this->servis()->topluCevir([
            ['type' => 'post', 'id' => 'p1', 'field' => 'body', 'text' => 'Bir', 'lang' => 'tr'],
            ['type' => 'comment', 'id' => 'c1', 'field' => 'body', 'text' => 'İki', 'lang' => 'tr'],
        ], 'en');

        $this->assertSame('[en] Bir', $sonuc['post:p1:body']['text']);
        $this->assertSame('[en] İki', $sonuc['comment:c1:body']['text']);
    }

    public function test_durum_ucu_motorun_hazir_olmadigini_bildirir(): void
    {
        $this->motorBagla(new UnavailableEngine());
        Sanctum::actingAs(User::factory()->patient()->create(['preferred_language' => 'de']));

        $this->getJson('/api/translation/status')
            ->assertOk()
            ->assertJsonPath('available', false)
            ->assertJsonPath('language', 'de')
            ->assertJsonPath('enabled', false);
    }

    public function test_toplu_ceviri_ucu_oturum_ister(): void
    {
        $this->postJson('/api/translation/batch', [
            'items' => [['type' => 'post', 'id' => 'p1', 'text' => 'Merhaba']],
        ])->assertStatus(401);
    }
}

/** Testte kullanılan sahte çevirmen: metnin başına hedef dili ekler. */
class SahteCevirmen implements TranslationEngine
{
    public int $cagri = 0;

    public function kullanilabilir(): bool
    {
        return true;
    }

    public function cevir(string $metin, string $hedefDil, ?string $kaynakDil = null, bool $tibbiMetin = false): ?string
    {
        $this->cagri++;
        return "[{$hedefDil}] {$metin}";
    }

    public function dilTespit(string $metin): ?string
    {
        return 'tr';
    }

    public function ad(): string
    {
        return 'sahte';
    }
}

/** Motorun çöktüğü durumu sınamak için. */
class PatlayanCevirmen implements TranslationEngine
{
    public function kullanilabilir(): bool
    {
        return true;
    }

    public function cevir(string $metin, string $hedefDil, ?string $kaynakDil = null, bool $tibbiMetin = false): ?string
    {
        throw new \RuntimeException('motor yanıt vermedi');
    }

    public function dilTespit(string $metin): ?string
    {
        return null;
    }

    public function ad(): string
    {
        return 'patlayan';
    }
}
