/**
 * Arama/filtreleme için metin normalleştirme.
 *
 * SORUN: Türkçede noktalı ve noktasız i AYRI harflerdir.
 *
 *   "Isparta".toLowerCase()  →  "isparta"   (JavaScript I'yı noktalı i yapar)
 *   kullanıcı "ıs" yazar     →  "ıs"        (noktasız ı, U+0131)
 *   "isparta".includes("ıs") →  false       → "Sonuç yok"
 *
 * Kullanıcı Isparta'yı doğru yazdığı hâlde bulamıyordu.
 *
 * Aksan ayrıştırma (NFD) bunu ÇÖZMEZ: ş, ğ, ü, ö, ç birer taban harf artı
 * birleşik işaret olarak ayrışır, ama "ı" (U+0131) ayrışmaz — kendi başına
 * bir taban harftir, "i eksi nokta" değildir. Aynı şekilde "İ" (U+0130)
 * ayrıştığında geriye noktalı I kalır.
 *
 * ÇÖZÜM: Türkçe harfleri küçültmeden ÖNCE ASCII karşılıklarına katla. Böylece
 * hangi biçimde yazılırsa yazılsın aynı anahtara iner:
 *
 *   Isparta / ısparta / İsparta / isparta  →  hepsi "isparta"
 *   Şişli / sisli / ŞİŞLİ                  →  hepsi "sisli"
 *
 * Bu bilinçli olarak GEVŞEK bir eşleşmedir: arama kutusunda kullanıcıyı
 * doğru yazıma zorlamak yerine ne yazarsa yazsın bulmasını istiyoruz.
 * Görüntülenen metin değişmez — yalnızca karşılaştırma anahtarı üretilir.
 */

/** Türkçe harf → ASCII karşılığı. Büyük/küçük ayrı, çünkü katlama küçültmeden önce yapılır. */
const TR_ASCII = {
  'ı': 'i', 'I': 'i', 'İ': 'i', 'i': 'i',
  'ş': 's', 'Ş': 's',
  'ğ': 'g', 'Ğ': 'g',
  'ü': 'u', 'Ü': 'u',
  'ö': 'o', 'Ö': 'o',
  'ç': 'c', 'Ç': 'c',
};

/**
 * Karşılaştırma anahtarı üretir. Ekranda gösterilecek metin için KULLANMAYIN.
 *
 * @param {unknown} deger
 * @returns {string}
 */
export function aramaAnahtari(deger) {
  if (deger === null || deger === undefined) return '';

  return String(deger)
    // 1) Türkçe harfleri katla — küçültmeden ÖNCE, çünkü toLowerCase
    //    "I"yı noktalı "i" yapıp bilgiyi kaybediyor.
    .replace(/[ıIİişŞğĞüÜöÖçÇ]/g, (h) => TR_ASCII[h] || h)
    .toLowerCase()
    // 2) Kalan diğer dillerin aksanları (é, ñ, å ...) — bunlar ayrışabiliyor.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // 3) Fazla boşlukları sadeleştir ki "iki  boşluk" da eşleşsin.
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * `metin` içinde `sorgu` geçiyor mu — Türkçe duyarlı.
 *
 * @param {unknown} metin
 * @param {unknown} sorgu
 * @returns {boolean}
 */
export function aramaIceriyor(metin, sorgu) {
  const s = aramaAnahtari(sorgu);
  if (!s) return true;             // boş sorgu her şeyi eşler
  return aramaAnahtari(metin).includes(s);
}

/**
 * `metin` `sorgu` ile başlıyor mu — Türkçe duyarlı.
 * Sıralamada "başlayanlar önce" için kullanılıyor.
 */
export function aramaBasliyor(metin, sorgu) {
  const s = aramaAnahtari(sorgu);
  if (!s) return false;
  return aramaAnahtari(metin).startsWith(s);
}

export default aramaAnahtari;
