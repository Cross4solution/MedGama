import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * "Sunucuya ulaşılamadı" ile "sonuç yok" aynı ekran olmamalı.
 *
 * Arama isteği başarısız olduğunda `catch` bloğu listeyi boşaltıyordu ve ekran
 * şunu gösteriyordu:
 *
 *     "Kriterlerinize uygun doktor bulunamadı"
 *     "Filtrelerinizi veya arama terimlerinizi değiştirmeyi deneyin"
 *
 * Yani sunucu yanıt vermezken kullanıcıya ARAMASININ dar olduğu söyleniyor.
 * Uygun yüzlerce doktor olabilir; kullanıcı filtrelerle boşuna uğraşıyor,
 * sonra da aradığı doktorun burada olmadığına kanaat getiriyor. Doktor arayan
 * biri için bu, "bir şeyler ters gitti" demekten çok daha kötü.
 *
 * Ayrımı korumak iki parça istiyor ve ikisi de tek satırla geri alınabilir:
 * `catch` bayrağı kurmalı, ekran da o bayrak için AYRI bir dal taşımalı.
 */

const buDosya = fileURLToPath(import.meta.url);
const ekranlar = path.resolve(path.dirname(buDosya), '..');
const kaynakKok = path.resolve(ekranlar, '..');

const arama = readFileSync(path.join(ekranlar, 'SearchResults.jsx'), 'utf8');

test('istek başarısız olunca bağlantı hatası işaretleniyor', () => {
  assert.match(
    arama,
    /\}\s*catch\s*\{[\s\S]{0,200}?setBaglantiHatasi\(true\)/,
    '`catch` bloğu bağlantı hatasını işaretlemiyor: başarısızlık "sonuç yok" gibi görünür',
  );
});

test('yeni istekte bayrak temizleniyor', () => {
  // Temizlenmezse bir kez kopan bağlantıdan sonra ekran hep hata gösterir.
  assert.match(
    arama,
    /setLoading\(true\);\s*\n\s*setBaglantiHatasi\(false\);/,
    'yeni aramada bağlantı hatası bayrağı sıfırlanmıyor',
  );
});

test('ekranda bağlantı hatası için ayrı bir dal var', () => {
  // Aynı dalda gösterilmesi, bu hatanın ilk hâli.
  const hataDali = arama.indexOf('baglantiHatasi ? (');
  const bosDali = arama.indexOf('doctors.length === 0 ? (');

  assert.ok(hataDali !== -1, 'bağlantı hatası için ayrı dal yok');
  assert.ok(bosDali !== -1, '"sonuç yok" dalı kaybolmuş');
  assert.ok(hataDali < bosDali, 'bağlantı hatası dalı "sonuç yok"tan SONRA geliyor: hiç görünmez');
});

test('kullanıcıya yeniden deneme yolu veriliyor', () => {
  // Hata ekranı çıkmaz sokak olmamalı; tek tıkla yeniden denenebilmeli.
  const bas = arama.indexOf('baglantiHatasi ? (');
  const govde = arama.slice(bas, bas + 900);

  assert.match(govde, /onClick=\{fetch\}/, 'yeniden deneme düğmesi isteği tekrarlamıyor');
  assert.match(govde, /t\('common\.retry'\)/, 'yeniden deneme metni çeviriden gelmiyor');
});

test('hata metinleri dokuz dilde de var', () => {
  for (const dil of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'it', 'az']) {
    const sozluk = JSON.parse(readFileSync(path.join(kaynakKok, `i18n/locales/${dil}.json`), 'utf8'));

    assert.ok(sozluk.search?.connectionErrorTitle, `${dil}.json — connectionErrorTitle yok`);
    assert.ok(sozluk.search?.connectionErrorHint, `${dil}.json — connectionErrorHint yok`);
    assert.ok(sozluk.common?.retry, `${dil}.json — common.retry yok`);
  }
});
