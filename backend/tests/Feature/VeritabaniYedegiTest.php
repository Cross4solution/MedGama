<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Yedek alınıyor ve GERİ YÜKLENEBİLİYOR.
 *
 * Yedekleme tarafında hiçbir şey yoktu: komut yok, zamanlanmış iş yok, felaket
 * senaryosu hiç denenmemiş. Hasta verisi tutan bir sistemde bu, diğer bütün
 * risklerden ağır — kaybedilen veri test edilerek geri gelmiyor.
 *
 * ÖLÇÜLEN ŞEY "yedek alındı" DEĞİL. Alınmış ama hiç geri yüklenmemiş bir yedek,
 * yedek sayılmaz; yedek olduğu SANILAN bir dosyadır. İlk provada tam olarak bu
 * çıktı: dump sorunsuz alındı, doğru boyuttaydı, hiçbir hata vermedi — ve geri
 * yüklenemedi. Sebep `mysqldump`'ın çıktıya koyduğu GTID satırıydı. Prova
 * olmasaydı bu, felaket anına kadar bilinmezdi.
 */
class VeritabaniYedegiTest extends TestCase
{
    use RefreshDatabase;

    private function mysqlMi(): bool
    {
        return DB::connection()->getDriverName() === 'mysql';
    }

    public function test_yedek_zamanlayicida(): void
    {
        $bulundu = collect(app(Schedule::class)->events())
            ->contains(fn ($olay) => str_contains((string) $olay->command, 'db:yedek'));

        $this->assertTrue($bulundu, 'yedek alma zamanlanmamış');
    }

    public function test_yedek_budamalardan_sonra_calisiyor(): void
    {
        /*
         * Sıra önemli. Yedek budamalardan ÖNCE alınırsa, o gece silinmesi
         * gereken kayıtlar yedekte yaşamaya devam eder ve "silindi" dediğimiz
         * veri aslında durur — saklama politikası kâğıt üstünde kalır.
         */
        $saat = fn (string $komut) => collect(app(Schedule::class)->events())
            ->first(fn ($o) => str_contains((string) $o->command, $komut))?->expression;

        $dakikaya = function (?string $ifade): ?int {
            if (!$ifade) {
                return null;
            }
            [$dk, $sa] = explode(' ', $ifade);

            return ((int) $sa) * 60 + (int) $dk;
        };

        $budama = $dakikaya($saat('model:prune'));
        $yedek = $dakikaya($saat('db:yedek'));

        $this->assertNotNull($budama);
        $this->assertNotNull($yedek);
        $this->assertGreaterThan($budama, $yedek, 'yedek budamadan önce alınıyor');
    }

    public function test_yedek_dosyasi_gercekten_yaziliyor(): void
    {
        if (!$this->mysqlMi()) {
            $this->markTestSkipped('Yedek yalnız gerçek sürücüde alınabilir.');
        }

        Storage::fake('local');

        $this->artisan('db:yedek')->assertSuccessful();

        $dosyalar = Storage::disk('local')->files('yedek');

        $this->assertNotEmpty($dosyalar, 'yedek dosyası yazılmamış');

        // Dosya sıkıştırılmış; ham içerikte arama yapmak yanıltır.
        $this->assertStringContainsString(
            'CREATE TABLE',
            (string) @gzdecode(Storage::disk('local')->get($dosyalar[0])),
            'yedek tablo tanımı içermiyor — geri yüklenemez',
        );
    }

    public function test_yedek_geri_yuklenebiliyor(): void
    {
        // Asıl ölçüt. Dosyanın varlığı değil, dosyadan DÖNÜLEBİLMESİ.
        if (!$this->mysqlMi()) {
            $this->markTestSkipped('Geri yükleme provası yalnız gerçek sürücüde yapılabilir.');
        }

        Storage::fake('local');

        $this->artisan('db:yedek --dogrula')
            ->expectsOutputToContain('Prova başarılı')
            ->assertSuccessful();
    }

    public function test_yedek_sikistirilmis_yaziliyor(): void
    {
        /*
         * Ölçüldü: ham döküm veritabanının 2,73 KATI (UUID'ler ve tarihler
         * metin olarak duruyor), sıkıştırılmış hâli 0,13 katı.
         *
         * Ham bırakılsaydı 5 milyon randevuda yedi günlük yedek 15,5 GB ederdi
         * ve diske (10 GB) sığmazdı. Arıza sessiz olurdu: disk dolar, yedek
         * yazılamaz, kimse fark etmez — ta ki yedeğe ihtiyaç duyulana kadar.
         */
        if (!$this->mysqlMi()) {
            $this->markTestSkipped('Yedek yalnız gerçek sürücüde alınabilir.');
        }

        Storage::fake('local');

        $this->artisan('db:yedek')->assertSuccessful();

        $dosyalar = Storage::disk('local')->files('yedek');
        $this->assertNotEmpty($dosyalar);
        $this->assertStringEndsWith('.sql.gz', $dosyalar[0]);

        $icerik = Storage::disk('local')->get($dosyalar[0]);

        $this->assertNotFalse(@gzdecode($icerik), 'yedek açılamıyor');
        $this->assertStringContainsString('CREATE TABLE', (string) @gzdecode($icerik));
    }

    public function test_prova_DISKTEKI_dosyayi_deniyor(): void
    {
        /*
         * Prova ilk hâlinde bellekteki dökümü geri yüklüyordu. O, dosyanın
         * doğru YAZILDIĞINI hiç sınamıyor: sıkıştırma bozulsa, disk yarım
         * yazsa ya da depolama katmanı içeriği değiştirse prova yine
         * "başarılı" derdi.
         *
         * Ölçülen şey, ihtiyaç anında açılacak olan dosya olmalı.
         */
        $kaynak = (string) file_get_contents(
            app_path('Console/Commands/VeritabaniYedegi.php'),
        );
        $kaynak = preg_replace('#//.*$#m', '', $kaynak);

        $this->assertMatchesRegularExpression(
            '/\$disk->get\(\$dosyaAdi\)/',
            $kaynak,
            'prova diskteki dosyayı okumuyor; yalnız bellektekini deniyor',
        );
    }

    public function test_yerel_diske_yazarken_uyariyor(): void
    {
        // Aynı makinede duran yedek, makineyi kaybettiren arızada işe yaramaz.
        // Bu uyarı sessizce düşerse kimse eksikliği fark etmez.
        if (!$this->mysqlMi()) {
            $this->markTestSkipped('Yedek yalnız gerçek sürücüde alınabilir.');
        }

        Storage::fake('local');

        $this->artisan('db:yedek')
            ->expectsOutputToContain('AYNI MAKİNEDE')
            ->assertSuccessful();
    }
}
