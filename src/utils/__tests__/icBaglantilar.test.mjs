import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Uygulama içi bağlantılar gerçekten bir sayfaya gidiyor mu.
 *
 * Kırık bir iç bağlantı hiçbir uyarı üretmiyor: kod derleniyor, testler
 * geçiyor, kullanıcı tıklıyor ve 404 görüyor.
 *
 * Bu tarama gerçek bir hata buldu: `/crm/upgrade`. CRM aboneliği olmayan bir
 * hekim kilitli CRM düğmesine basıyor, açılan modaldaki "Yükselt" düğmesi
 * oraya yönlendiriyordu — ve o sayfa YOKTU. Yani ödeme yolunun ucu kırıktı.
 * Belgede (CLAUDE.md) davranış yazılıydı, sayfa yazılmamıştı.
 *
 * Dil öneki (`/tr`, `/de` …) ve şablon değişkenleri (`${id}`) eşleştirmede
 * normalleştiriliyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const projeKok = path.resolve(path.dirname(buDosya), '../../..');
const appKok = path.join(projeKok, 'app');
const kaynakKok = path.join(projeKok, 'src');

const DILLER = ['tr', 'en', 'de', 'ar', 'ru', 'fr', 'es', 'it', 'az'];

/** Next App Router sayfalarının yolları. */
function sayfaYollari(dizin = appKok, toplam = []) {
  for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) {
      sayfaYollari(tam, toplam);
    } else if (/^page\.(jsx?|tsx?)$/.test(girdi.name)) {
      const bagil = path.relative(appKok, dizin).split(path.sep).join('/');
      toplam.push('/' + bagil.replace(/^\[locale\]\/?/, ''));
    }
  }
  return toplam;
}

const sayfalar = sayfaYollari().map((y) => (y.replace(/\/$/, '') || '/'));

/** `/doctor/[id]` → `^/doctor/[^/]+$` */
const kalip = (yol) =>
  new RegExp('^' + yol.replace(/[.*+?^${}()|]/g, '\\$&').replace(/\[[^\]]+\]/g, '[^/]+') + '$');

const kaliplar = sayfalar.map(kalip);

/** Kaynak ağacındaki dosyalar (app/ hariç — orada sayfa tanımları var). */
function kaynakDosyalari(dizin = kaynakKok, toplam = []) {
  for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) {
      if (girdi.name === '__tests__') continue;
      kaynakDosyalari(tam, toplam);
    } else if (/\.(js|jsx)$/.test(girdi.name)) {
      toplam.push(tam);
    }
  }
  return toplam;
}

const metin = kaynakDosyalari().map((p) => readFileSync(p, 'utf8')).join('\n');

const yollar = new Set();
const desen = /(?:navigate|router\.push|href\s*=\s*|to\s*=\s*)[({]?\s*[`'"](\/[a-zA-Z0-9\-_/[\]${}.?=&]*)[`'"]/g;
for (const eslesme of metin.matchAll(desen)) yollar.add(eslesme[1]);

/** Dil öneki, sorgu dizesi ve şablon değişkenleri temizlenmiş hâli. */
function normalle(yol) {
  let y = yol.split('?')[0].split('#')[0];
  y = y.replace(/\$\{[^}]*\}/g, 'X');
  y = y.replace(new RegExp(`^/(${DILLER.join('|')})(?=/|$)`), '');
  return y.replace(/\/$/, '') || '/';
}

/** Sayfa değil: arka uç ya da statik varlık. */
const sayfaDegil = (y) =>
  /^\/(api|storage|images|broadcasting|_next|favicon)/.test(y);

test('tarama gerçekten sayfa ve bağlantı buluyor', () => {
  // Desen bozulursa denetim boş küme üzerinde yeşil yanardı.
  assert.ok(sayfalar.length > 50, `sayfa sayısı beklenmedik: ${sayfalar.length}`);
  assert.ok(yollar.size > 30, `bağlantı sayısı beklenmedik: ${yollar.size}`);
});

test('her iç bağlantı var olan bir sayfaya gidiyor', () => {
  const kirik = [...yollar]
    .map((ham) => [ham, normalle(ham)])
    .filter(([, n]) => !sayfaDegil(n))
    .filter(([, n]) => !kaliplar.some((k) => k.test(n)))
    .map(([ham, n]) => `${ham}  (aranan: ${n})`);

  assert.deepEqual(
    kirik,
    [],
    `Kırık iç bağlantı — kullanıcı tıklayınca 404 görür:\n  ${kirik.join('\n  ')}`,
  );
});

test('yükseltme sayfası duruyor', () => {
  // Ödeme yolunun ucu. Kilitli CRM düğmesi → modal → bu sayfa.
  assert.ok(
    sayfalar.includes('/crm/upgrade'),
    'CRM yükseltme sayfası yok — kilitli düğmenin "Yükselt" bağlantısı 404 verir',
  );
});
