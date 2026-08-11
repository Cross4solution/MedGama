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

/** Verilen takvim günü bugün mü? */
export function isSameLocalDay(value, other = new Date()) {
  const a = parseLocalDate(value);
  const b = parseLocalDate(other);
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
