import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Sayfa HTML'i ile site haritası aynı hreflang kümesini vermeli.
 *
 * Dokuz dilli bir sitede hreflang, arama motoruna "bu sayfalar aynı içeriğin
 * farklı dilleri" demenin yolu. İki yerden birden bildiriliyor: sayfanın kendi
 * `<head>`'i ve site haritası.
 *
 * Google ikisinin UYUŞMASINI bekliyor. Uyuşmadığında tek bir etiketi düzeltmek
 * yerine kümenin tamamını yok sayabiliyor — yani dokuz dilin birbirine
 * bağlanması da boşa gidiyor.
 *
 * Ölçüldü: sayfalar on alternatif veriyordu (dokuz dil + `x-default`), site
 * haritası dokuz. `x-default`, dokuz dilden hiçbirini konuşmayan ziyaretçi için
 * hangi sayfanın gösterileceğini söylüyor; onsuz seçim arama motoruna kalıyor.
 *
 * Ayrışma sessiz: yeni bir dil eklenince biri güncellenip diğeri unutulur ve
 * hiçbir şey hata vermez.
 */

const buDosya = fileURLToPath(import.meta.url);
const libKok = path.resolve(path.dirname(buDosya), '..');
const uygulamaKok = path.resolve(libKok, '../..');

const seo = readFileSync(path.join(libKok, 'seo-server.js'), 'utf8');
const harita = readFileSync(path.join(uygulamaKok, 'app/sitemap.js'), 'utf8');

test('sayfa üreteci x-default veriyor', () => {
  assert.match(
    seo,
    /languages\['x-default'\]\s*=/,
    'sayfaların `<head>`inde x-default yok: yedek sayfa seçimi arama motoruna kalır',
  );
});

test('site haritası da x-default veriyor', () => {
  assert.match(
    harita,
    /languages\['x-default'\]\s*=/,
    'site haritasında x-default yok: sayfayla uyuşmuyor, küme tümüyle yok sayılabilir',
  );
});

test('iki kaynak x-default için aynı hedefi gösteriyor', () => {
  // Farklı hedefler göstermek, uyuşmazlığın daha sinsi hâli: her iki kaynak da
  // geçerli görünür ama birbirini yalanlar.
  const seoHedef = (seo.match(/languages\['x-default'\]\s*=\s*`([^`]+)`/) || [])[1];
  const haritaHedef = (harita.match(/languages\['x-default'\]\s*=\s*`([^`]+)`/) || [])[1];

  assert.ok(seoHedef, 'seo-server içinde x-default hedefi okunamadı');
  assert.ok(haritaHedef, 'sitemap içinde x-default hedefi okunamadı');

  const sadelestir = (x) => x.replace(/\$\{(SITE_URL|DEFAULT_LOCALE)\}/g, '$1').replace(/\$\{(clean|p)\}/g, 'YOL');

  assert.equal(
    sadelestir(seoHedef),
    sadelestir(haritaHedef),
    `x-default iki kaynakta farklı hedefe bakıyor:\n  sayfa : ${seoHedef}\n  harita: ${haritaHedef}`,
  );
});

test('site haritası hreflang kümesini tek yerden kuruyor', () => {
  // İkinci bir kurulum noktası, birinin güncellenip diğerinin unutulması
  // demek — bu testin koruduğu ayrışmanın ta kendisi.
  const kurulumSayisi = (harita.match(/languages\[loc\]\s*=/g) || []).length;

  assert.equal(kurulumSayisi, 1, 'site haritasında birden fazla hreflang kurulum noktası var');
});

test('x-default varsayılan dile bakıyor', () => {
  // Yedek sayfa, sitenin ana dilinde olmalı; rastgele bir dil değil.
  for (const [ad, metin] of [['seo-server', seo], ['sitemap', harita]]) {
    assert.match(
      metin,
      /languages\['x-default'\]\s*=\s*`\$\{SITE_URL\}\/\$\{DEFAULT_LOCALE\}/,
      `${ad}: x-default varsayılan dile bakmıyor`,
    );
  }
});
