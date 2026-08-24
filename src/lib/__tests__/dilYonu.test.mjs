import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Dil listesi ile yazı yönü listesi birlikte yürümeli.
 *
 * Dokuz dilin biri sağdan sola yazılıyor. Yön `<html dir>` üzerinden
 * veriliyor ve tarayıcı gerisini kendisi çeviriyor: metin hizası, esnek
 * kutuların sırası, kaydırma yönü.
 *
 * Ölçüldü ve iyi haber: Arapça ana sayfa, kayıt formu ve akış doğru
 * aynalanıyor, yatay taşma yok. Kaynakta 132 dosyada 858 yön duyarlı sınıf
 * (`ml-`, `pl-`, `text-left`…) sayılmıştı ve bu kötü bir kestirimdi —
 * yerleşimin çoğu `gap` ve esnek kutu sırasıyla kuruluyor, ikisi de yönü
 * kendiliğinden izliyor.
 *
 * Kırılganlık listede: yeni bir dil `LOCALES`'e eklenip `RTL_LOCALES`
 * gözden kaçarsa, o dil sessizce soldan sağa render edilir. Hiçbir şey
 * hata vermez; sayfa yalnız o dili okuyan için ters durur.
 */

const buDosya = fileURLToPath(import.meta.url);
const libKok = path.resolve(path.dirname(buDosya), '..');

const { LOCALES, RTL_LOCALES, DEFAULT_LOCALE, isRtl, isLocale } = await import('../locales.js');

/** Dünyada sağdan sola yazılan diller — listeye biri eklenirse yakalanmalı. */
const BILINEN_RTL = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'dv', 'ku'];

test('sağdan sola yazılan her desteklenen dil öyle işaretli', () => {
  const kacan = LOCALES.filter((d) => BILINEN_RTL.includes(d) && !isRtl(d));

  assert.deepEqual(
    kacan,
    [],
    'Bu dil(ler) sağdan sola yazılıyor ama `RTL_LOCALES` içinde yok; sayfa ters\n'
      + 'render edilir ve hiçbir hata çıkmaz:\n  ' + kacan.join(', '),
  );
});

test('RTL listesinde desteklenmeyen dil yok', () => {
  // Ters yön: listede olup `LOCALES` içinde olmayan bir dil, kimseye
  // ulaşmayan ölü bir kayıt.
  const fazla = RTL_LOCALES.filter((d) => !isLocale(d));

  assert.deepEqual(fazla, [], 'RTL listesinde desteklenmeyen dil: ' + fazla.join(', '));
});

test('varsayılan dil soldan sağa', () => {
  assert.equal(isRtl(DEFAULT_LOCALE), false);
});

test('bilinmeyen değerler soldan sağa sayılıyor', () => {
  // `isRtl` yön kararının tek kaynağı; tanımadığı bir şeye "sağdan sola"
  // demesi, tüm sayfayı ters çevirir.
  for (const deger of [undefined, null, '', 'xx', 'TR', 'ar-SA']) {
    assert.equal(isRtl(deger), false, `beklenmedik RTL: ${JSON.stringify(deger)}`);
  }
});

test('yönü uygulayan tek yer köprü, ve `isRtl`e soruyor', () => {
  // Yön başka bir yerde elle yazılırsa iki kaynak oluşur ve biri güncellenmez.
  const kopru = readFileSync(path.resolve(libKok, '../../app/[locale]/LocaleBridge.jsx'), 'utf8');

  assert.match(kopru, /isRtl\(/, 'köprü yönü `isRtl` üzerinden almıyor');
  assert.match(kopru, /documentElement\.dir/, 'köprü `<html dir>` değerini ayarlamıyor');
});
