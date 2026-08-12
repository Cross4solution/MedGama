<?php

/**
 * Sentry — canlı hata bildirimi.
 *
 * Bu proje hasta verisiyle çalışıyor; hata raporu üçüncü bir servise gittiği
 * için ayarlar "olabildiğince az veri" ilkesine göre yapıldı: kişisel bilgi
 * gönderimi kapalı, istek gövdesi/çerezler gönderilmiyor ve kalan alanlar
 * before_send içinde ayrıca temizleniyor. Gönderilen şey hatanın kendisi ve
 * kod izidir — hastanın adı, e-postası, dosyası veya anamnez içeriği değil.
 */

return [

    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    // Sürüm takibi: hangi deploy'da bozulduğu görünsün.
    'release' => env('SENTRY_RELEASE'),

    'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'production')),

    // KİŞİSEL VERİ GÖNDERME. Açık olsaydı kullanıcı adı/e-postası, IP'si,
    // çerezleri ve istek gövdesi rapora eklenirdi.
    'send_default_pii' => false,

    // Yalnızca hata izleme aldık; performans ölçümü kapalı (hem ücret hem
    // gereksiz veri). Gerekirse sonra açılır.
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.0),
    'profiles_sample_rate' => 0.0,

    // Hata anında çalışan sorgunun METNİ eklenmesin: WHERE koşullarında hasta
    // kimliği/e-postası geçebiliyor.
    'breadcrumbs' => [
        'logs' => true,
        'cache' => false,
        'livewire' => false,
        'sql_queries' => false,
        'sql_bindings' => false,
        'queue_info' => true,
        'command_info' => true,
        'http_client_requests' => false,
        'notifications' => false,
    ],

    'tracing' => [
        'queue_job_transactions' => false,
        'sql_queries' => false,
        'sql_bindings' => false,
        'views' => false,
        'default_integrations' => false,
    ],

    /**
     * Son süzgeç: rapor gönderilmeden hemen önce çalışır.
     * Hassas alan adları maskelenir. Yeni bir alan eklenirse buraya da eklenmeli.
     */
    'before_send' => function (\Sentry\Event $event): ?\Sentry\Event {
        $maskele = [
            'password', 'password_confirmation', 'token', 'access_token',
            'api_key', 'secret', 'authorization', 'cookie',
            'email', 'mobile', 'phone', 'date_of_birth', 'national_id',
            'patient_medical_snapshot', 'doctor_note', 'confirmation_note',
            'anamnesis', 'medications', 'allergies', 'conditions', 'diagnosis',
        ];

        $temizle = static function (array $veri) use ($maskele, &$temizle): array {
            foreach ($veri as $anahtar => $deger) {
                if (is_string($anahtar) && in_array(strtolower($anahtar), $maskele, true)) {
                    $veri[$anahtar] = '[gizlendi]';
                } elseif (is_array($deger)) {
                    $veri[$anahtar] = $temizle($deger);
                }
            }
            return $veri;
        };

        $istek = $event->getRequest();
        if (!empty($istek)) {
            unset($istek['data'], $istek['cookies'], $istek['env']);
            if (isset($istek['headers']) && is_array($istek['headers'])) {
                $istek['headers'] = $temizle($istek['headers']);
            }
            $event->setRequest($istek);
        }

        $event->setExtra($temizle($event->getExtra()));
        $event->setTags($temizle($event->getTags()));

        return $event;
    },

];
