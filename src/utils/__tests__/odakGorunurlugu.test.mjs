import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Odak halkasını kaldıran, yerine bir şey koymayan dosya olmamalı.
 *
 * `focus:outline-none` tarayıcının odak halkasını siliyor. Halka çirkin
 * bulunduğu için sık siliniyor ve yerine bir şey konmadığında klavyeyle gezen
 * kullanıcı NEREDE olduğunu göremiyor: sekmeye basıyor, ekranda hiçbir şey
 * değişmiyor, Enter'a bastığında ne olacağını bilmiyor.
 *
 * Ölçüldü: kırk bir dosya halkayı kaldırıyordu, üçü yerine bir şey koymadan.
 * İkisi gerçek kayıptı — akışın filtre sekmeleri ve profil video kartı.
 *
 * Halka `focus-visible` ile veriliyor, `focus` ile değil: fareyle tıklayan
 * kimse halka görmüyor, klavyeyle gelen herkes görüyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const kaynakKok = path.resolve(path.dirname(buDosya), '../..');
const uygulamaKok = path.resolve(kaynakKok, '..');

/**
 * Halkasız kaldırmanın DOĞRU olduğu yerler ve nedeni.
 *
 * `SiteChrome` içindeki `<main>` yalnız "içeriğe geç" bağlantısıyla, programlı
 * olarak odaklanıyor — sekme sırasında yok. Sayfanın tamamını çerçeveleyen bir
 * halka, kullanıcının aradığı işareti vermek yerine gürültü olurdu.
 */
const MUAF = ['app/SiteChrome.jsx'];

function dosyalar(dizin, toplam = []) {
  for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
    if (['__tests__', 'node_modules', '.next'].includes(girdi.name)) continue;
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) dosyalar(tam, toplam);
    else if (/\.jsx?$/.test(girdi.name)) toplam.push(tam);
  }
  return toplam;
}

test('odak halkasını kaldıran her yer yerine bir işaret koyuyor', () => {
  const kusurlu = [];
  let tarandi = 0;

  for (const kok of [kaynakKok, path.join(uygulamaKok, 'app')]) {
    for (const yol of dosyalar(kok)) {
      const goreli = path.relative(uygulamaKok, yol);
      if (MUAF.includes(goreli)) continue;

      tarandi++;
      const metin = readFileSync(yol, 'utf8');

      if (!/focus:outline-none|\boutline-none\b/.test(metin)) continue;

      // Yerine konan işaret: halka, kendi çizgisi ya da `focus-visible` kuralı.
      const yerineVar = /focus:ring|focus-visible:|focus:border|focus:outline\b/.test(metin);

      if (!yerineVar) kusurlu.push(goreli);
    }
  }

  assert.ok(tarandi > 100, `tarama çalışmıyor: ${tarandi} dosya`);

  assert.deepEqual(
    kusurlu,
    [],
    'Odak halkası kaldırılmış ama yerine bir işaret konmamış. Klavyeyle gezen\n'
      + 'kullanıcı nerede olduğunu göremez:\n  ' + kusurlu.join('\n  '),
  );
});

test('akışın filtre sekmeleri klavyede görünür', () => {
  // Bu dosya ölçümde çıkan iki gerçek kayıptan biriydi ve akışın ana gezinme
  // yüzeyi: dört sekme, hiçbirinde odak işareti yoktu.
  const metin = readFileSync(path.join(kaynakKok, 'components/timeline/TimelineControls.jsx'), 'utf8');

  assert.doesNotMatch(metin, /focus:outline-none/, 'halka yeniden kaldırılmış');
  assert.match(metin, /focus-visible:outline/, 'sekmelerde odak işareti yok');
});

test('genel CSS odak halkasını topluca kapatmıyor', () => {
  // Tek bir `*:focus { outline: none }` kuralı, dosya dosya konan bütün
  // işaretleri anlamsız kılar.
  const css = readFileSync(path.join(kaynakKok, 'assets/index.css'), 'utf8');

  const genelKapatma = /(?:^|\n)\s*(?:\*|a|button|input|select|textarea)?\s*:focus\s*\{[^}]*outline:\s*(?:none|0)/;

  assert.doesNotMatch(css, genelKapatma, 'genel bir kural odak halkasını kapatıyor');
});
