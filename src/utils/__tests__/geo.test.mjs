import test from 'node:test';
import assert from 'node:assert/strict';
import { getFlagCode, listCountriesAll, listTurkeyProvinces } from '../geo.js';

/**
 * Ülke listesi ve bayrak kodları.
 *
 * 519 satırlık bu dosya hiç sınanmamıştı. Kayıt formu, telefon girişi ve
 * profil ekranı ülke seçimini buradan alıyor.
 *
 * Sessiz kırılma yolu şu: liste bir ülkeyi bir adla veriyor, bayrak eşlemesi
 * onu başka bir adla tanıyor. Ekranda ülke görünüyor ama bayrağı boş çıkıyor
 * ve hiçbir hata kaydı düşmüyor. Asıl ölçüt bu — tek tek ülke adı sınamak
 * değil, LİSTE ile EŞLEME arasındaki tutarlılık.
 */

test('ülke listesi boş dönmüyor', async () => {
  // Liste boşalırsa kayıt formunda ülke seçilemez ve kayıt hiç tamamlanmaz.
  const ulkeler = await listCountriesAll();

  assert.ok(Array.isArray(ulkeler), 'liste dizi değil');
  assert.ok(ulkeler.length > 50, `ülke sayısı beklenenden az: ${ulkeler.length}`);
});

test('listedeki her ülkenin bayrak kodu çözülüyor', async () => {
  // ASIL TUTARLILIK ÖLÇÜTÜ.
  const ulkeler = await listCountriesAll();

  const cozulemeyen = ulkeler
    .map((u) => (typeof u === 'string' ? u : (u?.name ?? u?.label ?? '')))
    .filter((ad) => ad && !getFlagCode(ad));

  assert.deepEqual(cozulemeyen, [], `bayrağı çözülemeyen ülkeler: ${cozulemeyen.join(', ')}`);
});

test('Türkiye her iki yazımıyla da tanınıyor', async () => {
  // Arayüz dile göre "Türkiye" ya da "Turkey" gösteriyor; ikisi de aynı
  // bayrağa gitmeli, yoksa dil değiştiren kullanıcının bayrağı kayboluyor.
  assert.equal(getFlagCode('Türkiye'), 'tr');
  assert.equal(getFlagCode('Turkey'), 'tr');
  assert.equal(getFlagCode('turkiye'), 'tr');
});

test('yaygın eşanlamlılar tanınıyor', async () => {
  assert.equal(getFlagCode('USA'), 'us');
  assert.equal(getFlagCode('United States'), 'us');
  assert.equal(getFlagCode('UK'), 'gb');
  assert.equal(getFlagCode('United Kingdom'), 'gb');
});

test('parantezli ad ve büyük/küçük harf farkı sorun değil', async () => {
  // Veri kaynakları "United States (US)" gibi adlar üretebiliyor.
  assert.equal(getFlagCode('United States (US)'), 'us');
  assert.equal(getFlagCode('GERMANY'), 'de');
  assert.equal(getFlagCode('germany'), 'de');
});

test('aksanlı yazım tanınıyor', async () => {
  // Fildişi Sahili'nin aksanlı yazımı bu dosyada özel olarak ele alınmış;
  // düşerse o ülke bayraksız kalır.
  assert.equal(getFlagCode("Côte d'Ivoire"), 'ci');
  assert.equal(getFlagCode('Ivory Coast'), 'ci');
});

test('bilinmeyen ve boş girdi null dönüyor', async () => {
  // Uydurma bir kod döndürmek yanlış bayrak göstermek demek olurdu.
  for (const girdi of ['', null, undefined, 'Bilinmeyen Ülke', '   ']) {
    assert.equal(getFlagCode(girdi), null, `beklenmedik kod: ${String(girdi)}`);
  }
});

test('bayrak kodları iki harfli küçük harf', async () => {
  // Bayrak bileşeni kodu doğrudan dosya adına koyuyor; biçim bozulursa
  // görsel 404 olur ve boş kutu görünür.
  const ulkeler = await listCountriesAll();

  const bozuk = ulkeler
    .map((u) => (typeof u === 'string' ? u : (u?.name ?? u?.label ?? '')))
    .map((ad) => getFlagCode(ad))
    .filter((kod) => kod && !/^[a-z]{2}$/.test(kod));

  assert.deepEqual(bozuk, [], `biçimi bozuk bayrak kodu: ${bozuk.join(', ')}`);
});

test('Türkiye il listesi dolu ve benzersiz', async () => {
  // Randevu ve arama ekranları il seçimini buradan alıyor.
  const iller = listTurkeyProvinces();

  assert.ok(Array.isArray(iller));
  assert.ok(iller.length >= 81, `il sayısı beklenenden az: ${iller.length}`);

  const adlar = iller.map((i) => (typeof i === 'string' ? i : (i?.name ?? i?.label ?? '')));
  assert.equal(new Set(adlar).size, adlar.length, 'il listesinde tekrar eden ad var');
});
