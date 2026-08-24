'use client';

// es sözlüğü — YALNIZ /es rotasında yüklenir.
//
// Ayrıntı `src/i18n/index.js` başındaki nota yazılı: dokuz dil hep birlikte
// paketleniyordu. Bu dosya kendi JSON'unu statik içe aktarıyor, yani modül
// değerlendiği an sözlük hazır — hidrasyonda beklenen bir şey yok.
import i18n from '../index';
import sozluk from '../locales/es.json';

i18n.addResourceBundle('es', 'translation', sozluk, true, true);

export default function PaketES() {
  return null;
}
