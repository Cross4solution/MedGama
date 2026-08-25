import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * `robots.txt` ile sayfaların kendi direktifleri aynı şeyi söylemeli.
 *
 * MedStream'in sayfası şunu yazıyordu:
 *
 *     // Herkese açık olduğu için arama motorlarına açık (indexable).
 *     robots: { index: true, follow: true }
 *
 * `app/robots.js` ise `/medstream` yolunu ÖZEL listesinde tutuyordu. Tarama
 * engeli kazanır: arama motoru sayfayı hiç çekmediği için `index: true`
 * direktifini göremez bile. Yani projenin kanonik akış sayfası — CLAUDE.md'nin
 * ana adres dediği yer — aramada tümüyle yoktu ve site haritasında da
 * listelenmiyordu.
 *
 * Ters yönde de bir boşluk vardı: `PrivateRoute` ile korunan yirmi bir sayfanın
 * hepsi `index, follow` ile dönüyordu. Özel içerik sunucudan gelmediği için
 * sızıntı yok — ama yirmi bir rota × dokuz dil, hepsi aynı genel başlıkla,
 * birbirinin aynı ince sayfa olarak taranmaya açıktı. `robots.js` listesi
 * çoğunu kapatıyordu; iç içe olanları kaçırmıştı, çünkü '/dashboard' kaydı
 * '/doctor/dashboard' adresine ulaşmıyor.
 *
 * Eşleşme ÖN EK üzerinden olduğu için liste dikkat istiyor: '/clinic/' yazmak
 * herkese açık '/clinic/{codename}' sayfalarını da kapatırdı.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');
const rotaKok = path.join(uygulamaKok, 'app/[locale]');

const robotsKaynak = readFileSync(path.join(uygulamaKok, 'app/robots.js'), 'utf8');

/**
 * `PRIVATE` listesindeki yollar.
 *
 * Yorumlar ayıklanıyor: dizinin içindeki açıklama satırı `'/doctor/dashboard'`
 * ifadesini METİN olarak taşıyor (neden eklendiğini anlatıyor) ve ham metinde
 * arayan ilk hâli onu gerçek bir kayıt sanıyordu — ölçüt, kayıt silinse bile
 * yeşil yanıyordu. Aynı tuzağa bu çalışmada beşinci düşüş.
 */
function ozelYollar() {
  const govde = robotsKaynak
    .split('const PRIVATE = [')[1]
    .split('];')[0]
    .split('\n')
    .filter((satir) => !satir.trim().startsWith('//'))
    .join('\n');

  return [...govde.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const OZEL = ozelYollar();

/** Bir yol robots.txt tarafından kapatılıyor mu? (ön ek eşleşmesi) */
function engelli(yol) {
  return OZEL.some((o) => yol.startsWith(o));
}

/** `app/[locale]` altındaki sayfalar: { yol, kaynak }. */
function sayfalar(dizin = rotaKok, onEk = '') {
  const bulunan = [];

  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, g.name);

    if (g.isDirectory()) {
      bulunan.push(...sayfalar(tam, `${onEk}/${g.name}`));
    } else if (g.name === 'page.jsx') {
      bulunan.push({ yol: onEk || '/', kaynak: readFileSync(tam, 'utf8') });
    }
  }

  return bulunan;
}

test('korunan her sayfa taramaya kapalı', () => {
  const acikta = sayfalar()
    .filter((s) => s.kaynak.includes('PrivateRoute'))
    .filter((s) => !engelli(s.yol))
    .map((s) => s.yol);

  assert.deepEqual(
    acikta.sort(),
    [],
    'Bu sayfalar giriş istiyor ama taramaya açık. İçerik sunucudan gelmediği\n'
      + 'için sızıntı değil; yine de her biri dokuz dilde, aynı başlıkla, ince\n'
      + 've birbirinin aynı sayfa olarak taranır. `app/robots.js` → PRIVATE.',
  );
});

test('kendini indekslenebilir ilan eden sayfa engellenmiyor', () => {
  // Asıl hata buydu: iki yer aynı sayfa için zıt şey söylüyordu ve tarama
  // engeli kazandığı için sayfanın direktifi hiç okunmuyordu.
  const celisen = sayfalar()
    .filter((s) => /robots:\s*\{\s*index:\s*true/.test(s.kaynak))
    .filter((s) => engelli(s.yol))
    .map((s) => s.yol);

  assert.deepEqual(
    celisen,
    [],
    'Sayfa "beni indeksle" diyor, robots.txt taramayı engelliyor. Engel kazanır\n'
      + 've sayfa aramada hiç görünmez. Biri yanlış — ikisini de karara bağlayın.',
  );
});

test('herkese açık sayfalar yanlışlıkla kapatılmamış', () => {
  // Ön ek eşleşmesi tehlikeli: '/clinic/' yazmak '/clinic/{codename}'
  // sayfalarını da kapatırdı.
  for (const yol of [
    '/', '/about', '/for-patients', '/for-clinics', '/contact', '/kvkk',
    '/medstream', '/search', '/tedaviler', '/tedaviler/kardiyoloji',
    '/clinic/beyaz-dis-merkezi', '/doctor/019d4f44-168f-723a-90c8-56c0b9c01a07',
    '/browse/clinics',
  ]) {
    assert.ok(!engelli(yol), `${yol} taramaya kapatılmış — herkese açık bir sayfa`);
  }
});

test('site haritası ile tarama kuralları çelişmiyor', () => {
  // Site haritasına koyup taramayı engellemek, arama motoruna aynı anda "şuraya
  // bak" ve "oraya bakma" demek.
  const harita = readFileSync(path.join(uygulamaKok, 'app/sitemap.js'), 'utf8');
  const statik = harita.split('const staticPaths = [')[1].split('];')[0];
  const yollar = [...statik.matchAll(/^\s*'([^']*)',/gm)].map((m) => m[1]);

  assert.ok(yollar.length > 5, `site haritası okunamadı: ${yollar.length} yol`);

  const celisen = yollar.filter((y) => y && engelli(y));

  assert.deepEqual(celisen, [], 'site haritasındaki bu yollar robots.txt ile engelli');

  // MedStream kanonik akış sayfası; listeden düşmesi sessiz bir kayıp olurdu.
  assert.ok(yollar.includes('/medstream'), 'MedStream site haritasından çıkmış');
});
