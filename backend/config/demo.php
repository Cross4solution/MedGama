<?php

return [
    /*
     * Şifresiz demo girişi açık mı.
     *
     * Teslimden önce sunucuda DEMO_LOGIN_ENABLED=false yapılmalı; bağlantıyı
     * kapatmanın yolu budur.
     */
    'enabled' => filter_var(env('DEMO_LOGIN_ENABLED', true), FILTER_VALIDATE_BOOLEAN),

    /*
     * İsteğe bağlı anahtar. Tanımlıysa bağlantıda da bulunması gerekir.
     * Boşsa bağlantı anahtarsız çalışır — CRM'i denemek için tek tık.
     *
     * env() burada okunuyor, denetleyicide değil: `php artisan config:cache`
     * sonrası env() denetleyici içinde null döner.
     */
    'login_key' => env('DEMO_LOGIN_KEY', ''),

    /*
     * Demo hesaplarının e-postaları.
     *
     * Bu adresler bu mekanizmaya ayrılmıştır: hesap yoksa kendisi oluşturur,
     * örnek veriyi de o hesabın altına kurar. Gerçek bir kullanıcının adresi
     * buraya yazılmamalı — yazılırsa o hesap bağlantıyı bilen herkese açılır.
     */
    'accounts' => [
        'doctor'      => env('DEMO_DOCTOR_EMAIL', 'demo-doktor@medagama.test'),
        'clinicOwner' => env('DEMO_CLINIC_EMAIL', 'demo-klinik@medagama.test'),
    ],

    /*
     * Demo girişinden sonra yönlendirilecek arayüz adresi.
     *
     * Varsayılan yayında olan arayüz. Buraya bize ait olmayan bir alan adı
     * yazılmamalı: oturum jetonu adres çubuğunda taşındığı için yanlış bir
     * varsayılan jetonu üçüncü bir tarafa gönderir — bir kez oldu.
     */
    'frontend_url' => env('FRONTEND_URL', 'https://med-gama.vercel.app'),
];
