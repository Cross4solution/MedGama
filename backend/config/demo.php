<?php

return [
    /*
     * Şifresiz demo girişi açık mı.
     *
     * Varsayılan KAPALI. Eskiden `true` idi ve `render.yaml` bu değişkeni hiç
     * içermiyordu — yani o dosyadan yapılan taze bir dağıtım, kasıtlı bir
     * kimlik doğrulama atlamasını AÇIK olarak yayına alıyordu. Unutmanın
     * bedeli açık kalması olmamalı; unutulursa kapalı kalsın.
     *
     * Yerelde açmak için `.env` içine `DEMO_LOGIN_ENABLED=true` yazılıyor;
     * üretimde `render.yaml` artık açıkça `false` diyor.
     */
    'enabled' => filter_var(env('DEMO_LOGIN_ENABLED', false), FILTER_VALIDATE_BOOLEAN),

    /*
     * İsteğe bağlı anahtar. Tanımlıysa bağlantıda da bulunması gerekir.
     * Boşsa bağlantı anahtarsız çalışır — CRM'i denemek için tek tık.
     *
     * env() burada okunuyor, denetleyicide değil: `php artisan config:cache`
     * sonrası env() denetleyici içinde null döner.
     */
    'login_key' => env('DEMO_LOGIN_KEY', ''),

    /*
     * Yönetim panelinin ŞİFRESİZ açılması.
     *
     * Müşteriye paneli göstermek için istendi ve bilerek açıldı. Ne olduğu
     * konusunda kendimizi kandırmayalım: açıkken `/admin` adresine giren
     * HERKES — bağlantıyı bulan, tarayıcı geçmişinden görene, arama
     * motorundan gelene kadar — hasta kayıtlarını, faturaları ve kullanıcı
     * listesini görür.
     *
     * Zararı sınırlayan üç şey:
     *
     *   1. Giriş SALT OKUNUR hesapla yapılıyor: hiçbir kayıt silinemez,
     *      değiştirilemez, eklenemez.
     *   2. Varsayılan KAPALI ve panelden yönetiliyor: tek değişkenle,
     *      dağıtım beklemeden kapanır.
     *   3. Panel arama motorlarına kapalı (`noindex`) çıkıyor.
     *
     * Kalıcı bir düzen değil, tanıtım süresince açık kalacak bir kapı.
     */
    'yonetici_otomatik_giris' => filter_var(env('DEMO_ADMIN_AUTO_LOGIN', false), FILTER_VALIDATE_BOOLEAN),

    /*
     * Otomatik girişin kullandığı hesap. Bu adres bu mekanizmaya ayrılmıştır;
     * gerçek bir yöneticinin adresi yazılırsa o hesap herkese açılır.
     */
    'yonetici_hesabi' => env('DEMO_ADMIN_EMAIL', 'demo-yonetici@medagama.test'),

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
        'patient'     => env('DEMO_PATIENT_EMAIL', 'demo-hasta@medagama.test'),
        'hospital'    => env('DEMO_HOSPITAL_EMAIL', 'demo-hastane@medagama.test'),
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
