#!/usr/bin/env node
/**
 * KODDA ÇAĞRILAN HER ANAHTAR TÜRKÇE DOSYADA VAR MI?
 *
 * Anahtar adını elle yazmak sessiz bir hata kaynağı: yanlış yazılan anahtar
 * derlemeyi bozmaz, denetime takılmaz, sadece ekranda ya boş ya İngilizce
 * görünür. Modül düzeyindeki sabitleri anahtara çevirirken (labelKey/titleKey)
 * bu risk daha da büyüyor, çünkü anahtar tanımla kullanım ayrı satırlarda.
 *
 * Yedeği olan çağrılar — t('a.b', 'Fallback') — burada AYRI tutuluyor: eksik
 * olsalar da ekranda okunabilir bir metin çıkıyor. Yedeksiz olanlar ise
 * doğrudan arıza.
 *
 * Kullanım:  node scripts/eksik-anahtar-denetimi.js
 * Çıkış kodu 1 = yedeksiz eksik anahtar var.
 */

const fs = require('fs');
const path = require('path');

const KOK = path.join(__dirname, '..', 'src');
const TR = path.join(KOK, 'i18n', 'locales', 'tr.json');

const tr = JSON.parse(fs.readFileSync(TR, 'utf8'));

function cozumle(anahtar) {
  let c = tr;
  for (const p of anahtar.split('.')) {
    if (c === null || typeof c !== 'object' || !(p in c)) return undefined;
    c = c[p];
  }
  return typeof c === 'string' ? c : undefined;
}

function dosyalar(dizin, liste = []) {
  for (const ad of fs.readdirSync(dizin)) {
    const tam = path.join(dizin, ad);
    if (fs.statSync(tam).isDirectory()) {
      if (ad === 'node_modules' || ad === 'i18n') continue;
      dosyalar(tam, liste);
    } else if (/\.jsx?$/.test(ad)) liste.push(tam);
  }
  return liste;
}

const yedeksiz = [];
const yedekli = [];

for (const dosya of dosyalar(KOK)) {
  const metin = fs.readFileSync(dosya, 'utf8');
  const goreli = path.relative(path.join(__dirname, '..'), dosya);

  // t('anahtar')  /  t('anahtar', 'yedek')
  for (const m of metin.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*(,)?/g)) {
    const [, anahtar, virgul] = m;
    if (!anahtar.includes('.')) continue;
    if (cozumle(anahtar) !== undefined) continue;
    (virgul ? yedekli : yedeksiz).push({ goreli, anahtar });
  }

  // labelKey: 'anahtar' / titleKey: 'anahtar' — tanım tarafı
  for (const m of metin.matchAll(/\b(?:labelKey|titleKey)\s*:\s*'([a-zA-Z0-9_.]+)'/g)) {
    const anahtar = m[1];
    if (cozumle(anahtar) !== undefined) continue;
    yedeksiz.push({ goreli, anahtar });
  }
}

const benzersiz = (l) => [...new Map(l.map((x) => [x.anahtar + x.goreli, x])).values()];

const y1 = benzersiz(yedeksiz);
const y2 = benzersiz(yedekli);

console.log(`Yedeksiz eksik anahtar: ${y1.length}`);
for (const x of y1) console.log(`  ${x.anahtar}   (${x.goreli})`);

console.log(`\nYedekli eksik anahtar: ${y2.length}  — ekranda yedek metin görünür`);
for (const x of y2.slice(0, 20)) console.log(`  ${x.anahtar}   (${x.goreli})`);
if (y2.length > 20) console.log(`  ... ve ${y2.length - 20} tane daha`);

process.exit(y1.length ? 1 : 0);
