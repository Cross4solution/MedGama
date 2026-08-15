<?php

return [
    /*
     * Şifresiz demo girişinin anahtarı. Boşsa uç nokta hiç çalışmaz —
     * varsayılan durum kapalıdır ve ayarı silmek bağlantıyı kapatmanın yoludur.
     *
     * env() burada, config dosyasında okunuyor: denetleyicinin içinden
     * çağrılsaydı `php artisan config:cache` sonrası null dönerdi ve bağlantı
     * sessizce ölürdü.
     */
    'login_key' => env('DEMO_LOGIN_KEY', ''),

    /*
     * Bağlantının açacağı hesaplar, e-posta ile.
     *
     * Hesabı veritabanındaki bir alanla değil buradan belirliyoruz: canlıda
     * veritabanına dokunmadan, yalnızca sunucu ayarıyla kurulabilsin ve
     * "hangi hesaplar açık" sorusunun cevabı tek yerde dursun.
     *
     * Buraya gerçek bir kullanıcının e-postası yazılmamalı: yazılırsa o hesap
     * bağlantıyı bilen herkese açılır.
     */
    'accounts' => [
        'doctor'      => env('DEMO_DOCTOR_EMAIL', ''),
        'clinicOwner' => env('DEMO_CLINIC_EMAIL', ''),
    ],

    /* Demo girişinden sonra kullanıcının yönlendirileceği arayüz adresi. */
    'frontend_url' => env('FRONTEND_URL', 'https://medagama.com'),
];
