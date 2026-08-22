import test from 'node:test';
import assert from 'node:assert/strict';

import { slugify, trName, matchBySlug } from '../../lib/slug.js';

/**
 * Slug üretimi — programatik SEO sayfalarının adresi buradan çıkıyor
 * (tedaviler/[uzmanlık]/[şehir]).
 *
 * Yanlış bir slug sessizdir: sayfa 404 verir ya da yanlış uzmanlığa açılır,
 * ama hiçbir yerde hata görünmez. Ters eşleme (`matchBySlug`) da aynı
 * dönüşümü kullanıyor, yani slugify'daki bir değişiklik ADRESLERİ ve
 * ÇÖZÜMLEMEYİ birlikte kaydırır — eski bağlantılar kırılır.
 */

test('Türkçe karakterler ASCII karşılığına çevriliyor', () => {
  assert.equal(slugify('Kadın Hastalıkları'), 'kadin-hastaliklari');
  assert.equal(slugify('Göğüs Cerrahisi'), 'gogus-cerrahisi');
  assert.equal(slugify('Çocuk Sağlığı'), 'cocuk-sagligi');
});

test('noktasız ı ve büyük İ doğru katlanıyor', () => {
  // Türkçe'nin klasik tuzağı: düz toLowerCase 'I' → 'i' yapar ama 'İ' için
  // birleşik nokta bırakır ve slug'a sızar.
  assert.equal(slugify('Işıl'), 'isil');
  assert.equal(slugify('İstanbul'), 'istanbul');
  assert.equal(slugify('IĞDIR'), 'igdir');

  // Slug'da ASCII dışı hiçbir şey kalmamalı.
  for (const ad of ['Işıl', 'İstanbul', 'Şırnak', 'Çanakkale', 'Öğretmen']) {
    assert.match(slugify(ad), /^[a-z0-9-]+$/, `ASCII dışı karakter kaldı: ${slugify(ad)}`);
  }
});

test('boşluk ve noktalama tek tireye iniyor', () => {
  assert.equal(slugify('Göz   Hastalıkları'), 'goz-hastaliklari');
  assert.equal(slugify('Kulak, Burun & Boğaz'), 'kulak-burun-bogaz');
  assert.equal(slugify('Diş / Ağız'), 'dis-agiz');
});

test('baştaki ve sondaki tireler kırpılıyor', () => {
  // Kırpılmazsa adres "/tedaviler/-kardiyoloji-" olur ve eşleşme tutmaz.
  assert.equal(slugify('  Kardiyoloji  '), 'kardiyoloji');
  assert.equal(slugify('...Ortopedi!!!'), 'ortopedi');
});

test('boş ve tanımsız girdi çökmüyor', () => {
  // Çağıran bunu doğrudan adrese koyuyor.
  assert.equal(slugify(''), '');
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
});

test('Türkçe ad tercih ediliyor, yoksa sırayla geri düşüyor', () => {
  assert.equal(trName({ name_translations: { tr: 'Kardiyoloji', en: 'Cardiology' } }), 'Kardiyoloji');
  assert.equal(trName({ name: 'Kardiyoloji', name_translations: { en: 'Cardiology' } }), 'Kardiyoloji');
  assert.equal(trName({ name_translations: { en: 'Cardiology' } }), 'Cardiology');
  assert.equal(trName(null), '');
});

test('slug ile katalog kaydı bulunuyor', () => {
  const liste = [
    { code: 'CARD', name_translations: { tr: 'Kardiyoloji', en: 'Cardiology' } },
    { code: 'DERM', name_translations: { tr: 'Cildiye', en: 'Dermatology' } },
  ];

  assert.equal(matchBySlug(liste, 'kardiyoloji')?.code, 'CARD');
  assert.equal(matchBySlug(liste, 'cildiye')?.code, 'DERM');
});

test('İngilizce ada ve koda göre de eşleşiyor', () => {
  // Eski bağlantılar İngilizce slug taşıyabiliyor; geri düşüş olmasa
  // sessizce 404 olurlardı.
  const liste = [{ code: 'CARD', name_translations: { tr: 'Kardiyoloji', en: 'Cardiology' } }];

  assert.equal(matchBySlug(liste, 'cardiology')?.code, 'CARD');
  assert.equal(matchBySlug(liste, 'card')?.code, 'CARD');
});

test('eşleşme yoksa null dönüyor', () => {
  // Yanlış bir kayda düşmek 404'ten kötü: hasta yanlış uzmanlık sayfasında
  // randevu arar.
  const liste = [{ code: 'CARD', name_translations: { tr: 'Kardiyoloji' } }];

  assert.equal(matchBySlug(liste, 'ortopedi'), null);
  assert.equal(matchBySlug(liste, ''), null);
  assert.equal(matchBySlug(null, 'kardiyoloji'), null);
});

test('üretilen slug geri eşleşiyor', () => {
  // Asıl güvence: slugify ile matchBySlug aynı dönüşümü kullanmalı.
  // Ayrışırlarsa üretilen adresler kendi sayfalarını bulamaz.
  const liste = [
    { code: 'KDN', name_translations: { tr: 'Kadın Hastalıkları' } },
    { code: 'GGS', name_translations: { tr: 'Göğüs Cerrahisi' } },
    { code: 'CCK', name_translations: { tr: 'Çocuk Sağlığı ve Hastalıkları' } },
  ];

  for (const kayit of liste) {
    const uretilen = slugify(trName(kayit));
    assert.equal(
      matchBySlug(liste, uretilen)?.code,
      kayit.code,
      `üretilen slug kendi kaydını bulamadı: ${uretilen}`,
    );
  }
});
