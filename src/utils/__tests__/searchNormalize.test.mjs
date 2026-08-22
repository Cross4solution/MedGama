import test from 'node:test';
import assert from 'node:assert/strict';

import { aramaAnahtari, aramaIceriyor, aramaBasliyor } from '../searchNormalize.js';

/**
 * Türkçe arama normalleştirmesi.
 *
 * Bu dosyanın bir kez canlıyı çökerttiği oldu (eksik import), ama asıl kırılgan
 * yanı mantığı: Türkçenin noktasız ı'sı, JavaScript'in toLowerCase'i tarafından
 * doğru çevrilmiyor ve "Isparta" ile "ısparta" farklı anahtarlara düşüyor.
 * Katlama bu yüzden küçültmeden ÖNCE yapılıyor — sıra bozulursa arama sessizce
 * sonuç vermemeye başlar, hiçbir yerde hata görünmez.
 *
 * Ön yüzde birim testi yoktu; bunlar Node'un yerleşik koşucusuyla çalışıyor,
 * yeni bağımlılık yok:  npm run test:unit
 */

test('noktasız ı ve noktalı i aynı anahtara düşüyor', () => {
  const beklenen = 'isparta';
  for (const yazim of ['Isparta', 'ısparta', 'İsparta', 'isparta', 'ISPARTA']) {
    assert.equal(aramaAnahtari(yazim), beklenen, `başarısız: ${yazim}`);
  }
});

test('tüm Türkçe harfler ASCII karşılığına katlanıyor', () => {
  assert.equal(aramaAnahtari('ŞĞÜÖÇI'), 'sguoci');
  assert.equal(aramaAnahtari('şğüöçı'), 'sguoci');
  assert.equal(aramaAnahtari('Çiğdem'), 'cigdem');
});

test('büyük ve küçük Türkçe harfler aynı anahtara düşüyor', () => {
  // Kaynaktaki yorum "katlama küçültmeden ÖNCE olmalı" diyor. Sırayı ters
  // çevirip denedim: sonuç değişmiyor, çünkü NFD adımı İ'nin noktasını
  // zaten temizliyor ve harita 'i' → 'i' eşlemesini içeriyor. Sıra savunma
  // amaçlı, ama tek başına taşıyıcı değil — bunu "sıra korunuyor" diye test
  // etmek, hiçbir koşulda düşmeyen bir test yazmak olurdu.
  //
  // Asıl taşıyıcı olan şey Türkçe katlamanın KENDİSİ: kaldırılırsa 'ı'
  // olduğu gibi kalır ve "ısparta" ile "Isparta" ayrışır.
  assert.equal(aramaAnahtari('I'), aramaAnahtari('ı'));
  assert.equal(aramaAnahtari('İ'), aramaAnahtari('i'));
});

test('diğer dillerin aksanları da sadeleşiyor', () => {
  assert.equal(aramaAnahtari('café'), 'cafe');
  assert.equal(aramaAnahtari('Muñoz'), 'munoz');
  assert.equal(aramaAnahtari('Ångström'), 'angstrom');
});

test('fazla boşluk sadeleşiyor', () => {
  assert.equal(aramaAnahtari('  iki   boşluk  '), 'iki bosluk');
});

test('null ve undefined boş dize veriyor', () => {
  // Çağıranlar bu değeri doğrudan includes() içine veriyor; null dönseydi
  // çalışma anında hata olurdu.
  assert.equal(aramaAnahtari(null), '');
  assert.equal(aramaAnahtari(undefined), '');
  assert.equal(aramaAnahtari(0), '0');
});

test('içerme araması Türkçe duyarlı', () => {
  assert.equal(aramaIceriyor('Kadıköy Şubesi', 'kadikoy'), true);
  assert.equal(aramaIceriyor('Kadıköy Şubesi', 'ŞUBE'), true);
  assert.equal(aramaIceriyor('Kadıköy Şubesi', 'ankara'), false);
});

test('boş sorgu her şeyi eşliyor', () => {
  // Liste süzgeçlerinde kutu boşken tüm kayıtlar görünmeli.
  assert.equal(aramaIceriyor('herhangi bir metin', ''), true);
  assert.equal(aramaIceriyor('herhangi bir metin', '   '), true);
});

test('başlama araması yalnızca baştan eşliyor', () => {
  assert.equal(aramaBasliyor('İstanbul', 'ist'), true);
  assert.equal(aramaBasliyor('İstanbul', 'stan'), false);
  // Boş sorgu burada FALSE — "başlayanlar önce" sıralamasında boş kutu
  // hiçbir kaydı öne almamalı.
  assert.equal(aramaBasliyor('İstanbul', ''), false);
});
