<?php

return [

    /*
     * Çeviri motoru. Boşsa içerik çevirisi KAPALIDIR: gönderiler ve mesajlar
     * yazıldıkları dilde görünür, arayüzdeki toplu çeviri düğmesi pasif olur.
     *
     * Karar (2026-08-12): çeviri KENDİ SUNUCUMUZDA çalışan bir dil modeliyle
     * yapılacak. Hasta mesajları sağlık verisi olduğu için dış çeviri servisi
     * kullanılmayacak. Model GPU gerektiriyor; sunucu geldiğinde 'local_llm'
     * olarak ayarlanacak.
     */
    'engine' => env('TRANSLATION_ENGINE'),

    /*
     * Çevrilebilecek diller — arayüzün desteklediği dillerle aynı.
     */
    'languages' => ['tr', 'en', 'de', 'ar', 'ru', 'fr', 'es', 'it', 'az'],

    /*
     * Mesaj çevirisinde arayüz "otomatik çeviri" uyarısı gösterir ve özgün
     * metne dönme imkânı sunar. Tıbbi yazışmada yanlış bir çevirinin fark
     * edilmeden kalması ciddi sonuç doğurabilir; özgün metin daima erişilebilir.
     */
    'warn_on_messages' => true,

    /*
     * Tıbbi bağlam bildirimi: motora "bu tıbbi bir metindir, terimleri koru"
     * denir. Sıradan çeviri "şikayet", "takip", "ağrı" gibi kelimeleri günlük
     * anlamıyla çevirip yanlış sonuç üretebiliyor.
     */
    'medical_context' => true,

];
