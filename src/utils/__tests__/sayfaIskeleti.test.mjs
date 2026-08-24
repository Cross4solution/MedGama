import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Her sayfanın taşıması gereken iki şey: ana içerik alanı ve ona atlama yolu.
 *
 * Ölçüldü: altı sayfanın hiçbirinde `<main>` yoktu ve hiçbirinde atlama
 * bağlantısı yoktu. Ana sayfada 160 odaklanabilir denetim var ve büyük kısmı
 * her sayfada tekrar eden menü — klavyeyle ya da ekran okuyucuyla gelen biri,
 * okumak istediği metne varmak için o menünün tamamını geçmek zorundaydı. Her
 * seferinde.
 *
 * `<main>` ayrıca ekran okuyucunun "ana içeriğe git" komutunun hedefi. Yoksa o
 * komut hiçbir şey yapmıyor.
 *
 * Üçü birlikte gerekiyor ve üçü de tek satırla geri alınabilir, o yüzden üçü de
 * ayrı ayrı test ediliyor: bağlantının varlığı, hedefin varlığı, hedefin
 * ODAKLANABİLİR olması.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

const kabuk = readFileSync(path.join(kok, 'app/SiteChrome.jsx'), 'utf8');

/** Kabuğun iki render dalı var: normal site ve medstream alan adı. */
const DAL_SAYISI = 2;

test('her dalda ana içerik alanı var', () => {
  const main = [...kabuk.matchAll(/<main\b/g)].length;

  assert.equal(
    main,
    DAL_SAYISI,
    `Kabukta ${main} adet <main> var, ${DAL_SAYISI} olmalı: bir dal ana içerik alanı olmadan render ediliyor.`,
  );
});

test('ana içerik alanı atlamanın hedefi', () => {
  const hedef = [...kabuk.matchAll(/<main[^>]*id="icerik"/g)].length;

  assert.equal(hedef, DAL_SAYISI, 'bir dalda `id="icerik"` yok: atlama bağlantısı boşa düşer');
});

test('ana içerik alanı odak alabiliyor', () => {
  // `tabIndex={-1}` olmadan bağlantı sayfayı kaydırıyor ama odak bağlantıda
  // kalıyor: ekran okuyucu içeriğin başından değil, menüden okumaya devam
  // ediyor. Ölçüldü.
  const odaklanabilir = [...kabuk.matchAll(/<main[^>]*tabIndex=\{-1\}/g)].length;

  assert.equal(odaklanabilir, DAL_SAYISI, 'bir dalda <main> odak alamıyor');
});

test('atlama bağlantısı iki dalda da render ediliyor', () => {
  assert.equal(
    [...kabuk.matchAll(/<IcerigeGec\s*\/>/g)].length,
    DAL_SAYISI,
    'bir dalda atlama bağlantısı yok',
  );
});

test('atlama bağlantısı odak sırasının başında', () => {
  // Menüden SONRA gelirse hiçbir işe yaramıyor: zaten menüyü geçmiş olmak
  // gerekiyor. Her dalda ilk render edilen şey olmalı.
  for (const dal of ['<IcerigeGec />']) {
    const yer = kabuk.indexOf(dal);
    const header = kabuk.indexOf('<Header />');

    assert.ok(yer !== -1, 'atlama bağlantısı yok');
    assert.ok(yer < header, 'atlama bağlantısı başlıktan SONRA render ediliyor');
  }
});

test('atlama bağlantısı odaklanınca görünür oluyor', () => {
  // Görünürlük `sr-only`/`not-sr-only` ikilisine bırakılamıyor: ölçüldü,
  // `focus:not-sr-only` bu kurulumda üretilmiyor ve bağlantı odaklanınca da
  // 1x1 kalıyordu. Konum temelli çözüm ve odak kuralının baskın olması
  // birlikte gerekiyor — ikisi de aynı özgüllükte ve kapalı konum sonra
  // geliyordu.
  assert.match(kabuk, /-translate-y-\[200%\]/, 'bağlantı ekran dışına alınmıyor');
  assert.match(kabuk, /focus:!translate-y-0/, 'odak kuralı baskın değil: bağlantı görünmez kalır');
});

test('atlama metni dokuz dilde de var', () => {
  // Eksik anahtar sessiz: i18next yedeğe düşer, Türk kullanıcı ekran
  // okuyucudan İngilizce duyar.
  for (const dil of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'it', 'az']) {
    const sozluk = JSON.parse(readFileSync(path.join(kok, `src/i18n/locales/${dil}.json`), 'utf8'));

    assert.ok(sozluk.a11y?.skipToContent, `${dil}.json içinde a11y.skipToContent yok`);
  }
});
