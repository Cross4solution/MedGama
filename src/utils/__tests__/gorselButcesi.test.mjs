import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * `public/` altındaki görseller için ağırlık sınırı.
 *
 * Ölçüldü — yavaş 3G'de (400 kbps, 400 ms gecikme) ana sayfa 1497 KB indiriyor
 * ve bunun 960 KB'si görsel. Sayfanın METNİ yarım saniyede okunur hâle geliyor
 * (sunucudan gelen HTML JavaScript'i beklemiyor, mimari doğru), ama tam yük 34
 * saniye sürüyordu.
 *
 * En ağır tek varlık 456 KB'lik bir arka plan fotoğrafıydı: CSS `background-image`
 * olarak kullanıldığı için Next'in görsel iyileştiricisine hiç girmiyor, ham
 * hâliyle iniyor. Yeniden kodlandı — 456→225 KB ve 229→96 KB, ölçülen görsel
 * bozulma piksel başına ortalama %0,63 (fotoğrafta algı eşiğinin altında, üstelik
 * bu görsel metnin arkasında karartmayla duruyor).
 *
 * Sonuç: toplam 1497→1267 KB, görseller 960→728 KB, yavaş 3G'de 34,0→29,4 sn.
 *
 * Sınır, kaymanın sessiz olduğu için var: kimse "bu fotoğraf 400 KB" diye
 * bakmıyor, dosya kopyalanıp geçiliyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');
const gorselKok = path.join(uygulamaKok, 'public/images');

/** Tek bir görsel için üst sınır (KB). */
const SINIR_KB = 260;

/**
 * Bilinçli istisnalar ve nedeni.
 *
 * Şu an yok. Bir görsel gerçekten büyük olmak zorundaysa buraya gerekçesiyle
 * yazılmalı — sınırı yükseltmek yerine.
 */
const MUAF = new Set();

function gorseller(dizin, toplam = []) {
  let girdiler;
  try {
    girdiler = readdirSync(dizin, { withFileTypes: true });
  } catch {
    return toplam;
  }

  for (const g of girdiler) {
    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) gorseller(tam, toplam);
    else if (/\.(png|jpe?g|webp|avif|gif)$/i.test(g.name)) toplam.push(tam);
  }

  return toplam;
}

test('hiçbir görsel sınırı aşmıyor', () => {
  const hepsi = gorseller(gorselKok);

  assert.ok(hepsi.length > 5, `tarama çalışmıyor: ${hepsi.length} görsel`);

  const asanlar = hepsi
    .map((yol) => ({ yol: path.relative(uygulamaKok, yol), kb: Math.round(statSync(yol).size / 1024) }))
    .filter((x) => x.kb > SINIR_KB && !MUAF.has(x.yol))
    .sort((a, b) => b.kb - a.kb);

  assert.deepEqual(
    asanlar.map((x) => `${x.kb} KB  ${x.yol}`),
    [],
    `Görsel ${SINIR_KB} KB sınırını aşıyor. Yavaş bağlantıda doğrudan bekleme\n`
      + 'süresine dönüşüyor. `sharp` ile yeniden kodlayın (jpeg q80 + mozjpeg\n'
      + 'tipik olarak yarıya indiriyor) ya da gerekçesiyle MUAF listesine ekleyin.',
  );
});

test('arka plan fotoğrafları yeniden büyümemiş', () => {
  // Bu ikisi ölçülerek küçültüldü; ham hâlleri geri gelirse ana sayfa yine
  // yarım megabaytlık bir fotoğrafla açılır.
  for (const [ad, enFazla] of [
    ['default/default-page.jpg', 240],
    ['default/patient-login-background.jpg', 110],
  ]) {
    const kb = Math.round(statSync(path.join(gorselKok, ad)).size / 1024);

    assert.ok(kb <= enFazla, `${ad} — ${kb} KB, en fazla ${enFazla} KB olmalı`);
  }
});
