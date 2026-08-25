import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Liste kartlarındaki fotoğraflar iyileştiriciden geçmeli.
 *
 * Klinik ve tedavi listeleri düz `<img>` kullanıyordu. Kart yuvası ekranda
 * 259×176 piksel; kaynak dosyalar 720 piksellik JPEG'ler. Ölçüldü —
 * `/tr/browse/clinics` sayfası 244 KB görsel indiriyordu ve bunun 189 KB'si
 * yalnızca YER TUTUCU fotoğraflardı (fotoğrafı olmayan klinikler için).
 *
 * `next/image` ile aynı sayfa 75 KB: 123 KB'lik dosya 22 KB'ye, 66 KB'lik
 * 9 KB'ye indi. Kap zaten `relative h-44` olduğu için `fill` doğrudan çalıştı;
 * aynı kalıp `PopularClinicsShowcase` içinde zaten kullanılıyordu.
 *
 * Uzak avatarlar da iyileştiriciden geçiyor ve `next.config.js` izin listesi
 * hem arka uç kökenini hem yerel geliştirmeyi kapsıyor. Yine de kırılma yolu
 * bırakıldı: `onError` yerel yer tutucuya düşüyor. Aksi hâlde tek bir 404,
 * kartı boş bir dikdörtgene çevirirdi — ve `next/image` hatada sessizdir.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklamalar `<img` ve dosya adlarını METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .join('\n');
}

const KART_EKRANLARI = [
  'src/screens/BrowseClinics.jsx',
  'src/screens/BrowseTreatments.jsx',
];

test('kart fotoğrafları next/image kullanıyor', () => {
  for (const dosya of KART_EKRANLARI) {
    const kod = yorumsuz(oku(dosya));

    assert.match(kod, /import Image from 'next\/image'/, `${dosya}: next/image içe aktarılmamış`);
    assert.match(kod, /<Image\b[\s\S]{0,200}?fill/, `${dosya}: kart görseli <Image fill> ile çizilmiyor`);
    assert.match(kod, /sizes="/, `${dosya}: sizes yok — her ekrana aynı büyüklük gider`);
  }
});

test('düz img ile 720 piksellik dosya çizilmiyor', () => {
  // Geri dönüş tek satır: `<Image>` yerine `<img src={img}>` yazmak yeter ve
  // sayfa yine çalışır — sadece üç kat ağır olur.
  for (const dosya of KART_EKRANLARI) {
    const kod = yorumsuz(oku(dosya));

    assert.doesNotMatch(
      kod,
      /<img\s[\s\S]{0,120}?src=\{img\}/,
      `${dosya}: kart görseli yeniden düz <img> ile çiziliyor`,
    );
  }
});

test('kırılan görsel kartı boş bırakmıyor', () => {
  // `next/image` hatada sessiz: 404 alan bir avatar, kartta boş bir dikdörtgen
  // olarak kalır. Yerel yer tutucuya düşme yolu bu yüzden var.
  for (const dosya of KART_EKRANLARI) {
    const kod = yorumsuz(oku(dosya));

    assert.match(kod, /onError=\{\(\) => setGorselHatasi\(true\)\}/, `${dosya}: hata yolu yok`);
    assert.match(kod, /gorselHatasi \? FALLBACK_IMAGES\[0\]/, `${dosya}: hatada yer tutucuya düşülmüyor`);
  }
});

test('yer tutucu fotoğraflar yerinde ve makul boyutta', () => {
  // Bunlar iyileştiriciye giren KAYNAK dosyalar. Çok büyürlerse iyileştirme
  // maliyeti ve ilk üretim süresi artar; çok küçülürlerse retina ekranda
  // bulanıklaşırlar (kart 259 piksel → 2× için ~520 gerekiyor).
  const kod = yorumsuz(oku('src/screens/BrowseClinics.jsx'));
  const liste = kod.match(/const FALLBACK_IMAGES = \[([\s\S]*?)\]/);

  assert.ok(liste, 'yer tutucu listesi bulunamadı');

  const yollar = [...liste[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assert.ok(yollar.length >= 3, `yer tutucu sayısı az: ${yollar.length}`);

  for (const yol of yollar) {
    const tam = path.join(uygulamaKok, 'public', yol);
    const kb = Math.round(statSync(tam).size / 1024);

    assert.ok(kb <= 200, `${yol} — ${kb} KB, kaynak dosya için fazla büyük`);
  }
});
