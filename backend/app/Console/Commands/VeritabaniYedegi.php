<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

/**
 * Veritabanı yedeği alır ve isteğe bağlı olarak GERİ YÜKLEYİP doğrular.
 *
 * Yedekleme tarafında hiçbir şey yoktu: komut yok, zamanlanmış iş yok, felaket
 * senaryosu hiç denenmemiş. Hasta verisi tutan bir sistemde bu, diğer bütün
 * risklerden ağır — çünkü kaybedilen veri test edilerek geri gelmiyor.
 *
 * ── Neden `--dogrula` var ──────────────────────────────────────────────
 *
 * Alınmış ama hiç geri yüklenmemiş bir yedek, yedek sayılmaz; yalnızca yedek
 * olduğu SANILAN bir dosyadır. Bozuk bir dump da aynı boyutta görünür, aynı
 * yere yazılır ve felaket anına kadar kimse fark etmez.
 *
 * `--dogrula` dosyayı geçici bir veritabanına geri yüklüyor, tablo sayılarını
 * kaynakla karşılaştırıyor ve geçici veritabanını siliyor. Yani "yedek
 * alındı" değil, "yedekten dönülebiliyor" ölçülüyor.
 *
 * ── Bu komutun YAPMADIĞI ───────────────────────────────────────────────
 *
 * Dosyayı sunucunun DIŞINA taşımıyor. Render gibi ortamlarda disk geçici:
 * kapsayıcı yeniden başladığında dosya gider. Aynı makinede duran yedek,
 * makineyi kaybettiren bir arızada hiçbir işe yaramaz.
 *
 * Bu yüzden hedef yerel diskse komut UYARIYOR. Dosyayı S3 benzeri bir yere
 * taşımak altyapı kararı ve `YEDEK_DISK` ile bağlanıyor.
 */
class VeritabaniYedegi extends Command
{
    protected $signature = 'db:yedek
        {--dogrula : Yedeği geçici bir veritabanına geri yükleyip doğrular}
        {--tut= : Kaç günlük yedek saklanacak (varsayılan: config/yedek.php)}';

    protected $description = 'Veritabanı yedeği alır; --dogrula ile geri yükleme provası yapar';

    public function handle(): int
    {
        $surucu = DB::connection()->getDriverName();

        if ($surucu !== 'mysql') {
            $this->error("Bu komut MySQL/TiDB için yazıldı; şu anki sürücü: {$surucu}");

            return self::FAILURE;
        }

        // `env()` DEĞİL: `config:cache` sonrası `config/` dışındaki env()
        // çağrıları null döner ve yedek sessizce yanlış diske giderdi.
        $diskAdi = config('yedek.disk');
        $disk = Storage::disk($diskAdi);

        $dosyaAdi = sprintf('yedek/medagama-%s.sql', now()->format('Y-m-d-His'));

        $this->info('Yedek alınıyor…');

        $dokum = $this->dokumAl();

        if ($dokum === null) {
            return self::FAILURE;
        }

        $disk->put($dosyaAdi, $dokum);

        $boyutMb = round(strlen($dokum) / 1048576, 2);
        $this->info("Yazıldı: {$dosyaAdi} ({$boyutMb} MB, disk: {$diskAdi})");

        if ($diskAdi === 'local' || $diskAdi === 'public') {
            $this->warn('UYARI: yedek AYNI MAKİNEDE duruyor.');
            $this->warn('Makineyi kaybettiren bir arızada bu dosya da gider.');
            $this->warn('Sunucu dışına taşımak için YEDEK_DISK ayarlanmalı.');
        }

        if ($this->option('dogrula') && !$this->geriYuklemeProvasi($dokum)) {
            return self::FAILURE;
        }

        $this->eskileriSil($disk, (int) ($this->option('tut') ?? config('yedek.tut_gun')));

        return self::SUCCESS;
    }

