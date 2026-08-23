/**
 * Bildirim başlığı — tek karar noktası.
 *
 * Arka uçtaki 21 bildirim sınıfının HEPSİ `toArray()` içinde başlığı sabit
 * İngilizce üretiyor ("Appointment Confirmed"). E-postalar kullanıcının
 * diline çevriliyor, uygulama içi bildirimler çevrilmiyordu.
 *
 * Üç ayrı ekran (bildirimler sayfası, başlıktaki zil, CRM zili) aynı satırı
 * ayrı ayrı yazmıştı ve üçü de sunucu başlığını çevrilmiş etiketin ÖNÜNE
 * koyuyordu:
 *
 *     data.title || t(meta.labelKey)      // sunucu başlığı hep kazanır
 *
 * Sonuç: arayüzün tamamı Türkçeyken zil bildirimi İngilizce. Kural burada
 * tek yerde duruyor ki üç ekran ayrışmasın.
 */

/**
 * Çevirisi olan bildirim türleri.
 *
 * `notifications.type.<tür>` anahtarı yönlendirilen 9 dilin hepsinde var.
 * Bu listede OLMAYAN bir tür için sunucunun başlığı kullanılır — genel
 * "Bildirim" etiketine düşmek bilgi kaybı olurdu.
 */
export const NOTIFICATION_TYPES = [
  'appointment_booked',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
  'new_review',
  'review_response',
  'review_approved',
  'review_rejected',
  'review_hidden',
  'verification_approved',
  'verification_info_requested',
  'verification_rejected',
  'post_liked',
  'post_commented',
  'new_chat_message',
  'ticket_received',

  // Arka uç bu türleri de üretiyordu ama liste onları tanımıyordu: tanınmayan
  // tür sunucunun SABİT İNGİLİZCE başlığına düşüyor. Yani Türk kullanıcı
  // "Password Changed", "Invoice Issued", "Video Call Starting" görüyordu —
  // arayüzün geri kalanı Türkçeyken. Yedek çalıştığı için bozuk görünmüyordu.
  'appointment_rescheduled',
  'invoice_issued',
  'password_changed',
  'video_call_starting',
  'welcome',
  'ticket_reply',
  'new_ticket_admin',
];

export const DEFAULT_TITLE_KEY = 'notifications.type.default';

/**
 * Bir bildirimin gösterilecek başlığı.
 *
 * @param {object} data  Bildirim yükü (`notification.data`)
 * @param {function} t   i18next çeviri fonksiyonu
 * @returns {string}
 */
export function notificationTitle(data, t) {
  const tur = data?.type || '';

  if (NOTIFICATION_TYPES.includes(tur)) {
    return t(`notifications.type.${tur}`);
  }

  // Tanınmayan tür: sunucunun başlığı daha bilgilendirici.
  return data?.title || t(DEFAULT_TITLE_KEY);
}
