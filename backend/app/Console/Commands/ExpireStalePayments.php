<?php

namespace App\Console\Commands;

use App\Services\PaymentService;
use Illuminate\Console\Command;

/**
 * Süresi dolan kapora ödemelerini kapatır.
 *
 * Ödeme ekranını açıp yarım bırakan hasta, randevu saatini kilitli tutuyor.
 * Bu komut olmadan o saatler sonsuza kadar bloke kalır ve başka hasta randevu
 * alamaz.
 */
class ExpireStalePayments extends Command
{
    protected $signature = 'payments:expire-stale';
    protected $description = 'Süresi dolmuş bekleyen ödemeleri kapatır, tuttukları randevu saatlerini serbest bırakır';

    public function handle(PaymentService $payments): int
    {
        $sayi = $payments->suresiDolanlariKapat();

        $this->info("[payments] {$sayi} süresi dolmuş ödeme kapatıldı.");

        return self::SUCCESS;
    }
}
