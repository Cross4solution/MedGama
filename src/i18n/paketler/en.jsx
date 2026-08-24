'use client';

// en sözlüğü — YALNIZ /en rotasında yüklenir.
//
// İngilizce uzun süre `src/i18n/index.js` içinde STATİK duruyordu, çünkü
// `fallbackLng` o. Ölçüldü: bu, Türkçe bir sayfanın 47 KB gzip İngilizce metin
// indirmesi demekti — hiç gösterilmeyen, yalnızca "bir anahtar eksik olursa"
// diye taşınan bir sigorta. Sekiz dil zaten böyle bölünmüştü; İngilizce de
// artık aynı yoldan gidiyor.
//
// Sigortanın yerini `ceviriAnahtarlari` ölçütü aldı: dokuz dilin anahtar kümesi
// Türkçeyle bire bir eşleşiyor, yani düşülecek bir eksik anahtar yok. O ölçüt
// kırmızı yanarsa buradaki karar da yeniden düşünülmeli.
import i18n from '../index';
import sozluk from '../locales/en.json';

i18n.addResourceBundle('en', 'translation', sozluk, true, true);

export default function PaketEN() {
  return null;
}
