import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Ana sayfa kahraman arka planı — sayfanın en ağır tek varlığı.
 *
 * Sırasıyla 456 → 225 (yeniden kodlama) → 140 KB (WebP). Fotoğraf ekranda
 * %25-30 siyah bir katmanın altında durduğu için görsel fark orada ölçüldü:
 * piksel başına ortalama %0,384, daha önce kabul edilen eşiğin (%0,63) altında.
 *
 * Üç şey birbirine bağlı ve üçü de sessizce bozulabilir:
 *
 *   1. JPEG geri düşüşü. `image-set` desteklemeyen tarayıcı onu alıyor.
 *      `@supports` ayrıştırma anında çözüldüğü için yalnız kazanan bildirim
 *      indiriliyor — ikisi birden değil (ölçüldü: yalnız .webp iniyor).
 *
 *   2. `background-color`. Üstündeki başlık BEYAZ. Fotoğraf gelmezse — ağ
 *      hatası, engelleyici, yanlış yol — beyaz zeminde beyaz yazı kalır.
 *      Bu, tek satırlık bir düzenlemeyle kaybolacak ve kimsenin fark
 *      etmeyeceği türden bir şey.
 *
 *   3. Sınıfın kendisi. `HomeV2` satır içi `style` kullanmaya dönerse
 *      buradaki her şey devre dışı kalır.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const css = readFileSync(path.join(uygulamaKok, 'src/assets/index.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const home = readFileSync(path.join(uygulamaKok, 'src/screens/HomeV2.jsx'), 'utf8');

/** `.kahraman-arka { … }` gövdesi (ilk, `@supports` dışındaki kural). */
function kural() {
  const bas = css.indexOf('.kahraman-arka {');
  assert.ok(bas > 0, '`.kahraman-arka` kuralı kaybolmuş');

  return css.slice(bas, css.indexOf('}', bas));
}

test('kahraman katmanı sınıfı kullanıyor', () => {
  assert.match(home, /className="kahraman-arka/, 'HomeV2 sınıfı kullanmıyor: WebP ve geri düşüş devre dışı');
  assert.doesNotMatch(
    home,
    /backgroundImage:\s*`?url\(\/images\/default\/default-page/,
    'satır içi arka plan geri gelmiş: `@supports` atlanır, JPEG iner',
  );
});

test('fotoğraf gelmezse beyaz yazı beyaz zeminde kalmıyor', () => {
  assert.match(kural(), /background-color:\s*#[0-9a-f]{3,6}/i, 'geri düşüş rengi yok: başlık beyaz, zemin beyaz kalır');
});

test('görsel iyileştiriciden ve öncelikli olarak geliyor', () => {
  // Eskiden CSS arka planıydı ve `image-set` ile WebP/JPEG seçtiriyordu. Bir
  // arka plan görselini tarayıcı ancak CSS ayrıştırıldıktan SONRA keşfediyor —
  // LCP ögesi için en kötü sıra — ve her cihaza aynı 1920 piksellik dosya
  // iniyordu. Biçim seçimi artık Next'in işi; `priority` ön yükleme veriyor.
  assert.match(home, /<Image\b/, 'kahraman görseli `next/image` ile çizilmiyor');
  assert.match(home, /priority/, '`priority` yok: LCP ögesi ön yüklenmiyor');
  assert.match(home, /sizes="100vw"/, '`sizes` yok: telefona da masaüstü ölçüsü iner');
  assert.match(home, /src="\/images\/default\/default-page\.webp"/, 'kahraman görseli değişmiş');

  // CSS artık görsel taşımamalı; iki yerden birden çizilirse ikisi de iner.
  assert.doesNotMatch(css, /image-set/, 'CSS hâlâ arka plan görseli çiziyor: görsel iki kez inebilir');
  assert.doesNotMatch(kural(), /background-image/, '`.kahraman-arka` yeniden görsel taşıyor');
});

test('iki dosya da yerinde ve WebP gerçekten daha hafif', () => {
  const kb = (ad) => statSync(path.join(uygulamaKok, 'public/images/default', ad)).size / 1024;

  const webp = kb('default-page.webp');

  // İyileştiriciye giren KAYNAK dosya. Büyürse her ölçü ondan türetildiği için
  // hepsi ağırlaşır; küçülürse büyük ekranda bulanıklaşır.
  assert.ok(webp <= 160, `WebP ${Math.round(webp)} KB — 140 KB ölçülmüştü`);
  assert.ok(webp >= 80, `WebP ${Math.round(webp)} KB — kaynak fazla küçülmüş, büyük ekranda bulanıklaşır`);
});
