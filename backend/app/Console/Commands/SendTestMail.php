<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * E-posta yapılandırmasını canlıda sınamak için.
 *
 * "Ayarları girdim" ile "e-posta gerçekten gidiyor" arasında çoğu zaman
 * sessiz bir uçurum oluyor: yanlış sürücü, eksik anahtar, doğrulanmamış
 * gönderen adresi. Bu komut o boşluğu tek adımda kapatıyor ve hata varsa
 * sağlayıcının verdiği mesajı olduğu gibi gösteriyor.
 *
 *   php artisan mail:test ornek@adres.com
 */
class SendTestMail extends Command
{
    protected $signature = 'mail:test {adres : Test postasının gideceği adres}';

    protected $description = 'Yapılandırılmış posta sürücüsüyle tek bir test e-postası gönderir';

    public function handle(): int
    {
        $adres = (string) $this->argument('adres');

        $this->line('Sürücü      : ' . config('mail.default'));
        $this->line('Gönderen    : ' . config('mail.from.address'));
        $this->line('Alıcı       : ' . $adres);

        if (config('mail.default') === 'resend' && !config('services.resend.key')) {
            $this->error('RESEND_API_KEY tanımlı değil — gönderim başarısız olur.');

            return self::FAILURE;
        }

        try {
            Mail::raw(
                "Medagama e-posta yapılandırması çalışıyor.\n\n"
                . 'Gönderim zamanı: ' . now()->toDateTimeString(),
                fn ($m) => $m->to($adres)->subject('Medagama — e-posta testi'),
            );
        } catch (\Throwable $e) {
            // Sağlayıcının kendi mesajı en açıklayıcı olan; kısaltmıyoruz.
            $this->error('Gönderilemedi: ' . $e->getMessage());

            return self::FAILURE;
        }

        $this->info('Gönderildi. Gelen kutusunu (ve spam klasörünü) kontrol edin.');

        return self::SUCCESS;
    }
}
