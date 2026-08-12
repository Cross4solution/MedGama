<?php

return [

    /*
     * Etkin sağlayıcı. Boşsa tahsilat KAPALIDIR (UnconfiguredProvider devrede)
     * ve ödeme denemesi açık bir hata verir — sessizce "başarılı" saymaz.
     * Sağlayıcı seçilince: 'iyzico' | 'stripe' | 'paytr'
     */
    'provider' => env('PAYMENT_PROVIDER'),

    /*
     * Pazaryeri komisyonu. Medagama tahsil eder, komisyonu keser, kalanı
     * kliniğe hakediş olarak aktarır. Oran tahsilat anında kayda dondurulur;
     * sonradan değişse bile geçmiş ödemeler etkilenmez.
     */
    'commission_rate' => (float) env('PAYMENT_COMMISSION_RATE', 0.15),

    /*
     * Ödeme penceresi (dakika). Hasta ödemeyi tamamlayana kadar randevu saati
     * kilitli tutulur; süre dolarsa slot serbest bırakılır. Çok kısa olursa
     * hasta 3D Secure adımında yetişemez, çok uzun olursa saat boş yere bloke
     * kalır.
     */
    'hold_minutes' => (int) env('PAYMENT_HOLD_MINUTES', 15),

    /*
     * İade kuralı — MÜŞTERİ ONAYI BEKLİYOR.
     * Varsayılan sektörde en yaygın olan: randevuya bu süreden fazla varsa tam
     * iade, azsa iade yok. Müşteri farklı bir kural isterse tek değer değişir.
     */
    'refund_window_hours' => (int) env('PAYMENT_REFUND_WINDOW_HOURS', 24),

    /*
     * Doktor/klinik kaynaklı iptalde her zaman tam iade yapılır: hastanın
     * kusuru olmayan bir iptalde parayı tutmak hem haksız hem itiraz sebebi.
     */
    'always_refund_on_provider_cancel' => true,

];
