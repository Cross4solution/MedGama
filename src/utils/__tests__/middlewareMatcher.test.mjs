import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Middleware eşleştiricisi — hangi isteklerin dil önekiyle yönlendirileceği.
 *
 * Bu tek satır canlıda bir kez hata çıkardı: `broadcasting` hariç
 * tutulmadığında kanal yetkilendirme isteği `/tr/broadcasting/auth`'a
 * yönlendiriliyor, 404 dönüyor ve GÖRÜNTÜLÜ GÖRÜŞME HİÇ KURULMUYOR.
 * Hata sessiz — sayfa açılıyor, yalnızca görüşme başlamıyor.
 *
 * `middleware.js` `next/server` içe aktardığı için düz Node testinden
 * çağrılamıyor. O yüzden desen KAYNAK DOSYADAN okunuyor: kopyası değil,
 * gerçekten çalışan ifade sınanıyor.
 */

const kok = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const kaynak = readFileSync(join(kok, 'middleware.js'), 'utf8');

function matcherDeseni() {
  const m = kaynak.match(/matcher:\s*\[\s*'([^']+)'/);
  assert.ok(m, 'middleware.js içinde matcher deseni bulunamadı');

  // Kaynak METİN olarak okunuyor, yani JS dizge kaçışları hâlâ ham:
  // dosyadaki `\\.` aslında tek bir `\.` demek. Çözülmezse düzenli ifade
  // "ters bölü + herhangi karakter" arar ve uzantı kuralı sessizce çalışmaz —
  // ilk yazımda test bu yüzden yanlış sonuç verdi.
  const desenMetni = m[1].replace(/\\\\/g, '\\');

  return new RegExp('^' + desenMetni + '$');
}

const desen = matcherDeseni();

/** Next, deseni yol adına uyguluyor; eşleşen istek middleware'den geçer. */
const gecerMi = (yol) => desen.test(yol);

test('görüntülü görüşme kanalı middleware dışında', () => {
  // ASIL REGRESYON. Bu satır kırılırsa görüntülü görüşme kurulmuyor.
  assert.equal(gecerMi('/broadcasting/auth'), false, 'broadcasting yönlendirmeye giriyor — görüşme kurulmaz');
  assert.equal(gecerMi('/broadcasting/anything'), false);
});

test('API istekleri dil önekine yönlendirilmiyor', () => {
  // /api → /tr/api olsaydı arka uca giden HER istek 404 olurdu.
  assert.equal(gecerMi('/api/auth/me'), false);
  assert.equal(gecerMi('/api/appointments'), false);
});

test('dosya sunumu ve Next iç yolları dışarıda', () => {
  assert.equal(gecerMi('/storage/medstream/gorsel.jpg'), false);
  assert.equal(gecerMi('/_next/static/chunk.js'), false);
});

test('uzantılı dosyalar dışarıda', () => {
  // favicon, sitemap, robots: dil öneki alırlarsa arama motorları ve
  // tarayıcı bunları bulamaz.
  for (const yol of ['/favicon.ico', '/robots.txt', '/sitemap.xml', '/logo.png', '/manifest.webmanifest']) {
    assert.equal(gecerMi(yol), false, `uzantılı dosya yönlendirmeye girdi: ${yol}`);
  }
});

test('normal sayfalar middleware`den geçiyor', () => {
  // Ters uç: desen fazla geniş hariç tutarsa dil yönlendirmesi HİÇ çalışmaz
  // ve site öneksiz adreste kalır. Yalnız "dışarıda kalıyor" testleri bunu
  // gizlerdi.
  for (const yol of ['/', '/tr', '/tr/medstream', '/doctor/abc-123', '/tedaviler/kardiyoloji/istanbul']) {
    assert.equal(gecerMi(yol), true, `normal sayfa middleware dışında kaldı: ${yol}`);
  }
});

test('kalıcı yönlendirme kullanılmıyor', () => {
  // Hedef dil çereze ve tarayıcı diline göre DEĞİŞİYOR. 308/301 tarayıcı ve
  // CDN tarafından önbelleğe alınır ve kullanıcıyı bir dile kilitler.
  assert.ok(
    !/NextResponse\.redirect\([^)]*,\s*\{?\s*status:\s*30[18]/.test(kaynak),
    'kalıcı yönlendirme (301/308) kullanılmış — dil seçimi önbelleğe takılır',
  );
  assert.ok(kaynak.includes('NextResponse.redirect'), 'yönlendirme hiç yapılmıyor');
});

test('dil listesi ile varsayılan tutarlı', () => {
  const liste = kaynak.match(/const LOCALES = \[([^\]]+)\]/);
  const varsayilan = kaynak.match(/const DEFAULT_LOCALE = '([a-z]{2})'/);

  assert.ok(liste && varsayilan, 'dil listesi ya da varsayılan okunamadı');
  assert.ok(
    liste[1].includes(`'${varsayilan[1]}'`),
    `varsayılan dil (${varsayilan[1]}) desteklenen diller listesinde yok`,
  );
});
