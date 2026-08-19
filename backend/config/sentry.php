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
     * Maskelenen alanların listesi SentryVeriTemizleyici içinde; yeni bir
     * hassas alan eklenirse oraya eklenmeli. Burada kapanış yerine sınıf
     * duruyor çünkü kapanış yapılandırmanın önbelleğe alınmasını engelliyor.
     */
    'before_send' => [\App\Observability\SentryVeriTemizleyici::class, 'uygula'],

];
