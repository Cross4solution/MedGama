'use client';

// Rotadaki dilin sözlüğünü yükleyen sınır.
//
// Dokuz dilin sözlüğü tek pakette gidiyordu ve her sayfada iniyordu. İki yol
// denendi ve ikisi de bölmedi: düz `import` ile sekiz paket, hangisinin render
// edildiğine bakılmaksızın yerleşim yığınına giriyor; `next/dynamic` de sunucu
// bileşeninde aynı sonucu veriyor (ölçüldü: yerleşim yığını 1345 KB, içinde
// Fransızca da Arapça da var).
//
// Bölen yer istemci sınırı: `next/dynamic` burada gerçek `React.lazy` kuruyor,
// webpack her dile ayrı yığın veriyor. Sunucu render sırasında hangi yığına
// dokunduysa Next onu sayfanın ön yükleme kümesine koyuyor, dolayısıyla yığın
// hidrasyondan önce elde oluyor.
import dynamic from 'next/dynamic';

const PAKETLER = {
  ar: dynamic(() => import('@/i18n/paketler/ar')),
  en: dynamic(() => import('@/i18n/paketler/en')),
  az: dynamic(() => import('@/i18n/paketler/az')),
  de: dynamic(() => import('@/i18n/paketler/de')),
  es: dynamic(() => import('@/i18n/paketler/es')),
  fr: dynamic(() => import('@/i18n/paketler/fr')),
  it: dynamic(() => import('@/i18n/paketler/it')),
  ru: dynamic(() => import('@/i18n/paketler/ru')),
  tr: dynamic(() => import('@/i18n/paketler/tr')),
};

export default function SozlukPaketi({ locale }) {
  // İngilizce de artık kendi paketinde: statik dururken Türkçe bir sayfaya
  // 47 KB gzip İngilizce metin iniyordu (bkz. `paketler/en.jsx`).
  const Paket = PAKETLER[locale];

  return Paket ? <Paket /> : null;
}
