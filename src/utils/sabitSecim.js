/**
 * Bir listeden, verilen anahtara göre HEP AYNI ögeyi seçer.
 *
 * `Math.random()` render gövdesinde çağrıldığında her yeniden çizimde başka bir
 * sonuç veriyor. Klinik listesinde ölçüldü: arama kutusuna tek harf yazıp
 * silmek, hiç değişmeyen bir kliniğin fotoğrafını üç kez değiştiriyordu
 * (`caroline` → `petr-magera` → `deliberate-directions`). Kullanıcı için bu,
 * listenin altından oynaması demek; ayrıca her seferinde başka bir dosya
 * indiriliyor.
 *
 * Sunucuda render edilen sayfalarda etkisi daha sert: sunucu bir ögeyi seçiyor,
 * tarayıcı devralırken başkasını seçiyor ve işaretleme uyuşmuyor.
 *
 * Buradaki karma kriptografik değil, olması da gerekmiyor — tek istenen, aynı
 * anahtarın hep aynı dizine düşmesi ve dizinin liste boyunca makul dağılması.
 */

/** Basit, kararlı dize karması (FNV-1a'nın 32 bitlik hâli). */
function karma(dize) {
  let h = 0x811c9dc5;

  for (let i = 0; i < dize.length; i += 1) {
    h ^= dize.charCodeAt(i);
    // 32 bitte kalması için çarpım toplama olarak açıldı.
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  return h >>> 0;
}

/**
 * @param {string} anahtar Seçimi belirleyen kimlik (klinik id'si, dizin, ad…).
 * @param {Array} liste Seçilecek ögeler.
 * @returns {*} Aynı anahtar için hep aynı öge; liste boşsa `undefined`.
 */
export default function sabitSecim(anahtar, liste) {
  if (!Array.isArray(liste) || liste.length === 0) return undefined;

  // Anahtarsız çağrı sessizce rastgeleye dönmesin: ilk ögeye düşsün.
  if (anahtar === undefined || anahtar === null || anahtar === '') return liste[0];

  return liste[karma(String(anahtar)) % liste.length];
}
