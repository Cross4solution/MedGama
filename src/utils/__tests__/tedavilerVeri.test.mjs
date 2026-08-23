import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProviders } from '../../lib/tedaviler-data.js';

/**
 * Tedavi sayfalarının sağlayıcı eşleşmesi (/tedaviler/[uzmanlık]/[şehir]).
 *
 * Bu sayfalar hasta çekmek için var: arama motorundan gelen biri "İstanbul'da
 * kardiyolog" arayıp buraya düşüyor. Eşleşme yanlışsa iki yönde de zarar var
 * ve ikisi de sessiz — sayfa açılıyor, sadece içindekiler yanlış.
 *
 * Şehir bilgisi hekimde YOK: `city_id` boş geliyor ve şehir yalnızca kliniğin
 * SERBEST METİN adresinde duruyor ("Levent, İstanbul, Türkiye"). Eşleşme bu
 * yüzden metin üzerinden yapılıyor, ve iki hatası ölçüldü:
 *
 *  1. AKSANSIZ YAZIM EŞLEŞMİYORDU. Adres "Levent, Istanbul" yazılmışsa
 *     `toLowerCase()` ile "İstanbul" ile eşleşmiyordu — o klinik kendi
 *     şehrinin sayfasında hiç görünmüyordu.
 *  2. ALT DİZE YANLIŞ EŞLEŞİYORDU. "Van" şehri "Divan Yolu Cad., Fatih,
 *     İstanbul" adresini eşliyordu: İstanbul'daki hekim Van sayfasında
 *     listeleniyordu.
 */

const UZMANLIK = { id: 'uzm-kardiyoloji', name: 'Kardiyoloji' };
const BASKA_UZMANLIK = { id: 'uzm-dis', name: 'Diş Hekimliği' };

const hekim = (kimlik, uzmanlikId, klinikId, opts = {}) => ({
  id: kimlik,
  fullname: `Dr. ${kimlik}`,
  city_id: opts.city_id ?? null,
  doctor_profile: { specialty_id: uzmanlikId },
  clinic: { id: klinikId, name: `Klinik ${klinikId}`, codename: `k-${klinikId}` },
});

const klinik = (kimlik, adres) => ({
  id: kimlik,
  name: `Klinik ${kimlik}`,
  fullname: `Klinik ${kimlik}`,
  codename: `k-${kimlik}`,
  address: adres,
});

test('şehir adresten eşleşiyor', () => {
  const sonuc = filterProviders({
    specialty: UZMANLIK,
    city: { id: 'ist', name: 'İstanbul' },
    doctors: [hekim('a', UZMANLIK.id, 'k1')],
    clinics: [klinik('k1', 'Levent, İstanbul, Türkiye')],
  });

  assert.equal(sonuc.doctors.length, 1);
  assert.equal(sonuc.clinics.length, 1);
});

test('aksansız yazılmış adres de eşleşiyor', () => {
  // ÖLÇÜLEN HATA 1. Serbest metin adreslerin bir kısmı ASCII yazılıyor;
  // eşleşmezse o klinik kendi şehrinin sayfasında hiç görünmüyor.
  for (const adres of ['Levent, Istanbul, Turkiye', 'Alsancak, Izmir', 'Haliliye, Sanliurfa']) {
    const sehir = adres.includes('Istanbul') ? 'İstanbul'
      : adres.includes('Izmir') ? 'İzmir' : 'Şanlıurfa';

    const sonuc = filterProviders({
      specialty: UZMANLIK,
      city: { id: 'x', name: sehir },
      doctors: [hekim('a', UZMANLIK.id, 'k1')],
      clinics: [klinik('k1', adres)],
    });

    assert.equal(sonuc.doctors.length, 1, `eşleşmedi: ${sehir} ← "${adres}"`);
  }
});

test('şehir adı başka bir kelimenin içinde geçerse eşleşmiyor', () => {
  // ÖLÇÜLEN HATA 2. İstanbul'daki hekim Van sayfasında çıkıyordu.
  const durumlar = [
    ['Van', 'Divan Yolu Cad., Fatih, İstanbul'],
    ['Van', 'Kervansaray Cad., Nevşehir'],
    ['Bolu', 'Bolulu Mah., Düzce'],
    ['Rize', 'Rizeli Sok., Ankara'],
  ];

  for (const [sehir, adres] of durumlar) {
    const sonuc = filterProviders({
      specialty: UZMANLIK,
      city: { id: 'x', name: sehir },
      doctors: [hekim('a', UZMANLIK.id, 'k1')],
      clinics: [klinik('k1', adres)],
    });

    assert.equal(sonuc.doctors.length, 0, `yanlış eşleşme: ${sehir} ← "${adres}"`);
  }
});

