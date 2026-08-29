// JSX özniteliğinde `t(...)` süslü parantez İSTER.
//
// Çeviri işi metin değiştirerek yapılıyor ve tırnak temelli değiştirme
// öznitelik konumunda sessizce bozuluyor:
//
//     title="Hasta gelmedi olarak işaretle"   →   title=t('ortak.gelmedi')
//
// İkincisi geçerli JSX değil. Ölçüldüğünde bu hata YEDİ dosyada, dokuz
// yerde vardı ve bir kısmı çoktan işlenmişti — derleme onları yakaladığında
// hata mesajı bambaşka bir yeri işaret ediyordu ("Expected '</', got 't'"),
// yani sebebi bulmak kolay değildi.
//
// Bu ölçüt derlemeden önce ve doğrudan sebebi göstererek uyarır.
import { readFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function jsxDosyalari(dizin, biriken = []) {
  for (const ad of readdirSync(dizin)) {
    if (ad === 'node_modules' || ad === '.next' || ad === '.git') continue;
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) jsxDosyalari(yol, biriken);
    else if (ad.endsWith('.jsx')) biriken.push(yol);
  }
  return biriken;
}

test('JSX özniteliklerinde t(...) süslü parantez içinde', () => {
  // `title=t(` gibi; doğrusu `title={t(`.
  const bozuk = /\b(title|placeholder|alt|aria-label|label|value|content)=t\(/;

  const bulunanlar = [];
  for (const kok of ['src', 'app']) {
    for (const yol of jsxDosyalari(resolve(KOK, kok))) {
      const satirlar = readFileSync(yol, 'utf8').split('\n');
      satirlar.forEach((satir, i) => {
        if (bozuk.test(satir)) {
          bulunanlar.push(`  ${yol.replace(KOK + '/', '')}:${i + 1}  ${satir.trim().slice(0, 70)}`);
        }
      });
    }
  }

  assert.deepEqual(
    bulunanlar,
    [],
    'JSX özniteliğinde süslü parantezsiz `t(...)` var — derleme kırılır:\n'
    + bulunanlar.join('\n')
    + '\n\nDoğrusu: title={t(\'anahtar\')}',
  );
});
