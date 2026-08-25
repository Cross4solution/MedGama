<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hata yanıtları içeriyi dışarı vermemeli.
 *
 * Canlıya çıkmadan önce herkese açık uçlar tarandı ve bu tarafta bulgu ÇIKMADI.
 * Not, ölçümün ne olduğunu ve neye dayandığını kaydediyor — aynı tarama baştan
 * yapılmasın ve buradaki üç ayar sessizce kaymasın diye.
 *
 * Yapılan ölçümler (yerel ve canlı arka uca karşı, yalnız okuma):
 *
 *   • `/clinics?name=` alanına `<script>`, `" onmouseover=`, `' OR '1'='1`,
 *     `admin'--`, beş bin karakter ve `%_%` verildi. Hepsi 200 döndü, hiçbiri
 *     yanıtta ham olarak yansımadı, hiçbirinde `SQLSTATE`, yığın izi ya da
 *     dosya yolu görünmedi.
 *
 *   • `LIKE` jokerleri kaçırılıyor: `name=%` ve `name=_` SIFIR sonuç veriyor,
 *     tam liste değil. Kaçırılmasaydı `%` her kaydı eşlerdi.
 *
 *   • On beş korumalı uç kimliksiz çağrıldı; hepsi 401 döndü, hiçbiri veri
 *     vermedi (`/notifications`, `/patient-records`, `/crm/*`, `/admin/*`,
 *     `/finance/*`, `/messages/*`, `/calendar-slots` dahil).
 *
 * Aşağıdaki ölçütler bu güvencenin dayandığı ÜÇ AYARI sabitliyor. Üçü de tek
 * satırlık düzenlemeyle bozulabilir ve bozulduğunda hiçbir test kırmızı
 * yanmazdı — çünkü uygulama çalışmaya devam eder, sadece fazla şey söyler.
 */
class UretimHataGizliligiTest extends TestCase
{
    use RefreshDatabase;

    /** Depodaki bir dosyayı oku. */
    private function icerik(string $goreliYol): string
    {
        $tam = base_path($goreliYol);

        $this->assertFileExists($tam, "$goreliYol bulunamadı — bu ölçüt güncellenmeli");

        return (string) file_get_contents($tam);
    }

    public function test_uretimde_hata_ayiklama_kapali(): void
    {
        // `APP_DEBUG=true` ile bir istisna, yığın izini ve ortam değişkenlerini
        // yanıta basar.
        $render = $this->icerik('../render.yaml');

        $this->assertMatchesRegularExpression(
            '/key:\s*APP_DEBUG\s*\n\s*value:\s*false/',
            $render,
            'render.yaml APP_DEBUG=false demiyor: canlıda yığın izi sızabilir',
        );

        $this->assertMatchesRegularExpression(
            '/key:\s*APP_ENV\s*\n\s*value:\s*production/',
            $render,
            'APP_ENV production değil: hata mesajları genel sürümüne düşmez',
        );
    }

    public function test_hata_mesaji_uretimde_genellestiriliyor(): void
    {
        // İşleyici mesajı `app()->isProduction()` ile değiştiriyor. Bu koşul
        // kalkarsa veritabanı hatasının METNİ istemciye gider.
        $baslangic = $this->icerik('bootstrap/app.php');

        $this->assertStringContainsString(
            "app()->isProduction()",
            $baslangic,
            'hata mesajı üretim/geliştirme ayrımı yapmıyor',
        );

        // Yığın izi hiçbir dalda yanıta yazılmamalı.
        foreach (['getTraceAsString', 'getTrace()'] as $sizinti) {
            $this->assertStringNotContainsString(
                $sizinti,
                $baslangic,
                "yığın izi yanıta ekleniyor: $sizinti",
            );
        }
    }

    public function test_teshis_basligi_varsayilan_olarak_kapali(): void
    {
        // `Server-Timing` ve `X-Sorgu-Sayisi` başlıkları sorgu sayısı ve süre
        // yazıyor; istisna sınıfının adı da aynı bayrağa bağlı. Ölçüldü: canlıda
        // ve yerelde şu an KAPALI. Varsayılanın `false` kalması, birinin
        // ortam değişkenini unutmasına karşı emniyet.
        $this->assertFalse(
            config('app.timing_header'),
            'teşhis başlığı varsayılan olarak açık: sorgu sayısı ve istisna sınıfı dışarı verilir',
        );

        $yapilandirma = $this->icerik('config/app.php');

        $this->assertStringContainsString(
            "env('TIMING_HEADER', false)",
            $yapilandirma,
            'varsayılan `false` değil',
        );
    }

    public function test_korumali_uc_kimliksiz_veri_vermiyor(): void
    {
        // Taramanın en kritik parçası; burada örnekleniyor ki ayar değişirse
        // testler önce kırmızı yansın.
        foreach ([
            '/api/notifications',
            '/api/patient-records',
            '/api/crm/patients',
            '/api/admin/users',
            '/api/messages/conversations',
        ] as $uc) {
            $yanit = $this->getJson($uc);

            $this->assertSame(
                401,
                $yanit->status(),
                "$uc kimliksiz erişime 401 dönmüyor",
            );
        }
    }

    public function test_arama_joker_karakterleri_kacinilıyor(): void
    {
        // `%` kaçırılmazsa her kaydı eşler; arama kutusu sessizce tam liste
        // döndürür. Ölçüldü: `name=%` sıfır sonuç veriyor.
        $yanit = $this->getJson('/api/clinics?per_page=100&name=%25');

        $yanit->assertOk();
        $this->assertSame(0, $yanit->json('total'), 'joker karakter LIKE sorgusuna geçiyor');
    }
}
