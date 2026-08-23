<?php

namespace App\Support;

use App\Models\User;

/**
 * Bildirim tercihleri — tek karar noktası.
 *
 * Tercihler kullanıcıda saklanıyordu ama 17 bildirimden yalnızca biri onlara
 * bakıyordu: kullanıcı "e-posta istemiyorum" dese de almaya devam ediyordu.
 * Artık seçimlik bildirimlerin tamamı buradan geçiyor.
 *
 * Ayrım kasıtlı: randevu onayı/iptali/hatırlatması gibi HİZMETİN KENDİSİNE ait
 * bildirimler kapatılamaz — hastanın bunları bilmemesi doğrudan zarar üretir
 * (randevuya gelmemek, iptalden habersiz yola çıkmak). Beğeni, yorum, kampanya
 * gibi olanlar seçimliktir. KVKK açısından da birinciler sözleşmenin ifası,
 * ikinciler ayrı tercih gerektiren gruptur.
 */
class NotificationPreferences
{
    /**
     * Seçimlik tercihler ve varsayılanları.
     * Anahtar burada YOKSA bildirim zorunludur ve kapatılamaz.
     */
    public const AYARLAR = [
        // E-posta gönderimi (uygulama içi bildirim yine düşer)
        'email_review_received' => true,   // doktora: yeni değerlendirme
        'email_review_response' => true,   // hastaya: değerlendirmesine yanıt
        'email_support'         => true,   // destek talebi yanıtı

        // Uygulama içi sosyal bildirimler (beğeni, yorum)
        'inapp_social'          => true,

        // Bildirim sesi. Klinikte hasta karşısındayken sesin susturulabilmesi
        // gerekiyor; tercih cihazda değil hesapta tutulur ki kullanıcı hangi
        // bilgisayara oturursa otursun aynı davranışı bulsun.
        'sound_enabled'         => true,

        // İçerik çevirisi: gönderi, yorum ve mesajlar kullanıcının diline
        // çevrilsin mi. Varsayılan KAPALI — içerik yazıldığı dilde kalır;
        // kullanıcı isterse tek düğmeyle hepsini kendi diline çevirir.
        'translate_content'     => false,
    ];

    /**
     * Kullanıcı bu bildirimi istiyor mu?
     * Bilinmeyen anahtar = zorunlu bildirim = her zaman true.
     */
    public static function ister(?object $notifiable, string $anahtar): bool
    {
        if (!array_key_exists($anahtar, self::AYARLAR)) {
            return true; // zorunlu
        }

        $varsayilan = self::AYARLAR[$anahtar];

        if (!$notifiable instanceof User) {
            return $varsayilan;
        }

        $tercihler = self::oku($notifiable);

        return (bool) ($tercihler[$anahtar] ?? $varsayilan);
    }

    /**
     * Kullanıcının tercihleri, eksikler varsayılanla tamamlanmış hâlde.
     *
     * Sütun `encrypted:array` cast'li: okurken zaten dizi geliyor. Eski kod
     * bunu bir kez daha json_decode etmeye çalışıyordu (PHP 8'de TypeError) —
     * tercih ekranı bu yüzden çalışmıyordu.
     */
    public static function oku(User $user): array
    {
        return array_merge(self::AYARLAR, self::hamOku($user));
    }

    /**
     * Sütunun okunabilen kısmı; okunamıyorsa boş dizi.
     *
     * Sütun `encrypted:array` cast'li ve cast ÇÖZÜLEMEYEN bir değerde
     * istisna atıyor. Ölçüldü: sütunda düz JSON, boş dizge ya da bozuk bir
     * şifre metni olan bir kullanıcıda
     *
     *     GET  /api/auth/profile/notification-preferences  → 500
     *     PUT  /api/auth/profile/notification-preferences  → 500
     *     GET  /api/auth/me                                → 500
     *     GET  /api/translation/status                     → 500
     *
     * Yani hesap kullanılamaz hâle geliyor: `/auth/me` düştüğü için uygulama
     * açılmıyor bile. Böyle bir değer cast eklenmeden önce yazılmış her
     * kayıtta ya da APP_KEY değişmiş bir kurulumda bulunabilir.
     *
     * Eskiden burada `is_string($ham)` toleransı vardı ama hiç çalışmıyordu:
     * istisna, o satıra gelinmeden ÖNCE atılıyor. Ham değere cast'i atlayarak
     * bakmak gerekiyor.
     *
     * Tercihler kaybolursa kullanıcı varsayılanlara döner — sinir bozucu ama
     * hesabın açılmamasının yanında önemsiz.
     */
    private static function hamOku(User $user): array
    {
        try {
            $ham = $user->notification_preferences;
        } catch (\Throwable) {
            // Cast'i atla: değer şifresiz yazılmış eski bir JSON olabilir.
            $ham = $user->getRawOriginal('notification_preferences');
        }

        if (is_string($ham)) {
            $ham = json_decode($ham, true) ?: [];
        }

        return is_array($ham) ? $ham : [];
    }

    /**
     * Yalnızca tanımlı anahtarları, boolean'a çevirerek yazar.
     * Arayüzden gelen tanımsız alanlar sessizce yok sayılır.
     */
    public static function yaz(User $user, array $gelen): array
    {
        $temiz = [];
        foreach (self::AYARLAR as $anahtar => $varsayilan) {
            if (array_key_exists($anahtar, $gelen)) {
                $temiz[$anahtar] = filter_var($gelen[$anahtar], FILTER_VALIDATE_BOOL);
            }
        }

        $yeni = array_merge(self::oku($user), $temiz);

        // Kaydetmeden önce sütunun ESKİ değeri unutuluyor.
        //
        // Eloquent, hangi alanların değiştiğini bulurken eski değeri de
        // cast'ten geçiriyor; çözülemeyen bir değerde bu istisna atıyor ve
        // yazma isteği 500 veriyordu — okuma düzeltilse bile. Eskisini null
        // sayarak hem karşılaştırma güvenli oluyor hem de kayıt, geçerli ve
        // şifreli bir değerle onarılıyor.
        $nitelikler = $user->getAttributes();
        $nitelikler['notification_preferences'] = null;
        $user->setRawAttributes($nitelikler, true);

        $user->notification_preferences = $yeni;
        $user->save();

        return $yeni;
    }
}
