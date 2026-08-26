/**
 * Zorla çıkışta (401) nereye gidileceğini hesaplar.
 *
 * Eskiden tek satırdı: `window.location.href = '/'`. Üç şey yanlıştı.
 *
 *   1. Hedef PAZARLAMA ana sayfasıydı. CRM'de çalışan bir klinik, jetonu
 *      düştüğü anda "Dünyanın #1 Sağlık Portalı" başlığına düşüyordu —
 *      hiçbir açıklama olmadan. Ölçüldü: beş korumalı ekranın beşi de.
 *   2. Dil düşüyordu. `/tr/crm` → `/`, yani Türkçe okuyan kullanıcı
 *      varsayılan dile atılıyordu.
 *   3. Kaldığı yer kayboluyordu. Tekrar giriş yapan kullanıcı rolünün
 *      varsayılan ekranına düşüyor, yarım kalan işine dönemiyordu.
 */

/** Uygulamanın giriş sayfaları. */
const ROL_GIRISI = {
  clinic: '/clinic-login',
  clinicOwner: '/clinic-login',
  doctor: '/doctor-login',
  hospital: '/hospital-login',
};

/**
 * Dönüş adresi GÜVENLİ mi?
 *
 * `next` parametresi adres çubuğundan geliyor, yani saldırganın elinde.
 * Sadece bu sitenin içindeki yollar kabul ediliyor: tek eğik çizgiyle
 * başlayan, protokolü olmayan yollar. `//kotu.site` protokolsüz bir MUTLAK
 * adres — tarayıcı onu dış siteye götürür, o yüzden ayrıca eleniyor.
 */
export function guvenliDonusYolu(aday) {
  if (typeof aday !== 'string' || aday === '') return null;
  if (!aday.startsWith('/')) return null;
  if (aday.startsWith('//') || aday.startsWith('/\\')) return null;
  if (/^\s*[a-z][a-z0-9+.-]*:/i.test(aday)) return null;

  return aday;
}

/** Yoldaki dil önekini döndürür ('/tr/crm' → 'tr'), yoksa null. */
export function yoldakiDil(yol, destekenler) {
  const ilk = String(yol || '').split('/')[1] || '';

  return destekenler.includes(ilk) ? ilk : null;
}

/**
 * Zorla çıkış hedefi.
 *
 * @param {string} yol      Kullanıcının bulunduğu yol (window.location.pathname)
 * @param {string} rolId    Çıkıştan ÖNCEKİ rol; hangi giriş sayfası olduğunu belirler
 * @param {string[]} diller Desteklenen dil kodları
 */
export function cikisHedefi(yol, rolId, diller) {
  const dil = yoldakiDil(yol, diller);
  const giris = ROL_GIRISI[rolId] || '/login';
  const onek = dil ? `/${dil}` : '';

  const parametreler = new URLSearchParams({ expired: '1' });

  // Giriş sayfasının kendisine dönmek anlamsız; ana sayfa da öyle.
  // Süzgeç `login` ile BİTEN her yolu eliyor: hem `/tr/login` hem
  // `/tr/clinic-login`. Yalnız tireli adları arayan bir kontrol ilkini
  // kaçırıyordu.
  const donus = guvenliDonusYolu(yol);
  const girisSayfasi = /(^|\/)[a-z-]*login\/?$/i.test(donus || '');
  const anaSayfa = donus === '/' || /^\/[a-z]{2}\/?$/.test(donus || '');

  if (donus && !girisSayfasi && !anaSayfa) {
    parametreler.set('next', donus);
  }

  return `${onek}${giris}?${parametreler.toString()}`;
}