    /** `mysqldump` çıktısını döndürür. */
    private function dokumAl(): ?string
    {
        $y = config('database.connections.mysql');

        $komut = array_filter([
            'mysqldump',
            '--host=' . $y['host'],
            '--port=' . $y['port'],
            '--user=' . $y['username'],
            $y['password'] ? '--password=' . $y['password'] : null,
            // Tetikleyici ve rutinler de gelsin; yalnız tablolar yeterli değil.
            '--routines',
            '--triggers',
            '--single-transaction',
            '--quick',
            // GTID bilgisi ÇIKARILIYOR.
            //
            // Varsayılan çıktı `SET @@GLOBAL.GTID_PURGED=...` satırı taşıyor.
            // Bu satır dökümü başka bir veritabanına geri yüklemeyi
            // ENGELLİYOR: sunucu "eklenen gtid kümesi mevcutla çakışıyor"
            // deyip duruyor.
            //
            // Yani yedek alınıyor, dosya doğru boyutta görünüyor, hiçbir hata
            // çıkmıyor — ve felaket anına kadar kimse geri yüklenemediğini
            // bilmiyor. Bu satır ilk provada yakalandı.
            '--set-gtid-purged=OFF',
            $y['database'],
        ]);

        $surec = new Process($komut);
        $surec->setTimeout(600);
        $surec->run();

        if (!$surec->isSuccessful()) {
            $this->error('mysqldump başarısız: ' . trim($surec->getErrorOutput()));

            return null;
        }

        $cikti = $surec->getOutput();

        // Boş ya da kırpılmış bir dökümü sessizce yazmak, yedek olduğu sanılan
        // bir dosya bırakır — asıl tehlike bu.
        if (!str_contains($cikti, 'CREATE TABLE')) {
            $this->error('Döküm tablo tanımı içermiyor; yedek geçersiz.');

            return null;
        }

        return $cikti;
    }

    /**
     * Yedeği geçici bir veritabanına geri yükler ve tablo sayılarını karşılaştırır.
     *
     * Üretimde ÇALIŞMAZ: veritabanı oluşturup silmek üretim kimlik bilgileriyle
     * yapılacak bir şey değil. Prova, canlının kopyası olan bir ortamda koşar.
     */
    private function geriYuklemeProvasi(string $dokum): bool
    {
        if (app()->environment('production')) {
            $this->warn('Geri yükleme provası üretimde çalıştırılmaz; atlandı.');

            return true;
        }

        $y = config('database.connections.mysql');
        $gecici = $y['database'] . '_prova_' . now()->format('His');

        $this->info("Geri yükleme provası: {$gecici}");

        $beklenen = $this->tabloSayilari($y['database']);

        try {
            DB::statement("CREATE DATABASE `{$gecici}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            $yukle = Process::fromShellCommandline(
                sprintf(
                    'mysql --host=%s --port=%s --user=%s %s %s',
                    escapeshellarg($y['host']),
                    escapeshellarg((string) $y['port']),
                    escapeshellarg($y['username']),
                    $y['password'] ? '--password=' . escapeshellarg($y['password']) : '',
                    escapeshellarg($gecici),
                ),
            );
            $yukle->setTimeout(600);
            $yukle->setInput($dokum);
            $yukle->run();

            if (!$yukle->isSuccessful()) {
                $this->error('Geri yükleme başarısız: ' . trim($yukle->getErrorOutput()));

                return false;
            }

            $gelen = $this->tabloSayilari($gecici);

            return $this->karsilastir($beklenen, $gelen);
        } finally {
            DB::statement("DROP DATABASE IF EXISTS `{$gecici}`");
        }
    }

    /** @return array<string,int> tablo → satır sayısı */
    private function tabloSayilari(string $veritabani): array
    {
        $sayilar = [];

        foreach (DB::select('SHOW TABLES FROM `' . $veritabani . '`') as $satir) {
            $tablo = array_values((array) $satir)[0];
            $sayilar[$tablo] = (int) DB::selectOne("SELECT COUNT(*) AS n FROM `{$veritabani}`.`{$tablo}`")->n;
        }

        return $sayilar;
    }

    /** @param array<string,int> $beklenen @param array<string,int> $gelen */
    private function karsilastir(array $beklenen, array $gelen): bool
    {
        $eksikTablo = array_diff(array_keys($beklenen), array_keys($gelen));
        $farkli = [];

        foreach ($beklenen as $tablo => $sayi) {
            if (isset($gelen[$tablo]) && $gelen[$tablo] !== $sayi) {
                $farkli[] = "{$tablo}: {$sayi} → {$gelen[$tablo]}";
            }
        }

        if ($eksikTablo) {
            $this->error('Geri yüklemede EKSİK tablo: ' . implode(', ', $eksikTablo));
        }

        if ($farkli) {
            $this->error('Satır sayısı tutmuyor: ' . implode(' | ', $farkli));
        }

        if ($eksikTablo || $farkli) {
            return false;
        }

        $this->info(sprintf(
            'Prova başarılı: %d tablo, %s satır geri yüklendi.',
            count($beklenen),
            number_format(array_sum($beklenen)),
        ));

        return true;
    }

    private function eskileriSil($disk, int $gun): void
    {
        if ($gun <= 0) {
            return;
        }

        $sinir = now()->subDays($gun)->getTimestamp();
        $silinen = 0;

        foreach ($disk->files('yedek') as $dosya) {
            if ($disk->lastModified($dosya) < $sinir) {
                $disk->delete($dosya);
                $silinen++;
            }
        }

        if ($silinen) {
            $this->line("{$gun} günden eski {$silinen} yedek silindi.");
        }
    }
}
