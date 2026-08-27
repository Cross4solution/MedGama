<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Yedeğin yazılacağı disk
    |--------------------------------------------------------------------------
    |
    | Buradan okunuyor, komutun içinden `env()` ile DEĞİL. Yapılandırma
    | önbelleğe alındığında (`config:cache`) `config/` dışındaki `env()`
    | çağrıları null döner — yedek o zaman sessizce başka bir diske, yani
    | hiçbir yere yazılırdı.
    |
    | `local` sunucunun kendi diski demek ve gerçek bir yedek değildir:
    | makineyi kaybettiren arızada dosya da gider. Üretimde sunucu DIŞINDA
    | bir disk (S3 vb.) tanımlanmalı.
    |
    */

    'disk' => env('YEDEK_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Saklanacak gün sayısı
    |--------------------------------------------------------------------------
    */

    'tut_gun' => (int) env('YEDEK_TUT_GUN', 7),

];
