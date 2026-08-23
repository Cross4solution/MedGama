<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TranslationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Toplu çevirinin süre bütçesi.
 *
 * `/translation/batch` her kaydı SIRAYLA dış servise gönderiyor ve bunu
 * isteğin içinde yapıyor — bir PHP-FPM işçisi tüm süre boyunca dolu kalıyor.
 * Ölçüldü: önbelleğe girmemiş 11 kayıt 6,2 saniye, yani kayıt başına ~560 ms.
 * Doğrulama 50 kayda izin veriyor ve sağlayıcı çağrısı başına zaman aşımı 8
 * saniye; en kötü hâlde tek istek bir işçiyi ~400 saniye tutabiliyordu.
 *
 * Az işçili bir sunucuda birkaç böyle istek arka ucu tüketiyor. O sırada
 * akışın KENDİ istekleri kuyruğa girip zaman aşımına uğruyor ve kullanıcı
 * "içerikleri dilimde göster" anahtarını açtığında gönderilerin kaybolduğunu
 * görüyor. Yani bir KOLAYLIK özelliği tüm sayfayı düşürüyor.
 *
 * Bütçe dolduğunda kalan kayıtlar çevrilmeden dönüyor: içerik özgün dilinde
 * kalır, akış ayakta kalır. Ölçüldü — 40 kayıt 22 saniye yerine 6,5 saniyede
 * dönüyor, 12'si çevrilmiş, 28'i özgün.
 *
 * Testler GERÇEK sağlayıcıya çıkmıyor: yavaşlık taklit ediliyor, ölçülen şey
 * bütçenin kendisi.
 */
class TopluCeviriButcesiTest extends TestCase
{
    use RefreshDatabase;

    /** Her çağrıda belirtilen kadar bekleyen sahte çevirmen. */
    private function yavasCevirmen(float $gecikmeSaniye): void
    {
        $sahte = new class($gecikmeSaniye) extends TranslationService {
            public function __construct(private float $gecikme)
            {
            }

            public function translate(string $text, string $target, ?string $source = null): array
            {
                usleep((int) ($this->gecikme * 1_000_000));

                return [
                    'translated_text' => '[' . $target . '] ' . $text,
                    'source_lang'     => $source ?? 'tr',
                    'provider'        => 'sahte',
                    'cached'          => false,
                    'ok'              => true,
                ];
            }
        };

        $this->app->instance(TranslationService::class, $sahte);
    }

    /** @return array<int, array{key: string, text: string, kind: string, lang: string}> */
    private function kayitlar(int $adet): array
    {
        return array_map(fn ($i) => [
            'key'  => "post:{$i}",
            'text' => "Kalp sağlığı için düzenli kontrol önemlidir. Kayıt {$i}",
            'kind' => 'post',
            'lang' => 'tr',
        ], range(1, $adet));
    }

    private function hasta(): User
    {
        return User::factory()->patient()->create(['preferred_language' => 'en']);
    }

    public function test_butce_dolunca_istek_sonsuza_kadar_surmuyor(): void
    {
        // ASIL KORUMA: işçinin serbest kalması.
        config(['translation.batch_budget' => 0.3]);
        $this->yavasCevirmen(0.1);

        $bas = microtime(true);

        $this->actingAs($this->hasta(), 'sanctum')
            ->postJson('/api/translation/batch', ['target' => 'en', 'items' => $this->kayitlar(50)])
            ->assertOk();

        $sure = microtime(true) - $bas;

        // Bütçesiz hâlinde 50 × 0,1 sn = 5 saniye sürerdi.
        $this->assertLessThan(2.0, $sure, "toplu çeviri bütçeyi aşıyor: {$sure} sn");
    }

    public function test_butce_disinda_kalanlar_ozgun_metinle_donuyor(): void
    {
        // Kullanıcı çeviri göremeyebilir; ama İÇERİĞİ görmeli. Boş dönmek
        // kartın gövdesini boşaltırdı.
        config(['translation.batch_budget' => 0.3]);
        $this->yavasCevirmen(0.1);

        $kayitlar = $this->kayitlar(50);

        $yanit = $this->actingAs($this->hasta(), 'sanctum')
            ->postJson('/api/translation/batch', ['target' => 'en', 'items' => $kayitlar])
            ->assertOk();

        $gelen = $yanit->json('items');

        $this->assertCount(50, $gelen, 'her kayıt için bir sonuç dönmeli');

        $atlanan = array_filter($gelen, fn ($x) => ($x['reason'] ?? null) === 'budget');
        $this->assertNotEmpty($atlanan, 'bütçe hiç devreye girmemiş — test bir şey ölçmüyor');

        foreach ($kayitlar as $k) {
            $this->assertArrayHasKey($k['key'], $gelen);
            $this->assertNotSame('', $gelen[$k['key']]['text'], "boş metin döndü: {$k['key']}");
        }

        // Atlananlar özgün metnin AYNISI olmalı ve çevrilmiş sayılmamalı.
        foreach ($atlanan as $anahtar => $deger) {
            $sira = (int) explode(':', $anahtar)[1];
            $this->assertFalse($deger['translated']);
            $this->assertSame($kayitlar[$sira - 1]['text'], $deger['text']);
        }
    }

    public function test_butce_yeterliyken_hepsi_ceviriliyor(): void
    {
        // Ters uç: bütçe fazla dar olursa çeviri özelliği hiç çalışmaz ve
        // bunu yalnız "hızlı dönüyor" testleriyle fark edemezdik.
        config(['translation.batch_budget' => 30.0]);
        $this->yavasCevirmen(0.0);

        $yanit = $this->actingAs($this->hasta(), 'sanctum')
            ->postJson('/api/translation/batch', ['target' => 'en', 'items' => $this->kayitlar(20)])
            ->assertOk();

        $gelen = $yanit->json('items');

        $this->assertCount(20, $gelen);
        foreach ($gelen as $anahtar => $deger) {
            $this->assertTrue($deger['translated'], "çevrilmedi: {$anahtar}");
            $this->assertStringStartsWith('[en] ', $deger['text']);
        }
    }

    public function test_ilk_kayit_her_zaman_deneniyor(): void
    {
        // Bütçe sıfır bile olsa ilk kayıt denenmeli; yoksa yavaş bir sunucuda
        // özellik tamamen ölür ve sebebi görünmez olur.
        config(['translation.batch_budget' => 0.0001]);
        $this->yavasCevirmen(0.0);

        $yanit = $this->actingAs($this->hasta(), 'sanctum')
            ->postJson('/api/translation/batch', ['target' => 'en', 'items' => $this->kayitlar(5)])
            ->assertOk();

        $this->assertTrue($yanit->json('items.post:1.translated'), 'ilk kayıt hiç denenmedi');
    }
}
