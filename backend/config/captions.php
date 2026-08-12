<?php

return [

    /*
     * Konuşmayı yazıya çeviren motor. Boşsa alt yazı KAPALIDIR ve arayüz
     * düğmeyi pasif gösterir — yarım çalışan bir alt yazı, hiç olmamasından
     * daha kötüdür (hasta yanlış çeviriye güvenir).
     *
     * Gerçek zamanlı çalışması GPU gerektirir; sunucu alınınca 'whisper'
     * olarak ayarlanacak.
     */
    'engine' => env('CAPTIONS_ENGINE'),

    /*
     * Çeviri motoru. Kendi sunucumuzda LibreTranslate planlanıyor.
     * Boşsa yalnızca konuşulan dilde alt yazı gösterilir, çeviri yapılmaz.
     */
    'translator' => env('CAPTIONS_TRANSLATOR'),

    /*
     * ALT YAZI METNİ SAKLANMAZ.
     *
     * Karar (2026-08-12): metin görüşme bitince yok olur, hiçbir yere
     * yazılmaz. Bu yüzden transkript için tablo/model YOKTUR — sonradan
     * "sadece log'a yazalım" gibi bir eklemenin de önünü kesmek için burada
     * açıkça belirtilmiştir. Saklama istenirse tıbbi kayıt sayılır ve ayrı
     * izin + saklama süresi kararı gerekir.
     */
    'store_transcripts' => false,

    /*
     * Alt yazı açılabilmesi için KARŞI TARAFIN onayı şarttır: birinin sesinin
     * sunucuda işlenmesine diğeri tek başına karar veremez.
     */
    'require_peer_consent' => true,

    /*
     * Desteklenen diller. Kullanıcının profil dili buradaysa alt yazı o dile
     * çevrilir; değilse konuşulan dilde gösterilir.
     */
    'languages' => ['tr', 'en', 'de', 'ar', 'ru', 'fr', 'es'],

];
