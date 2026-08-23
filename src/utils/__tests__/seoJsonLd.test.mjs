import test from 'node:test';
import assert from 'node:assert/strict';

import { jsonLdString } from '../../lib/seo-server.js';

/**
 * JSON-LD çıktısı — uygulamadaki TEK XSS yüzeyi.
 *
 * Kod tabanında `dangerouslySetInnerHTML` 15 yerde geçiyor ve hepsi bu
 * fonksiyondan geçiyor. İçine giren veri kullanıcı denetiminde: hekim ve
 * klinik adları, SSS soru/cevapları. Çıktı da herkese açık sayfalarda,
 * `<script type="application/ld+json">` bloğunun içinde.
 *
 * Tarayıcı bir script bloğunu ilk `</script>` dizisinde kapatıyor — dizge
 * içinde bile. Yani kaçış olmadan, adında `</script><script>...` geçen bir
 * hekim kaydı her ziyaretçide kod çalıştırır.
 *
 * Savunma tek satır: `<` → `<`. Bu testler o satırı çiviliyor; bir
 * "sadeleştirme" onu kaldırırsa burada kırılır.
 */

test('script bloğu kapatılamıyor', () => {
  const cikti = jsonLdString({ name: '</script><script>alert(1)</script>' });

  // Asıl ölçüt: çıktıda ham `</script>` KALMAMALI.
  assert.ok(!cikti.includes('</script>'), `ham script kapanışı sızdı: ${cikti}`);
  assert.ok(cikti.includes('\\u003c'), 'küçüktür işareti kaçırılmamış');
});

test('hiçbir ham küçüktür işareti kalmıyor', () => {
  const cikti = jsonLdString({
    name: 'Dr. <b>Kalın</b>',
    aciklama: '<img src=x onerror=alert(1)>',
    sss: [{ soru: '<svg/onload=alert(1)>', cevap: 'a < b' }],
  });

  assert.ok(!cikti.includes('<'), `ham < karakteri kaldı: ${cikti}`);
});

test('çıktı hâlâ geçerli JSON', () => {
  // Kaçış JSON'u bozmamalı: bozarsa yapılandırılmış veri sessizce geçersiz
  // olur ve arama motorları sayfayı görmezden gelir.
  const kaynak = {
    '@type': 'Physician',
    name: 'Dr. Çiğdem <Şahin>',
    description: 'Kalp & damar — "uzman" tanımı',
  };

  const cozulmus = JSON.parse(jsonLdString(kaynak));

  assert.equal(cozulmus.name, 'Dr. Çiğdem <Şahin>', 'veri kaçış sırasında bozuldu');
  assert.equal(cozulmus['@type'], 'Physician');
  assert.equal(cozulmus.description, 'Kalp & damar — "uzman" tanımı');
});

test('Türkçe karakterler korunuyor', () => {
  // Kaçış yalnız `<` üzerinde olmalı; Türkçe harfleri bozarsa yapılandırılmış
  // veride hekim adı yanlış görünür.
  const cozulmus = JSON.parse(jsonLdString({ name: 'Işıl Öğütçü Şahin' }));

  assert.equal(cozulmus.name, 'Işıl Öğütçü Şahin');
});

test('iç içe ve dizi alanlar da kaçırılıyor', () => {
  // Kaçış JSON.stringify SONRASI tüm metne uygulanıyor; iç içe yapıların
  // atlanmadığı doğrulanıyor.
  const cikti = jsonLdString({
    a: { b: { c: '</script>' } },
    d: ['<x>', { e: '</script>' }],
  });

  assert.ok(!cikti.includes('<'), 'iç içe alanda ham < kaldı');
});

test('boş ve tanımsız girdi çökmüyor', () => {
  // Sayfa bileşeni bunu doğrudan render ediyor; istisna sayfayı düşürür.
  assert.equal(typeof jsonLdString({}), 'string');
  assert.equal(typeof jsonLdString(null), 'string');
});
