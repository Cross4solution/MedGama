<?php

/**
 * Çeviri ve alt yazı sağlayıcısı.
 *
 * Kendi sunucumuzda LibreTranslate ayağa kalkınca sağlayıcı 'libretranslate'
 * yapılır ve hasta metni hiçbir dış servise çıkmaz.
 */
return [
    'provider'       => env('TRANSLATE_PROVIDER', 'mymemory'),
    'default_source' => env('TRANSLATE_DEFAULT_SOURCE', 'tr'),

    'mymemory' => [
        // MyMemory günlük kotayı e-postaya göre veriyor.
        'email' => env('MYMEMORY_EMAIL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Toplu çeviri için duvar-saati bütçesi (saniye)
    |--------------------------------------------------------------------------
    |
    | `/translation/batch` her kaydı SIRAYLA dış servise gönderiyor ve bunu
    | isteğin içinde yapıyor — yani bir PHP-FPM işçisi tüm süre boyunca dolu.
    | Ölçüldü: önbelleğe girmemiş 11 kayıt 6,2 saniye (kayıt başına ~560 ms).
    | Doğrulama 50 kayda izin veriyor ve sağlayıcı çağrısı başına zaman aşımı
    | 8 saniye; en kötü hâlde tek istek bir işçiyi ~400 saniye tutabilir.
    |
    | Az işçili bir sunucuda birkaç böyle istek arka ucu tüketiyor: akışın
    | KENDİ istekleri kuyruğa girip zaman aşımına uğruyor ve kullanıcı
    | gönderilerin kaybolduğunu görüyor. Yani çeviri bir kolaylıkken tüm
    | sayfayı düşürüyor.
    |
    | Bütçe dolunca kalan kayıtlar çevrilmeden dönüyor: içerik özgün dilinde
    | kalır, akış ayakta kalır.
    |
    */

    'batch_budget' => (float) env('TRANSLATE_BATCH_BUDGET', 6.0),

    'libretranslate' => [
        'url'     => env('LIBRETRANSLATE_URL', ''),
        'api_key' => env('LIBRETRANSLATE_API_KEY'),
    ],
];
