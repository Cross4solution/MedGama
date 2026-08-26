<?php

namespace App\Console\Commands;

use App\Services\EncryptedFileStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Herkese açık diskte kalmış iletişim eklerini şifreli özel diske taşır.
 *
 * Bu ekler `/storage/contact-messages/...` adresinden oturumsuz, imzasız ve
 * süresiz servis ediliyordu. Bağlantı üretimi artık imzalı uca yönlendiriyor,
 * ama dosyanın kendisi eski adreste durduğu sürece o adresi bir kez almış olan
 * herkes erişmeye devam eder. Komut dosyayı taşıyıp eskisini siliyor.
 *
 * Yeniden çalıştırılabilir: taşınmış dosya artık kaynakta olmadığı için
 * atlanır.
 */
class EskiEkleriTasi extends Command
{
    protected $signature = 'ekler:tasi {--kuru-calisma : Dosyaya dokunmadan ne olacağını yazar}';

    protected $description = 'Herkese açık diskteki iletişim eklerini şifreli özel diske taşır';

    public function handle(EncryptedFileStorage $depo): int
    {
        $acik = Storage::disk('public');
        $kuru = (bool) $this->option('kuru-calisma');

        $dosyalar = collect($acik->allFiles('contact-messages'));

        if ($dosyalar->isEmpty()) {
            $this->info('Herkese açık diskte iletişim eki kalmamış.');

            return self::SUCCESS;
        }

        $this->warn($dosyalar->count() . ' dosya herkese açık diskte duruyor.');

        $tasinan = 0;
        foreach ($dosyalar as $yol) {
            if ($kuru) {
                $this->line('  taşınacak: ' . $yol);
                continue;
            }

            $icerik = $acik->get($yol);
            if ($icerik === null) {
                $this->error('  okunamadı, atlandı: ' . $yol);
                continue;
            }

            // Aynı yolu koruyoruz — veritabanındaki file_path değişmiyor, uç
            // dosyayı özel diskte bulup şifresini çözüyor.
            $depo->putContents($yol, $icerik);
            $acik->delete($yol);
            $tasinan++;
        }

        $this->info($kuru ? 'Kuru çalışma; hiçbir dosyaya dokunulmadı.' : $tasinan . ' dosya taşındı.');

        return self::SUCCESS;
    }
}