test('kelime sınırındaki gerçek eşleşmeler korunuyor', () => {
  // Ters uç: sınır kuralı fazla katı olursa şehir hiç bulunamaz.
  for (const adres of ['Merkez, Van', 'Van/Merkez', 'İpekyolu - Van, Türkiye', 'Van']) {
    const sonuc = filterProviders({
      specialty: UZMANLIK,
      city: { id: 'van', name: 'Van' },
      doctors: [hekim('a', UZMANLIK.id, 'k1')],
      clinics: [klinik('k1', adres)],
    });

    assert.equal(sonuc.doctors.length, 1, `gerçek eşleşme kaçtı: "${adres}"`);
  }
});

test('uzmanlığı tutmayan hekim listelenmiyor', () => {
  const sonuc = filterProviders({
    specialty: UZMANLIK,
    city: { id: 'ist', name: 'İstanbul' },
    doctors: [hekim('a', BASKA_UZMANLIK.id, 'k1')],
    clinics: [klinik('k1', 'Levent, İstanbul')],
  });

  assert.equal(sonuc.doctors.length, 0);
  assert.equal(sonuc.clinics.length, 0, 'uzmanlığı tutmayan kliniğin kendisi listelendi');
});

test('klinikler yalnızca eşleşen hekim üzerinden yüzeye çıkıyor', () => {
  // Klinik listesinde uzmanlık alanı YOK. Adrese göre klinik eşlemek, diş
  // kliniğini "Kardiyoloji" sayfasında göstermek olurdu.
  const sonuc = filterProviders({
    specialty: UZMANLIK,
    city: { id: 'ist', name: 'İstanbul' },
    doctors: [hekim('a', BASKA_UZMANLIK.id, 'k-dis')],
    clinics: [klinik('k-dis', 'Kadıköy, İstanbul'), klinik('k-bos', 'Şişli, İstanbul')],
  });

  assert.deepEqual(sonuc.clinics, []);
});

test('hekimin kendi city_id alanı da eşleşme sağlıyor', () => {
  // Adres boş olsa bile hekimde şehir varsa kullanılmalı.
  const sonuc = filterProviders({
    specialty: UZMANLIK,
    city: { id: 'ist', name: 'İstanbul' },
    doctors: [hekim('a', UZMANLIK.id, 'k1', { city_id: 'ist' })],
    clinics: [klinik('k1', '')],
  });

  assert.equal(sonuc.doctors.length, 1);
});

test('eksik ve bozuk veri çökmüyor', () => {
  // SSG üretimi sırasında çöken bir sayfa tüm derlemeyi düşürür.
  const durumlar = [
    { specialty: UZMANLIK, city: { id: 'x', name: 'Van' }, doctors: null, clinics: null },
    { specialty: null, city: null, doctors: [], clinics: [] },
    { specialty: UZMANLIK, city: { id: 'x' }, doctors: [{}], clinics: [{}] },
    { specialty: UZMANLIK, city: { id: 'x', name: 'Van' }, doctors: [hekim('a', UZMANLIK.id, null)], clinics: [] },
  ];

  for (const girdi of durumlar) {
    assert.doesNotThrow(() => filterProviders(girdi));
    const s = filterProviders(girdi);
    assert.ok(Array.isArray(s.doctors) && Array.isArray(s.clinics));
  }
});

test('aynı klinik iki kez listelenmiyor', () => {
  const sonuc = filterProviders({
    specialty: UZMANLIK,
    city: { id: 'ist', name: 'İstanbul' },
    doctors: [hekim('a', UZMANLIK.id, 'k1'), hekim('b', UZMANLIK.id, 'k1')],
    clinics: [klinik('k1', 'Levent, İstanbul')],
  });

  assert.equal(sonuc.doctors.length, 2);
  assert.equal(sonuc.clinics.length, 1, 'aynı klinik tekrar listelendi');
});
