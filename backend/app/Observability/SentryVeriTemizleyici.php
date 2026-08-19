<?php

namespace App\Observability;

use Sentry\Event;

/**
 * Sentry'ye gitmeden hemen önce çalışan son süzgeç.
 *
 * Bu mantık config/sentry.php içinde bir kapanıştı. Kapanış serileştirilemez,
 * bu yüzden `php artisan config:cache` tüm yapılandırmayı önbelleğe alamıyor
 * ve her istek tüm config dosyalarını yeniden yorumluyordu. Sınıfa taşınınca
 * yapılandırma önbelleğe alınabiliyor; süzgecin davranışı değişmedi.
 *
 * Gönderilen şey hatanın kendisi ve kod izidir — hastanın adı, e-postası,
 * dosyası veya anamnez içeriği değil.
 */
class SentryVeriTemizleyici
{
    /** Değeri gizlenecek alan adları. */
    private const MASKELE = [
        'password', 'password_confirmation', 'token', 'access_token',
        'api_key', 'secret', 'authorization', 'cookie',
        'email', 'mobile', 'phone', 'date_of_birth', 'national_id',
        'patient_medical_snapshot', 'doctor_note', 'confirmation_note',
        'anamnesis', 'medications', 'allergies', 'conditions', 'diagnosis',
    ];

    /**
     * Yapılandırmadan [SentryVeriTemizleyici::class, 'uygula'] olarak bağlanır.
     *
     * Metot STATİK olmak zorunda: sınıf adıyla verilen bir örnek metodu PHP
     * için çağrılabilir değildir, süzgeç sessizce hiç çalışmaz ve rapor
     * temizlenmeden gider.
     */
    public static function uygula(Event $event): ?Event
    {
        $istek = $event->getRequest();
        if (!empty($istek)) {
            // Gövde, çerezler ve ortam değişkenleri hiç gönderilmiyor:
            // hastanın yazdığı her şey gövdede.
            unset($istek['data'], $istek['cookies'], $istek['env']);
            if (isset($istek['headers']) && is_array($istek['headers'])) {
                $istek['headers'] = self::temizle($istek['headers']);
            }
            $event->setRequest($istek);
        }

        $event->setExtra(self::temizle($event->getExtra()));
        $event->setTags(self::temizle($event->getTags()));

        return $event;
    }

    /**
     * @param  array<mixed>  $veri
     * @return array<mixed>
     */
    private static function temizle(array $veri): array
    {
        foreach ($veri as $anahtar => $deger) {
            if (is_string($anahtar) && in_array(strtolower($anahtar), self::MASKELE, true)) {
                $veri[$anahtar] = '[gizlendi]';
            } elseif (is_array($deger)) {
                $veri[$anahtar] = self::temizle($deger);
            }
        }

        return $veri;
    }
}
