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

    /* Demo girişinden sonra kullanıcının yönlendirileceği arayüz adresi. */
    'frontend_url' => env('FRONTEND_URL', 'https://medagama.com'),
];
