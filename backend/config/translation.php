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

    'libretranslate' => [
        'url'     => env('LIBRETRANSLATE_URL', ''),
        'api_key' => env('LIBRETRANSLATE_API_KEY'),
    ],
];
