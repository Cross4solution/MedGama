'use client';

// fr sözlüğü — YALNIZ /fr rotasında yüklenir.
//
// Ayrıntı `src/i18n/index.js` başındaki nota yazılı: dokuz dil hep birlikte
// paketleniyordu. Bu dosya kendi JSON'unu statik içe aktarıyor, yani modül
// değerlendiği an sözlük hazır — hidrasyonda beklenen bir şey yok.
import i18n from '../index';
import sozluk from '../locales/fr.json';

i18n.addResourceBundle('fr', 'translation', sozluk, true, true);

export default function PaketFR() {
  return null;
}
