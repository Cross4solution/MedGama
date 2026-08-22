import test from 'node:test';
import assert from 'node:assert/strict';

import resolveStorageUrl from '../resolveStorageUrl.js';

/**
 * Depolama adresi çözümleyicisi.
 *
 * Çıktısı çoğunlukla <img src> içine giriyor ama İKİ yerde <a href> içine de
 * konuyor (DoctorProfile ve klinik genel bakış sekmesindeki sertifika
 * bağlantıları). Bu yüzden girdinin nereden geldiği önemli: değerler sunucudan,
 * yani kullanıcının doldurduğu alanlardan geliyor.
 *
 * Buradaki asıl güvence, adres şemasının kullanıcı tarafından seçilememesi:
 * "javascript:" ile başlayan bir değer bağlantıya olduğu gibi geçerse,
 * tıklayan kişinin oturumunda kod çalışır.
 */

test('javascript: şeması bağlantıya geçmiyor', () => {
  // Olduğu gibi dönseydi <a href="javascript:..."> üretilirdi.
  for (const kotu of ['javascript:alert(1)', 'JavaScript:alert(1)', 'vbscript:msgbox(1)']) {
    const sonuc = resolveStorageUrl(kotu);
    assert.ok(
      !sonuc.toLowerCase().startsWith('javascript:') && !sonuc.toLowerCase().startsWith('vbscript:'),
      `şema olduğu gibi geçti: ${sonuc}`,
    );
  }
});

test('mutlak http adresleri olduğu gibi dönüyor', () => {
  // Arka uç bazı alanları zaten tam adres olarak veriyor.
  assert.equal(
    resolveStorageUrl('https://cdn.ornek.test/a.jpg'),
    'https://cdn.ornek.test/a.jpg',
  );
});

test('blob ve data adresleri korunuyor', () => {
  // Yükleme öncesi yerel önizleme bunlara dayanıyor; bozulursa kullanıcı
  // seçtiği görseli göremez.
  assert.equal(resolveStorageUrl('blob:http://localhost/abc'), 'blob:http://localhost/abc');
  assert.ok(resolveStorageUrl('data:image/png;base64,iVBOR').startsWith('data:image/png'));
});

test('boş ve geçersiz değerler yedek görsele düşüyor', () => {
  const yedek = '/images/default/default-avatar.svg';
  assert.equal(resolveStorageUrl(null), yedek);
  assert.equal(resolveStorageUrl(''), yedek);
  assert.equal(resolveStorageUrl('   '), yedek);
  assert.equal(resolveStorageUrl(42), yedek);
  assert.equal(resolveStorageUrl({}), yedek);
});

test('özel yedek görsel kullanılabiliyor', () => {
  assert.equal(resolveStorageUrl(null, '/images/klinik.svg'), '/images/klinik.svg');
});

test('çift /storage/storage/ öneki sadeleşiyor', () => {
  // Arka uç bir dönem yolu iki kez ekliyordu; savunma burada duruyor.
  const sonuc = resolveStorageUrl('/storage/storage/avatars/a.webp');
  assert.ok(!sonuc.includes('/storage/storage/'), `çift önek kaldı: ${sonuc}`);
  assert.ok(sonuc.endsWith('/storage/avatars/a.webp'));
});

test('çıplak dosya adı storage altına alınıyor', () => {
  const sonuc = resolveStorageUrl('avatars/uuid_medium.webp');
  assert.ok(sonuc.endsWith('/storage/avatars/uuid_medium.webp'), `beklenmedik: ${sonuc}`);
});

test('uygulama içi yollar olduğu gibi kalıyor', () => {
  // "/images/..." zaten ön yüzün kendi varlığı; storage altına alınmamalı.
  assert.equal(resolveStorageUrl('/images/logo.svg'), '/images/logo.svg');
});
