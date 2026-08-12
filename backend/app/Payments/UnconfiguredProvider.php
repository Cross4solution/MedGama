<?php

namespace App\Payments;

use App\Models\Payment;
use RuntimeException;

/**
 * Sağlayıcı seçilmediğinde devrede olan uygulama.
 *
 * Sessizce "başarılı" dönmek yerine açıkça hata verir: yarım kurulu bir ödeme
 * sisteminin para almadan randevu onaylaması, hiç ödeme almamaktan daha
 * tehlikelidir. Bu sınıf, sağlayıcı bağlanana kadar tahsilatın kapalı
 * olduğunu garanti eder.
 */
class UnconfiguredProvider implements PaymentProvider
{
    public function baslat(Payment $payment, string $donusUrl): array
    {
        throw new RuntimeException(
            'Ödeme sağlayıcısı seçilmedi. PAYMENT_PROVIDER ayarlanana kadar tahsilat yapılamaz.'
        );
    }

    public function bildirimiCoz(array $govde, array $basliklar): ?array
    {
        return null; // doğrulanamayan bildirim = geçersiz
    }

    public function iade(Payment $payment, int $tutarMinor): array
    {
        return ['ok' => false, 'reference' => null, 'mesaj' => 'Ödeme sağlayıcısı seçilmedi.'];
    }

    public function ad(): string
    {
        return 'unconfigured';
    }
}
