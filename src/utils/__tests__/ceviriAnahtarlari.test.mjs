import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Çeviri anahtarı kapsamı — kodun istediği her anahtar her dilde var mı.
 *
 * İki ayrı kırılma var ve ikisi de sessiz:
 *
 *  • YEDEKSİZ `t('anahtar')` bir dilde yoksa ekranda HAM ANAHTAR görünür:
 *    kullanıcı "profile.title" yazısını okur.
 *  • YEDEKLİ `t('anahtar', 'Gömülü metin')` bir dilde yoksa kullanıcı kendi
 *    dili yerine gömülü yedeği görür. Yedekler genellikle Türkçe yazılıyor,
 *    yani Alman kullanıcı arayüzün ortasında Türkçe bir cümle görüyor.
 *
 * İkincisi bu testin YAZILMA SEBEBİ: erişilebilirlik düzeltmesinde
 * `t('profile.changePhoto', 'Profil fotoğrafını değiştir')` eklenmiş ama
 * anahtar hiçbir dil dosyasına konmamıştı. Dokuz dilin dokuzunda da avatar
 * düğmesi Türkçe okunuyordu ve hiçbir şey uyarmıyordu.
 *
 * Yalnızca YÖNLENDİRİLEN diller sınanıyor — kullanıcının ulaşabildiği
 * adresler onlar (`src/lib/locales.js`). Diğer dosyalar rotasız duruyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const kaynakKok = path.resolve(path.dirname(buDosya), '../..');
const dilKok = path.join(kaynakKok, 'i18n/locales');

const YONLENDIRILEN = ['tr', 'en', 'de', 'ar', 'ru', 'fr', 'es', 'it', 'az'];

/** İç içe sözlüğü "a.b.c" biçiminde düzler. */
function duzle(nesne, onek = '') {
  const cikti = {};
  for (const [k, v] of Object.entries(nesne)) {
    const yol = `${onek}${k}`;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(cikti, duzle(v, `${yol}.`));
    else cikti[yol] = v;
  }
  return cikti;
}

const sozlukler = Object.fromEntries(
  YONLENDIRILEN.map((d) => [d, duzle(JSON.parse(readFileSync(path.join(dilKok, `${d}.json`), 'utf8')))]),
);

/** Kaynak ağacındaki tüm .js/.jsx dosyaları (testler hariç). */
function kaynakDosyalari(dizin = kaynakKok, toplam = []) {
  for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) {
      if (girdi.name === '__tests__' || girdi.name === 'locales') continue;
      kaynakDosyalari(tam, toplam);
    } else if (/\.(js|jsx)$/.test(girdi.name)) {
      toplam.push(tam);
    }
  }
  return toplam;
}

const metin = kaynakDosyalari().map((p) => readFileSync(p, 'utf8')).join('\n');

const topla = (desen) => {
  const bulunan = new Set();
  for (const eslesme of metin.matchAll(desen)) bulunan.add(eslesme[1]);
  return [...bulunan];
};

const yedeksiz = topla(/\bt\(\s*'([a-zA-Z][\w.]*)'\s*\)/g);
const yedekli = topla(/\bt\(\s*'([a-zA-Z][\w.]*)'\s*,/g);

test('tarama gerçekten anahtar buluyor', () => {
  // Desen bozulursa iki denetim de boş küme üzerinde yeşil yanardı.
  assert.ok(yedeksiz.length > 500, `yedeksiz anahtar sayısı beklenmedik: ${yedeksiz.length}`);
  assert.ok(yedekli.length > 500, `yedekli anahtar sayısı beklenmedik: ${yedekli.length}`);
});

test('yedeksiz anahtarlar her dilde var — yoksa ham anahtar görünür', () => {
  for (const dil of YONLENDIRILEN) {
    const eksik = yedeksiz.filter((a) => !(a in sozlukler[dil]));

    assert.deepEqual(
      eksik,
      [],
      `${dil}.json içinde eksik: ${eksik.slice(0, 10).join(', ')}`,
    );
  }
});

test('yedekli anahtarlar da her dilde var — yoksa kullanıcı yedeği görür', () => {
  // Yedek metinler çoğunlukla Türkçe; eksik anahtar, Almanca arayüzde
  // Türkçe cümle demek.
  for (const dil of YONLENDIRILEN) {
    const eksik = yedekli.filter((a) => !(a in sozlukler[dil]));

    assert.deepEqual(
      eksik,
      [],
      `${dil}.json içinde eksik: ${eksik.slice(0, 10).join(', ')}`,
    );
  }
});

test('hiçbir çeviri boş değil', () => {
  // Boş dizge de sessiz: düğmenin üstünde hiçbir şey yazmaz.
  for (const dil of YONLENDIRILEN) {
    const bos = Object.entries(sozlukler[dil])
      .filter(([, v]) => typeof v === 'string' && v.trim() === '')
      .map(([k]) => k);

    assert.deepEqual(bos, [], `${dil}.json içinde boş çeviri: ${bos.slice(0, 10).join(', ')}`);
  }
});

test('yönlendirilen diller aynı anahtar kümesini paylaşıyor', () => {
  // Bir dilde olup diğerinde olmayan anahtar, o dile geçen kullanıcıda
  // sessizce yedeğe düşer.
  const referans = new Set(Object.keys(sozlukler.tr));

  for (const dil of YONLENDIRILEN) {
    const eksik = [...referans].filter((a) => !(a in sozlukler[dil]));

    assert.deepEqual(eksik, [], `${dil}.json, tr.json'daki şu anahtarları taşımıyor: ${eksik.slice(0, 10).join(', ')}`);
  }
});
