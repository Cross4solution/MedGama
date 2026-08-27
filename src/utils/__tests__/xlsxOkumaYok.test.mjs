import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * `xlsx` ile dosya OKUNMUYOR — yalnız yazılıyor.
 *
 * Paketin npm'deki sürümünde bilinen açıklar var (prototip kirlenmesi, ReDoS)
 * ve npm tarafında DÜZELTMESİ YOK: üretici dağıtımı kendi adresine taşıdı,
 * npm'deki sürüm 0.18.5'te dondu.
 *
 * Açıkların ikisi de ÇÖZÜMLEME sırasında tetikleniyor — yani saldırganın
 * hazırladığı bir dosya okunduğunda. Bu uygulama yalnızca kendi verisinden
 * sayfa kurup dosya yazıyor (`book_new`, `aoa_to_sheet`, `writeFile`);
 * hiçbir yerde `XLSX.read` ya da `readFile` çağrılmıyor. Ölçüldü, ve gerçek
 * maruziyet bu yüzden yok.
 *
 * Bu ölçüt o dayanağı koruyor. Biri "kullanıcı Excel yükleyebilsin" diye bir
 * özellik eklediği anda, maruziyet YOK olmaktan çıkıp VAR olur ve bu test
 * kırmızıya döner. Karar o noktada yeniden verilmelidir: üreticinin kendi
 * dağıtımına geçmek ya da başka bir kütüphane.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../..');

function kaynakDosyalari(dizin) {
  const bulunan = [];
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name.startsWith('.') || g.name === '__tests__' || g.name === 'node_modules') continue;
    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) bulunan.push(...kaynakDosyalari(tam));
    else if (/\.jsx?$/.test(g.name) && statSync(tam).isFile()) bulunan.push(tam);
  }
  return bulunan;
}

/** Yorumsuz kaynak — bu açıklama yasakladığı çağrının adını taşıyor. */
const yorumsuz = (kaynak) => kaynak
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('hiçbir yerde xlsx ile dosya çözümlenmiyor', () => {
  const suclu = [];

  for (const yol of kaynakDosyalari(kok)) {
    const kaynak = yorumsuz(readFileSync(yol, 'utf8'));

    if (/\bXLSX\s*\.\s*(read|readFile)\s*\(/.test(kaynak)) {
      suclu.push(path.relative(kok, yol));
    }
  }

  assert.deepEqual(
    suclu,
    [],
    'xlsx ile dosya çözümleniyor. Paketin npm sürümünde düzeltilmemiş açıklar '
      + 'var ve ikisi de tam olarak çözümleme sırasında tetikleniyor:\n  '
      + suclu.join('\n  '),
  );
});

test('yazma yolu hâlâ kullanılıyor', () => {
  // Aşırı kilitlemenin ölçütü: paket tümüyle kaldırılmışsa bu test artık bir
  // şey korumuyordur ve kaldırılmalıdır.
  const kaynak = readFileSync(path.join(kok, 'utils/exportUtils.js'), 'utf8');

  assert.match(kaynak, /XLSX\s*\.\s*writeFile\s*\(/, 'Excel dışa aktarma kaldırılmış — bu ölçüt güncellenmeli');
});
