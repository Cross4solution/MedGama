// `t(...)` çağrısı, `t`'nin GERÇEKTEN tanımlı olduğu yerde olmalı.
//
// Bu, bugün canlıya çıkan bir hatanın ölçütü. `LanguageSwitcher`
// `useTranslation()`'dan yalnız `i18n` alıyordu, `t` almıyordu; oraya
// eklenen `t('ortak.dilSecimi')` tanımsız bir değişkendi. Bileşen site
// çerçevesinin içinde olduğu için ÇERÇEVE ÇİZEN HER SAYFA çöktü —
// /login ve /register çerçeve çizmediği için ayakta kaldı ve sorun ilk
// bakışta rastgele göründü.
//
// Neden derleme ve birim testler yakalamadı: sözdizimi kusursuz.
// `t(...)` geçerli bir çağrı, yalnız `t` yok. Hata ancak bileşen
// ÇİZİLDİĞİNDE ortaya çıkıyor.
//
// Aynı sınıfın ikinci hâli: modül düzeyindeki sabitler. Bileşen dışında
// `t` hiçbir zaman kapsamda olmaz; oradaki diziler metin değil ANAHTAR
// tutmalı ve çeviri kullanım anında yapılmalı. Bugün dört dosyada çıktı
// (CRMReports, CookieBanner, CRMDocuments, Vasco örnekleri).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function jsxDosyalari(dizin, biriken = []) {
  for (const ad of readdirSync(dizin)) {
    if (['node_modules', '.next', '.git', '__tests__'].includes(ad)) continue;
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) jsxDosyalari(yol, biriken);
    else if (ad.endsWith('.jsx')) biriken.push(yol);
  }
  return biriken;
}

/** Dosyada `t(` çağrısı geçen satırlar (yorumlar ve `i18n.t` hariç). */
function tCagrilari(kaynak) {
  const govde = kaynak
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return govde.split('\n').map((satir, i) => ({ no: i + 1, satir }))
    .filter(({ satir }) => /(^|[^\w.])t\(\s*['"`]/.test(satir));
}

test('t(...) kullanan her dosya t\'yi gerçekten alıyor', () => {
  const eksik = [];

  for (const kok of ['src', 'app']) {
    for (const yol of jsxDosyalari(resolve(KOK, kok))) {
      const kaynak = readFileSync(yol, 'utf8');
      if (tCagrilari(kaynak).length === 0) continue;

      // `t` şu yollardan biriyle gelmeli:
      const alinmis =
        /const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation\(/.test(kaynak)  // kancadan
        || /\(\s*\{[^}]*\bt\b[^}]*\}\s*\)\s*=>/.test(kaynak)                // prop olarak
        || /function\s+\w+\s*\(\s*\{[^}]*\bt\b/.test(kaynak)                // prop olarak
        || /\bt\s*[,)]/.test(kaynak.match(/function\s+\w+\([^)]*\)/)?.[0] ?? '') // düz parametre
        || /\bconst\s+t\s*=/.test(kaynak);                                   // elle tanımlı

      if (!alinmis) {
        eksik.push(`  ${yol.replace(KOK + '/', '')}  →  t hiç alınmıyor`);
      }
    }
  }

  assert.deepEqual(
    eksik,
    [],
    'Bu dosyalar `t(...)` çağırıyor ama `t`\'yi hiçbir yerden almıyor.\n'
    + 'Çizildiklerinde "t is not defined" ile çökerler; derleme bunu\n'
    + 'yakalamaz çünkü sözdizimi doğrudur:\n' + eksik.join('\n')
    + '\n\nÇözüm: const { t } = useTranslation();'
    + '\nModül düzeyindeki sabitlerde ise metin değil ANAHTAR tutun.',
  );
});
