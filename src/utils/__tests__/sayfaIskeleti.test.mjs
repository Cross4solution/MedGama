import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Her sayfanın taşıması gereken şey: ana içerik alanı (`<main id="icerik">`).
 * (Atlama bağlantısı müşteri isteğiyle kaldırıldı — dosyanın sonundaki not.)
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

// Atlama bağlantısı ("İçeriğe geç") 7 Eylül 2026'da MÜŞTERİ İSTEĞİYLE
// kaldırıldı (a1eb711). Ona ait dört ölçüt de silindi; `<main id="icerik">`
// ölçütleri duruyor — ekran okuyucunun "ana içeriğe git" komutu ve bağlantı
// geri gelirse hedefi hâlâ bu. Bedeli: WCAG 2.4.1 karşılanmıyor.
