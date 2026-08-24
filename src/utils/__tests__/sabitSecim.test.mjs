import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import sabitSecim from '../sabitSecim.js';

/**
 * Render gövdesinde `Math.random()` olmamalı.
 *
 * Klinik listesinde ölçüldü: kartın yedek fotoğrafı her çizimde yeniden
 * seçiliyordu. Arama kutusuna tek harf yazıp silmek yetiyordu —
 *
 *     caroline-lm-…  →  petr-magera-…  →  deliberate-directions-…
 *
 * Klinik değişmiyor, fotoğrafı değişiyor. Kullanıcı için liste altından
 * oynuyor; ağ için her seferinde başka bir dosya iniyor. Sunucuda render
 * edilen sayfada daha da sert: sunucu bir şey seçiyor, tarayıcı devralırken
 * başkasını.
 *
 * Aynı kalıp dört yerdeydi:
 *
 *   • BrowseClinics / BrowseTreatments — yedek fotoğraf
 *   • AdminVerification — `key={doctor?.id || Math.random()}`. Rastgele React
 *     anahtarı, her çizimde YENİ bir öge demek: React eskisini söküp yenisini
 *     kuruyor, panelin durumu ve odak kayboluyor.
 *   • ProTeaser — ısı haritası kutularının tonu, her çizimde titriyordu.
 *
 * Bilerek bırakılanlar denetlenmiyor: kimlik/parola üretimi ve zamanlayıcı
 * dağıtımı rastgele OLMALI. Ölçüt yalnız render gövdesindeki çağrıları arıyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

test('aynı anahtar hep aynı ögeyi veriyor', () => {
  const liste = ['a', 'b', 'c', 'd'];

  for (const anahtar of ['019d4f43-e7d7', 'klinik-42', 'Yerel Deneme Kliniği', 7]) {
    const ilk = sabitSecim(anahtar, liste);

    for (let i = 0; i < 50; i += 1) {
      assert.equal(sabitSecim(anahtar, liste), ilk, `${anahtar} için seçim değişti`);
    }
  }
});

test('farklı anahtarlar listeye yayılıyor', () => {
  // Hepsi aynı ögeye düşseydi işlev kararlı ama işe yaramaz olurdu.
  const liste = ['a', 'b', 'c', 'd'];
  const gorulen = new Set();

  for (let i = 0; i < 200; i += 1) gorulen.add(sabitSecim(`klinik-${i}`, liste));

  assert.equal(gorulen.size, liste.length, `dağılım dar: ${[...gorulen].join(',')}`);
});

test('boş liste ve anahtarsız çağrı çökmüyor', () => {
  assert.equal(sabitSecim('x', []), undefined);
  assert.equal(sabitSecim('x', null), undefined);
  // Anahtarsız çağrı sessizce rastgeleye dönmemeli.
  assert.equal(sabitSecim(undefined, ['a', 'b']), 'a');
  assert.equal(sabitSecim('', ['a', 'b']), 'a');
});

/** `src/` altındaki tüm kaynak dosyalar. */
function kaynaklar(dizin, toplam = []) {
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name === '__tests__' || g.name === 'node_modules') continue;

    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) kaynaklar(tam, toplam);
    else if (/\.jsx?$/.test(g.name)) toplam.push(tam);
  }

  return toplam;
}

/**
 * Rastgeleliğin doğru olduğu yerler ve nedeni.
 *
 * Bunlar render sırasında değil, bir olaya karşılık çalışıyor.
 */
const MESRU = new Map([
  ['src/context/ToastContext.jsx', 'bildirim kimliği — benzersiz olmalı'],
  ['src/utils/notificationSound.js', 'beyaz gürültü örneği — sesin kendisi'],
  ['src/screens/crm/CRMSalespeople.jsx', 'ilk parola üretimi'],
  ['src/screens/crm/CRMStaff.jsx', 'ilk parola üretimi'],
  ['src/screens/crm/CRMExamination.jsx', 'yeni satır kimliği — kullanıcı eklerken'],
  ['src/hooks/useTelehealth.js', 'yoklama aralığını dağıtmak (jitter)'],
]);

test('render gövdesinde rastgelelik kalmamış', () => {
  const bulunan = [];

  for (const dosya of kaynaklar(path.join(uygulamaKok, 'src'))) {
    const goreli = path.relative(uygulamaKok, dosya);
    if (MESRU.has(goreli)) continue;

    const satirlar = readFileSync(dosya, 'utf8').split('\n');

    satirlar.forEach((satir, i) => {
      if (!satir.includes('Math.random()')) return;
      if (satir.trim().startsWith('//') || satir.trim().startsWith('*')) return;

      bulunan.push(`${goreli}:${i + 1}  ${satir.trim().slice(0, 70)}`);
    });
  }

  assert.deepEqual(
    bulunan,
    [],
    'Render sırasında rastgelelik: her yeniden çizimde sonuç değişir, sunucu\n'
      + 've tarayıcı farklı şeyler üretir. Kararlı bir anahtardan seçmek için\n'
      + '`utils/sabitSecim.js` var. Gerçekten rastgele olması gerekiyorsa\n'
      + 'gerekçesiyle MEŞRU listesine ekleyin.',
  );
});
