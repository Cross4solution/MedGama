/**
 * Takvim günü (randevu tarihi gibi) işlemleri.
 *
 * Sorun: `new Date('2026-08-11')` ve `new Date('2026-08-11T00:00:00Z')` UTC gece
 * yarısı olarak çözümlenir. Saat dilimi geride olan bir kullanıcı (ör. ABD, UTC-5)
 * bunu 10 Ağustos 19:00 olarak görür → randevu BİR GÜN ÖNCE görünür.
 *
 * Randevu tarihi bir "an" değil, bir takvim günüdür. Bu yüzden gün/ay/yıl
 * bileşenlerini alıp YEREL tarih üretiriz; saat dilimi kaydırması olmaz.
 */

/** "2026-08-11" veya "2026-08-11T00:00:00.000000Z" → yerel Date (o günün 00:00'ı). */
export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Takvim gününü kullanıcının diline göre yazar. */
export function formatLocalDate(value, locale = 'tr-TR', options) {
  const d = parseLocalDate(value);
  if (!d) return '';
  return d.toLocaleDateString(locale, options || { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Randevu tarihi + saatini tek bir yerel Date'e birleştirir ("10:45" → o günün 10:45'i). */
export function parseLocalDateTime(dateValue, timeValue) {
  const d = parseLocalDate(dateValue);
  if (!d) return null;
  const [h, min] = String(timeValue || '00:00').split(':');
  d.setHours(Number(h) || 0, Number(min) || 0, 0, 0);
  return d;
}

// ── Randevu saati: saat dilimi farkındalıklı gösterim ──────────────────────
//
// Randevu artık mutlak bir an olarak da geliyor (`starts_at`, UTC) ve duvar
// saatinin ait olduğu saat dilimi adıyla birlikte (`timezone`, ör.
// "Europe/Istanbul"). Sadece "14:00" göstermek yurt dışındaki hasta için
// belirsiz: kimin 14:00'ü? Bu yüzden saati izleyenin KENDİ saat diliminde
// gösteriyoruz, taraflar farklıysa kliniğin saatini de yazıyoruz.

/** Tarayıcının saat dilimi ("Europe/Berlin"). */
export function viewerTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Bir anı istenen saat diliminde "HH:MM" olarak yazar. */
export function formatTimeInZone(instant, timeZone, locale = 'tr-TR') {
  if (!instant) return '';
  const d = instant instanceof Date ? instant : new Date(instant);
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone,
    }).format(d);
  } catch {
    return '';
  }
}

/** Bir anı istenen saat diliminde tarih olarak yazar. */
export function formatDateInZone(instant, timeZone, locale = 'tr-TR', options) {
  if (!instant) return '';
  const d = instant instanceof Date ? instant : new Date(instant);
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric', month: 'long', year: 'numeric', timeZone, ...(options || {}),
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * Randevunun gösterilecek saat bilgisi.
 *
 * Dönen: { time, date, zoneLabel, providerTime, showProvider }
 * - time/date : izleyenin kendi saat diliminde
 * - providerTime + showProvider : izleyen sağlayıcıdan farklı bir saat
 *   dilimindeyse kliniğin yerel saati (ör. "13:00 · klinikte 14:00")
 *
 * `starts_at` yoksa (çok eski kayıt) duvar saatine düşer — o durumda karşılaştırma
 * yapılamayacağı için sağlayıcı saati gösterilmez.
 */
export function appointmentTimeDisplay(appointment, locale = 'tr-TR') {
  const izleyenTz = viewerTimezone();
  const saglayiciTz = appointment?.timezone || null;
  const an = appointment?.starts_at || null;

  if (!an) {
    return {
      time: String(appointment?.appointment_time || '').slice(0, 5),
      date: formatLocalDate(appointment?.appointment_date, locale),
      zoneLabel: '',
      providerTime: '',
      showProvider: false,
    };
  }

  const providerTime = saglayiciTz ? formatTimeInZone(an, saglayiciTz, locale) : '';
  const time = formatTimeInZone(an, izleyenTz, locale);

  return {
    time,
    date: formatDateInZone(an, izleyenTz, locale),
    zoneLabel: izleyenTz,
    providerTime,
    // Aynı saat diliminde olan kullanıcıyı ikinci bir saatle meşgul etme.
    showProvider: Boolean(saglayiciTz && saglayiciTz !== izleyenTz && providerTime && providerTime !== time),
  };
}

/** Verilen takvim günü bugün mü? */
export function isSameLocalDay(value, other = new Date()) {
  const a = parseLocalDate(value);
  const b = parseLocalDate(other);
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
