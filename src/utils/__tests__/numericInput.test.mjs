import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blockNonNumeric,
  blockNonNumericInt,
  sanitizeNumeric,
  sanitizeInt,
} from '../numericInput.js';

/**
 * Sayı alanlarındaki tuş ve girdi süzgeçleri.
 *
 * `type="number"` alanlar tarayıcıda `e`, `E`, `+` kabul ediyor. Bunlar
 * yazıldığında alanın değeri tarayıcı tarafından GEÇERSİZ sayılıyor ve
 * `value` boş dizgeye düşüyor — kullanıcı ekranda bir şey yazdığını görüyor
 * ama form boş gönderiyor. Bu süzgeçlerin işi tam olarak bunu engellemek.
 *
 * Alanlar fatura tutarı ve miktar alanları (CRM faturalama), yani sessiz bir
 * boşalma doğrudan yanlış fatura demek.
 */

/** Tuş olayı taklidi — engellendi mi diye bakılıyor. */
const tus = (key) => {
  let engellendi = false;
  return {
    olay: { key, preventDefault: () => { engellendi = true; } },
    engellendiMi: () => engellendi,
  };
};

const engellerMi = (islev, key) => {
  const { olay, engellendiMi } = tus(key);
  islev(olay);
  return engellendiMi();
};

test('bilimsel gösterim ve artı işareti engelleniyor', () => {
  // `1e5` yazan kullanıcının alanı tarayıcı tarafından boşaltılır.
  for (const key of ['e', 'E', '+']) {
    assert.equal(engellerMi(blockNonNumeric, key), true, `engellenmedi: ${key}`);
  }
});

test('rakam ve ondalık ayırıcı engellenmiyor', () => {
  // Ters uç: süzgeç fazla sıkı olursa tutar hiç yazılamaz.
  for (const key of ['0', '5', '9', '.', ',']) {
    assert.equal(engellerMi(blockNonNumeric, key), false, `yanlışlıkla engellendi: ${key}`);
  }
});

test('gezinme tuşları engellenmiyor', () => {
  // Backspace engellenirse kullanıcı yazdığını silemez.
  for (const key of ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter']) {
    assert.equal(engellerMi(blockNonNumeric, key), false, `yanlışlıkla engellendi: ${key}`);
  }
});

test('tam sayı alanında ondalık ve eksi de engelleniyor', () => {
  for (const key of ['e', 'E', '+', '.', ',', '-']) {
    assert.equal(engellerMi(blockNonNumericInt, key), true, `engellenmedi: ${key}`);
  }
});

test('tam sayı alanında rakamlar geçiyor', () => {
  for (const key of ['0', '7', '9', 'Backspace']) {
    assert.equal(engellerMi(blockNonNumericInt, key), false, `yanlışlıkla engellendi: ${key}`);
  }
});

// ── Yapıştırma sonrası temizlik ──

const temizle = (islev, deger) => {
  const olay = { target: { value: deger } };
  islev(olay);
  return olay.target.value;
};

test('yapıştırılan metinden sayı dışı karakterler atılıyor', () => {
  // Tuş süzgeci yapıştırmayı yakalamıyor; temizleyici o boşluğu kapatıyor.
  assert.equal(temizle(sanitizeNumeric, '1 200,50 TL'), '120050');
  assert.equal(temizle(sanitizeNumeric, 'abc123.45'), '123.45');
  assert.equal(temizle(sanitizeNumeric, '1e5'), '15');
});

test('tam sayı temizleyicisi nokta ve eksiyi de atıyor', () => {
  assert.equal(temizle(sanitizeInt, '12.5'), '125');
  assert.equal(temizle(sanitizeInt, '-30'), '30');
  assert.equal(temizle(sanitizeInt, '1 000'), '1000');
});

test('temiz değer değiştirilmiyor', () => {
  assert.equal(temizle(sanitizeNumeric, '1234.56'), '1234.56');
  assert.equal(temizle(sanitizeInt, '42'), '42');
});

test('boş değer çökmüyor', () => {
  assert.equal(temizle(sanitizeNumeric, ''), '');
  assert.equal(temizle(sanitizeInt, ''), '');
});
