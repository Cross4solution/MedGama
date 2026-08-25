<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */

        /*
    |--------------------------------------------------------------------------
    | Genel API hız sınırı (istek/dakika)
    |--------------------------------------------------------------------------
    |
    | `env()` DOĞRUDAN çağrılamaz: yapılandırma önbelleğe alındığında (canlıda
    | `config:cache` çalışıyor) config/ dışındaki env() çağrıları null döner.
    | Sınır 0 olur ve HER istek engellenirdi. Bu yüzden burada.
    |
    | Yapılandırılabilir olmasının tek sebebi E2E paketi: tam koşuda 120/dk
    | sınırına takılıp testler 429 alıyordu ve bu, gerçek hata sanılan bir
    | gürültü üretiyordu.
    |
    */

    'api_rate_limit' => (int) env('API_RATE_LIMIT', 120),

    'name' => env('APP_NAME', 'Medagama'),

    /*
    |--------------------------------------------------------------------------
    | Allow Destructive DB Init Endpoint
    |--------------------------------------------------------------------------
    | When false (default), /api/system/init-db returns 404 in production.
    | Flip ALLOW_DESTRUCTIVE_INIT=true in env only for one-time bootstrap,
    | then disable immediately after use.
    */
    'allow_destructive_init' => env('ALLOW_DESTRUCTIVE_INIT', false),

    // Geçici teşhis başlığı (Server-Timing). Yalnızca süre sayıları yazar.
    // TESLİMDEN ÖNCE KALDIRILACAK.
    'timing_header' => env('TIMING_HEADER', false),

    /*
    | init-db endpoint secret.
    |
    | Varsayılan artık BOŞ. Eskiden depoda yazılı sabit bir parolaydı ve kodun
    | kendi notu "MUST be rotated" diyordu — parolayı buraya yeniden yazmıyoruz,
    | çünkü bu dosya onu gizli tutması gereken yer. Depoyu okuyabilen herkes
    | anahtarı biliyordu; gizliliği, kimsenin değiştirmeyi unutmamasına
    | bağlıydı.
    |
    | Boş anahtar ucu KULLANILAMAZ kılıyor: denetleyici boşsa isteği reddediyor.
    | Yani değişken tanımlanmazsa uç kapalı kalır — unutmanın bedeli açık
    | kalması olmamalı. Aynı karar `demo.enabled` için de verilmişti.
    */
    'init_db_key' => env('INIT_DB_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    */

    'url' => env('APP_URL', 'http://localhost'),

    'asset_url' => env('ASSET_URL'),

    /*
     * Arayüzün adresi — e-postalardaki her bağlantı buradan kuruluyor.
     *
     * Önce FRONTEND_URL okunuyor: sunucuda tanımlı olan değişken bu, ve
     * yalnızca APP_FRONTEND_URL aransaydı (öyleydi) tanımsız kalıp
     * localhost'a düşerdi — kullanıcıya giden e-postalardaki düğmeler
     * kendi bilgisayarlarını işaret ederdi.
     */
    'frontend_url' => env('FRONTEND_URL', env('APP_FRONTEND_URL', 'http://localhost:3000')),

    /* Alt bilgide gösterilen destek adresi. */
    'support_email' => env('SUPPORT_EMAIL', 'destek@medagama.com'),

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. The timezone
    | is set to "UTC" by default as it is suitable for most use cases.
    |
    */

    'timezone' => 'UTC',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    */

    'locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Maintenance Mode Driver
    |--------------------------------------------------------------------------
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

];
