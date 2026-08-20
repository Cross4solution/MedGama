<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * CSP ihlal raporu toplama ucu.
 *
 * Uç herkese açık olmak zorunda — tarayıcı rapor gönderirken kimlik taşımaz.
 * Bu yüzden testler asıl olarak KÖTÜYE KULLANIMA karşı olanı doğruluyor:
 * gövde ne gelirse gelsin çökmemeli, log şişirilememeli, sınırsız
 * gönderilememeli.
 */
class CspRaporTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('csp-report');
    }

    public function test_tarayici_raporu_kabul_ediliyor(): void
    {
        Log::shouldReceive('warning')->once();

        $this->postJson('/api/csp-report', [
            'csp-report' => [
                'document-uri'       => 'https://med-gama.vercel.app/tr/medstream',
                'violated-directive' => 'script-src',
                'blocked-uri'        => 'https://kotu.example/x.js',
                'line-number'        => 42,
            ],
        ])->assertNoContent(204);
    }

    public function test_yeni_bicim_de_kabul_ediliyor(): void
    {
        // Tarayıcılar `report-to` ile dizi biçiminde de gönderiyor.
        $this->postJson('/api/csp-report', [[
            'body' => [
                'documentURL'        => 'https://med-gama.vercel.app/tr',
                'effectiveDirective' => 'img-src',
                'blockedURL'         => 'https://kotu.example/a.png',
            ],
        ]])->assertNoContent(204);
    }

    public function test_bozuk_govde_cokertmiyor(): void
    {
        // Uç herkese açık; gelen her şeye dayanmalı.
        foreach ([[], ['csp-report' => 'metin'], ['rastgele' => ['x' => 1]]] as $govde) {
            $kod = $this->postJson('/api/csp-report', $govde)->getStatusCode();
            $this->assertLessThan(500, $kod, 'Bozuk gövde sunucu hatası üretti.');
        }
    }

    public function test_asiri_uzun_alanlar_kirpiliyor(): void
    {
        $yazilan = null;
        Log::shouldReceive('warning')->once()->andReturnUsing(
            function (string $mesaj, array $baglam) use (&$yazilan) {
                $yazilan = $baglam;
            },
        );

        $this->postJson('/api/csp-report', [
            'csp-report' => ['blocked-uri' => str_repeat('a', 50000)],
        ])->assertNoContent(204);

        // Kırpılmazsa tek istekle disk şişirilebilir.
        $this->assertNotNull($yazilan);
        $this->assertLessThanOrEqual(
            300,
            mb_strlen($yazilan['ihlal_eden']),
            'Uzun alan kırpılmadan loglandı.',
        );
    }

    public function test_sinirsiz_rapor_gonderilemiyor(): void
    {
        $sonKod = null;
        for ($i = 0; $i < 40; $i++) {
            $sonKod = $this->postJson('/api/csp-report', ['csp-report' => ['blocked-uri' => 'x']])->getStatusCode();
            if ($sonKod === 429) break;
        }

        $this->assertSame(429, $sonKod, 'Rapor ucu sınırsız çağrılabiliyor — log seli mümkün.');
    }
}
