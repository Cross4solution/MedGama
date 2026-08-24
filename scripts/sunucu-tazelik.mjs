#!/usr/bin/env node
/**
 * Ayakta duran sunucu, diskteki derlemeyi mi sunuyor?
 *
 * Bir sunucu çalışırken `next build` yapmak `.next` klasörünü altından
 * değiştiriyor. Sunucu bellekteki eski dosya adlarını sunmaya devam ediyor,
 * tarayıcı artık var olmayan yığınları istiyor ve sayfa BOŞ geliyor — ya da
 * 500.
 *
 * Bu, bir uygulama hatası gibi görünüyor ve tam olarak öyle davranıyor. Tek bir
 * oturumda altı kez hata sanıldı: "Arapça kayıt sayfası çöküyor", "404 sayfası
 * bomboş", "her sayfa 500 veriyor" — hepsi buydu. En sinsi hâli, portu
 * önizleme yöneticisinin tuttuğu ve `pkill`'in ona ulaşmadığı durum.
 *
 * Ölçüt basit ve doğrudan belirtiyi hedefliyor: sayfanın İSTEDİĞİ her varlık
 * diskte duruyor mu? Yığın adlarının nasıl türetildiğine bağlı değil.
 *
 *     node scripts/sunucu-tazelik.mjs
 *     PORT=3100 node scripts/sunucu-tazelik.mjs
 *
 * Çıkış kodu 0 = taze, 1 = bayat, 2 = ölçülemedi.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';

const PORT = process.env.PORT || '3000';
const KOK = new URL('..', import.meta.url).pathname;
const YOLLAR = ['/tr', '/tr/about'];

function bitir(kod, ...satirlar) {
  for (const s of satirlar) console.log(s);
  process.exit(kod);
}

/** Bir sayfanın istediği `/_next/static/...` varlıkları. */
async function istenenVarliklar(yol) {
  const yanit = await fetch(`http://localhost:${PORT}${yol}`, {
    signal: AbortSignal.timeout(15_000),
  });

  const html = await yanit.text();

  return [...new Set([...html.matchAll(/\/_next\/static\/[\w./-]+\.(?:js|css)/g)].map((m) => m[0]))];
}

const istenen = new Set();

for (const yol of YOLLAR) {
  try {
    for (const v of await istenenVarliklar(yol)) istenen.add(v);
  } catch (hata) {
    bitir(2,
      `✗ Sunucuya ulaşılamadı (http://localhost:${PORT}${yol}).`,
      `  ${hata.message}`,
      '',
      '  Sunucu kapalıysa sorun yok. Açık sanıyorsanız portu kontrol edin:',
      '    lsof -ti:3000');
  }
}

if (istenen.size === 0) {
  bitir(2,
    '✗ Sayfa hiçbir statik varlık istemiyor.',
    '  Beklenen HTML gelmiyor olabilir; elle bir bakın.');
}

// `/_next/static/...` → `.next/static/...`
const eksik = [...istenen].filter((v) => !existsSync(path.join(KOK, '.next', v.replace('/_next/', ''))));

if (eksik.length === 0) {
  bitir(0,
    '✓ Sunucu diskteki derlemeyi sunuyor.',
    `  ${istenen.size} varlık istendi, hepsi yerinde.`);
}

bitir(1,
  '✗ BAYAT SUNUCU — istenen varlıkların bir kısmı diskte yok.',
  '',
  `  istenen : ${istenen.size}`,
  `  eksik   : ${eksik.length}`,
  ...eksik.slice(0, 5).map((v) => `      ${v}`),
  ...(eksik.length > 5 ? [`      … ${eksik.length - 5} tane daha`] : []),
  '',
  '  Tarayıcı bu dosyaları isteyip 400/404 alacak; sayfalar boş ya da 500 gelir.',
  '  Bu bir uygulama hatası DEĞİL.',
  '',
  '  Çözüm — portu tutan HER süreci durdurun, sonra yeniden kurun:',
  '    lsof -ti:3000 | xargs -r kill -9',
  '    rm -rf .next && npm run build && npx next start');
