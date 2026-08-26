import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Arayüz metni "Türkçe mi?" sorusuna göre seçilemez.
 *
 * Yirmi bir dosyada şu desen vardı:
 *
 *     const isTr = i18n.language?.startsWith('tr');
 *     ...
 *     { label: isTr ? 'İptal Edildi' : 'Cancelled' }
 *
 * İki dal var, dokuz dil destekleniyor. Türkçe olmayan HER dil İngilizce
 * dala düşüyordu. Ölçüldü — Almanca hastanın randevu ekranı:
 *
 *     menü:  "Termine · Rechnungen · Benachrichtigungen"   (Almanca)
 *     gövde: "My Appointments · All Upcoming Completed
 *             Cancelled · Video Call · October 10, 2026"    (İngilizce)
 *
 * Kabuk çevriliydi çünkü o `t()` kullanıyordu; içerik çevrilmemişti çünkü
 * kendi iki dilli anahtarını kuruyordu. Tarih bile Amerikan biçimindeydi:
 * `isTr ? 'tr-TR' : 'en-US'`.
 *
 * Etkilenen yüzey randevular, faturalar, rıza yönetimi, tıbbi arşiv, erişim
 * geçmişi, konum seçici, telesağlık ve CRM'di — yani hastanın gördüğü hemen
 * her şey.
 *
 * Ölçüt dili İKİYE bölen her koşulu yasaklıyor. Çeviri `t()` ile, tarih ve
 * ad biçimleri `Intl` ile yapılır; ikisi de dokuz dili de bilir.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../..');

/** Yorumlar hariç kaynak — bu kuralı ANLATAN yorumlar da desene uyuyor. */
function yorumsuz(kaynak) {
  return kaynak
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function dosyalar(dizin) {
  const bulunan = [];
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name.startsWith('.') || g.name === '__tests__' || g.name === 'node_modules') continue;
    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) bulunan.push(...dosyalar(tam));
    else if (/\.jsx?$/.test(g.name) && statSync(tam).isFile()) bulunan.push(tam);
  }
  return bulunan;
}

/**
 * `geo.js` muaf: oradaki `isTr`, ARAYÜZ dilini değil, bir ÜLKENİN Türkiye
 * olup olmadığını soruyor. Aynı ada sahip, başka bir soru.
 */
const MUAF = new Set(['geo.js']);

const DESENLER = [
  { ad: 'dili ikiye bölen değişken', re: /\b(?:const|let)\s+\w*[iI]sTr\w*\s*=\s*[^;]*\blanguage\b/ },
  { ad: "dil karşılaştırması: === 'tr'", re: /\blanguage\s*(?:\?\.)?\s*(?:===|==)\s*['"]tr/ },
  { ad: "startsWith('tr') üçlü koşulda", re: /startsWith\(\s*['"]tr['"]\s*\)[^;\n]{0,80}\?/ },
];

test('hiçbir ekran dili Türkçe/başkası diye ikiye bölmüyor', () => {
  const suclu = [];

  for (const yol of dosyalar(kok)) {
    if (MUAF.has(path.basename(yol))) continue;
    const kaynak = yorumsuz(readFileSync(yol, 'utf8'));

    for (const { ad, re } of DESENLER) {
      if (re.test(kaynak)) {
        suclu.push(`${path.relative(kok, yol)} — ${ad}`);
      }
    }
  }

  assert.deepEqual(
    suclu,
    [],
    'Metin dile göre t() ile, biçimler Intl ile seçilir; iki dallı koşul ' +
      'diğer yedi dili İngilizceye düşürür:\n  ' + suclu.join('\n  '),
  );
});

test('tarama gerçekten dosya okuyor', () => {
  // Desen ya da yürüyüş bozulursa denetim boş küme üzerinde yeşil yanardı.
  const hepsi = dosyalar(kok);
  assert.ok(hepsi.length > 200, `beklenmedik dosya sayısı: ${hepsi.length}`);
  assert.ok(
    hepsi.some((y) => y.endsWith('PatientAppointments.jsx')),
    'düzeltilen ekranlardan biri taramada yok',
  );
});
