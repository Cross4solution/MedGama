import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * `<button>` içinde `<button>` olmamalı.
 *
 * HTML bunu yasaklıyor ve tarayıcı sessizce düzeltmiyor: ayrıştırıcı iç düğmeyi
 * dıştakinin DIŞINA taşıyor. Sunucudan gelen HTML ile tarayıcının kurduğu ağaç
 * ayrışıyor, React o dalı atıp baştan çiziyor (hidrasyon hatası #418).
 *
 * Ana sayfada ölçüldü. Akıştaki belge gönderilerinde kartın kendi indirme
 * düğmesi vardı ve kart, gönderiye gitmeyi sağlayan bir `<button>` ile
 * sarılıydı. Görünürde bozuk bir şey yok — bedeli gizli: React sunucudan gelen
 * HTML'i atıyor, o dalın olay dinleyicileri yeniden kuruluyor.
 *
 * İki katman test ediliyor. Biri bu dosyaya özel, çünkü buradaki iç içelik TEK
 * dosyada görünmüyordu: `<button>` → `MediaItem` → `DocumentPreview` → `<button>`.
 * Diğeri deponun tamamında düz iç içeliği tarıyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const timelineKok = path.resolve(path.dirname(buDosya), '..');
const kaynakKok = path.resolve(timelineKok, '../..');

/**
 * Bir `<button …>` … `</button>` bloğunun gövdelerini döndürür.
 *
 * Kendiliğinden kapanan `<button … />` atlanıyor: kapanış etiketi olmadığı için
 * ilk denemede sonraki ilgisiz bir `</button>` ile eşleşiyor ve aradaki her şeyi
 * yutuyordu — tarama depodaki seksen dosyayı kusurlu göstermişti.
 */
function dugmeGovdeleri(metin) {
  const govdeler = [];

  /** `<button` konumundan açılış etiketinin bittiği yeri ve kendi kapanıp kapanmadığını bulur. */
  function acilisEtiketi(bas) {
    let tirnak = null;

    for (let i = bas; i < metin.length; i++) {
      const c = metin[i];

      if (tirnak) {
        if (c === tirnak) tirnak = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { tirnak = c; continue; }
      if (c === '>') return { son: i, kendiKapanan: metin[i - 1] === '/' };
    }

    return null;
  }

  for (let bas = metin.indexOf('<button'); bas !== -1; bas = metin.indexOf('<button', bas + 1)) {
    const etiket = acilisEtiketi(bas);
    if (!etiket || etiket.kendiKapanan) continue;

    let derinlik = 0;
    let i = etiket.son;

    for (;;) {
      const sonrakiAc = metin.indexOf('<button', i + 1);
      const sonrakiKapa = metin.indexOf('</button>', i + 1);

      if (sonrakiKapa === -1) break;

      if (sonrakiAc !== -1 && sonrakiAc < sonrakiKapa) {
        const ic = acilisEtiketi(sonrakiAc);
        if (ic && !ic.kendiKapanan) derinlik++;
        i = ic ? ic.son : sonrakiAc;
        continue;
      }

      // Gövde açılış etiketinden SONRA başlıyor: etiketin kendisi içeri
      // katılırsa her gövde `<button` içerir ve tarama her dosyayı kusurlu sayar.
      if (derinlik === 0) { govdeler.push(metin.slice(etiket.son + 1, sonrakiKapa)); break; }

      derinlik--;
      i = sonrakiKapa;
    }
  }

  return govdeler;
}

test('akış kartında medya, düğmenin içine sarılmıyor', () => {
  // `MediaItem` belge geldiğinde kendi indirme düğmesini çiziyor. Düğmenin
  // içine sarılırsa iç içe düğme oluşuyor — ve bu, tek dosyaya bakınca
  // görünmüyor, iki bileşen ötede.
  //
  // `MedyaKaresi`nin kendi gövdesi hariç: oradaki `<button>` YALNIZ görsel
  // dalında, `tur === 'image'` kapısının arkasında.
  const metin = readFileSync(path.join(timelineKok, 'TimelineCard.jsx'), 'utf8');

  const yardimciBas = metin.indexOf('function MedyaKaresi');
  assert.ok(yardimciBas !== -1, 'MedyaKaresi kaldırılmış');

  const yardimciSon = metin.indexOf('\nfunction ', yardimciBas + 1);
  const yardimci = metin.slice(yardimciBas, yardimciSon);
  const kalan = metin.slice(0, yardimciBas) + metin.slice(yardimciSon);

  assert.match(
    yardimci,
    /tur === 'image'[\s\S]{0,200}<button/,
    'MedyaKaresi düğmeyi artık yalnız görsellerde kullanmıyor',
  );

  const kusurlu = dugmeGovdeleri(kalan).filter((g) => /<(MediaItem|MedyaKaresi)\b/.test(g));

  assert.deepEqual(
    kusurlu.map((g) => g.slice(0, 60)),
    [],
    'Medya bir `<button>` içine sarılmış. Belge geldiğinde kartın indirme\n'
      + 'düğmesi iç içe kalır: tarayıcı onu dışarı taşır, React hidrasyonu düşürür.\n'
      + '`MedyaKaresi` yalnız görselde düğme kullanıyor; sarmalı ona bırakın.',
  );
});

test('hiçbir bileşende düz iç içe düğme yok', () => {
  const dosyalar = [];

  (function tara(dizin) {
    for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
      if (girdi.name === '__tests__') continue;
      const tam = path.join(dizin, girdi.name);
      if (girdi.isDirectory()) tara(tam);
      else if (girdi.name.endsWith('.jsx')) dosyalar.push(tam);
    }
  })(kaynakKok);

  assert.ok(dosyalar.length > 100, `tarama çalışmıyor: ${dosyalar.length} dosya`);

  const kusurlu = [];

  for (const yol of dosyalar) {
    const metin = readFileSync(yol, 'utf8');

    for (const govde of dugmeGovdeleri(metin)) {
      if (govde.includes('<button')) {
        kusurlu.push(path.relative(kaynakKok, yol));
        break;
      }
    }
  }

  assert.deepEqual(kusurlu, [], 'İç içe `<button>`: tarayıcı içtekini dışarı taşır, hidrasyon kırılır');
});
