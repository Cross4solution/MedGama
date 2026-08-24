import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Diller ayrı paketlerde kalmalı.
 *
 * Dokuz dilin sözlüğü tek pakette gidiyordu ve `app/[locale]/layout` onu her
 * sayfada çekiyordu. Ölçüldü: Türkçe ana sayfa 723 KB JavaScript indiriyordu,
 * 462 KB'si bu paket — yani ziyaretçi okumayacağı sekiz dilin tam sözlüğünü
 * indiriyordu. Bölmeden sonra aynı sayfa 360 KB.
 *
 * Geri dönüşü tek satır: `index.js` başına bir `import fr from './locales/fr'`
 * eklemek yeter. Hiçbir şey bozulmaz, hiçbir test kırılmaz, sayfa yine çalışır
 * — sadece herkes yeniden yüz kilobaytlarca fazla indirir. Sessiz olduğu için
 * test ediliyor.
 *
 * Sunucu tarafı ayrı: SSR'nin doğru dilde HTML üretmesi için sözlüklerin render
 * anında elinde olması gerekiyor, orada indirme maliyeti de yok. O yüzden
 * `typeof window === 'undefined'` bloğu bilerek TÜM dilleri yüklüyor ve bu test
 * onu bir ihlal saymıyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const i18nKok = path.resolve(path.dirname(buDosya), '..');
const uygulamaKok = path.resolve(i18nKok, '../..');

const indexMetni = readFileSync(path.join(i18nKok, 'index.js'), 'utf8');

/** `SUPPORTED_LANGS` listesi. */
function desteklenenDiller() {
  const govde = indexMetni.split('SUPPORTED_LANGS = [')[1].split(']')[0];
  return [...govde.matchAll(/'([a-z]{2})'/g)].map((m) => m[1]);
}

test('index.js hiçbir sözlüğü statik içe aktarmıyor', () => {
  // İngilizce bir süre burada muaftı çünkü `fallbackLng` o. Ölçüldü: bu, Türkçe
  // bir sayfanın 47 KB gzip İngilizce metin indirmesi demekti — gösterilmeyen,
  // yalnızca eksik anahtar ihtimaline karşı taşınan bir yük. Anahtar bütünlüğü
  // zaten `ceviriAnahtarlari` ile ölçülüyor, o yüzden muafiyet kaldırıldı.
  const statik = [...indexMetni.matchAll(/^import\s+\w+\s+from\s+'\.\/locales\/(\w+)\.json'/gm)]
    .map((m) => m[1]);

  assert.deepEqual(
    statik,
    [],
    'Bir sözlük yeniden istemci paketine statik girmiş: rotadaki dil ne olursa\n'
      + 'olsun herkes onu indirir (dil başına ~50 KB gzip). Dil `paketler/`\n'
      + 'altına eklenmeli. Statik gelenler:\n  '
      + statik.join(', '),
  );
});

test('desteklenen her dilin kendi paketi var', () => {
  const paketler = readdirSync(path.join(i18nKok, 'paketler')).map((d) => d.replace('.jsx', ''));
  const beklenen = desteklenenDiller();

  assert.deepEqual(
    paketler.sort(),
    beklenen.sort(),
    'Desteklenen dil ile paket dosyaları ayrışmış: paketi olmayan dil ekranda\n'
      + 'sessizce İngilizceye düşer (SSR doğru gelir, tarayıcı devralınca değişir).',
  );
});

test('her paket kendi sözlüğünü statik içe aktarıyor', () => {
  // `import()` ile yapılsaydı sözlük ilk boyamadan SONRA gelirdi: kullanıcı bir
  // an çevrilmemiş metin görürdü. Statik olması, modül değerlendiği an hazır
  // olmasını garanti ediyor.
  for (const dosya of readdirSync(path.join(i18nKok, 'paketler'))) {
    const dil = dosya.replace('.jsx', '');
    const metin = readFileSync(path.join(i18nKok, 'paketler', dosya), 'utf8');

    assert.ok(
      metin.includes(`from '../locales/${dil}.json'`),
      `${dosya} kendi sözlüğünü statik içe aktarmıyor`,
    );
    assert.ok(
      metin.includes(`addResourceBundle('${dil}'`),
      `${dosya} sözlüğü i18n'e eklemiyor`,
    );
  }
});

test('yerleşim sözlük paketini dil köprüsünden ÖNCE render ediyor', () => {
  // `LocaleBridge` dili değiştiriyor; sözlük o an yüklenmemişse i18next
  // İngilizceye düşer ve bir daha kendiliğinden dönmez.
  const yerlesim = readFileSync(path.join(uygulamaKok, 'app/[locale]/layout.jsx'), 'utf8');

  const sozluk = yerlesim.indexOf('<SozlukPaketi');
  const kopru = yerlesim.indexOf('<LocaleBridge');

  assert.ok(sozluk !== -1, 'yerleşim SozlukPaketi render etmiyor');
  assert.ok(sozluk < kopru, "SozlukPaketi, LocaleBridge'den SONRA render ediliyor");
});

test('sunucu tarafı tüm dilleri yüklüyor (SSR dili doğru olsun diye)', () => {
  // Bu blok silinirse `/de`, `/ar`, `/ru` sunucudan İNGİLİZCE gelir — ölçüldü.
  // Ekranda fark edilmez, çünkü tarayıcı devralınca doğru dile döner; ama arama
  // motorlarının indekslediği HTML yanlış dilde kalır.
  assert.ok(
    indexMetni.includes("typeof window === 'undefined'"),
    'sunucu tarafı sözlük yüklemesi kaldırılmış: SSR yanlış dilde HTML üretir',
  );
  assert.ok(
    indexMetni.includes('require(`./locales/${dil}.json`)'),
    'sunucu tarafı yükleme artık sözlükleri okumuyor',
  );
});
