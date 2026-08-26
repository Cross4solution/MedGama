import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Ekrana yazılan metin `t()` içinden geçmeli.
 *
 * Yönetici panelinde on yedi metin doğrudan JSX'e yazılmıştı: "Refresh",
 * "Export CSV", "Support Management", "Feature Toggles", "Block"… Uygulama
 * on dile çeviriliyor ve bu metinler HER dilde İngilizce görünüyordu.
 *
 * Sessiz sınıf: eksik çeviri değil bu — i18next'e hiç sorulmuyor, dolayısıyla
 * "eksik anahtar" uyarısı da çıkmıyor. Ekran çalışıyor, yalnız yanlış dilde.
 *
 * Aynı biçim CRM panosundaki "Good Evening" selamlamasında da vardı (548ddd3).
 *
 * Ölçüt JSX metin düğümlerine bakıyor: `>Metin<` biçiminde, süslü parantez
 * içermeyen ve Türkçe karakter taşımayan İngilizce ifadeler. Marka adları ve
 * teknik kısaltmalar muaf.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

/** Çeviriden muaf: marka adları, kısaltmalar, tek harfli etiketler. */
const MUAF = new Set([
  'Medagama', 'MedStream', 'CRM', 'GDPR', 'KVKK', 'HIPAA', 'PDF', 'CSV', 'AI',
  'SSL', 'API', 'URL', 'ID', 'OK', 'TR', 'EN', 'EUR', 'USD', 'TRY', 'GBP',
]);

const TURKCE = /[çğıöşüÇĞİÖŞÜ]/;
const METIN_DUGUMU = />(\s*)([A-Z][A-Za-z][A-Za-z \-&/']{3,40})(\s*)</g;

function ekranlar(dizin) {
  const bulunan = [];

  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name.startsWith('.') || g.name === '__tests__') continue;

    const tam = path.join(dizin, g.name);

    if (g.isDirectory()) bulunan.push(...ekranlar(tam));
    else if (g.name.endsWith('.jsx')) bulunan.push(tam);
  }

  return bulunan;
}

test('yönetici ekranlarında sabit İngilizce metin yok', () => {
  const ihlaller = [];

  for (const yol of ekranlar(path.join(kok, 'src/screens/admin'))) {
    const kaynak = readFileSync(yol, 'utf8');

    for (const m of kaynak.matchAll(METIN_DUGUMU)) {
      const metin = m[2].trim();

      if (MUAF.has(metin) || TURKCE.test(metin)) continue;

      const satir = kaynak.slice(0, m.index).split('\n').length;

      ihlaller.push(`${path.basename(yol)}:${satir} "${metin}"`);
    }
  }

  assert.deepEqual(
    ihlaller,
    [],
    'ekrana doğrudan yazılmış metin: on dilin hepsinde İngilizce görünür ve eksik-anahtar uyarısı vermez',
  );
});

test('muafiyet listesi taramayı boşa çıkarmıyor', () => {
  // Muafiyetler büyüyerek ölçütü anlamsızlaştırmasın.
  assert.ok(MUAF.size < 30, 'muafiyet listesi şişmiş: tarama artık bir şey söylemiyor');
});
