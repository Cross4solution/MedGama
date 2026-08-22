import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveClinicRating, resolveClinicReviewCount } from '../clinicMetrics.js';

/**
 * Klinik puanı — hastanın seçim yaparken baktığı sayı.
 *
 * Buradaki asıl güvence: DEĞERLENDİRME YOKSA UYDURMA PUAN ÜRETİLMEMESİ.
 * Bu modülde daha önce kimliğe göre "kararlı" sahte puan üreten bir kod
 * vardı; sağlık platformunda uydurulmuş bir hekim puanı hastayı yanlış
 * yönlendirir. Kaldırıldı ve bu testler onu geri gelmeye karşı çiviliyor.
 *
 * Arayüz `null` gördüğünde "Yeni" yazıyor — yani boş dönmek doğru davranış,
 * eksiklik değil.
 */

test('değerlendirme yoksa puan uydurulmuyor', () => {
  // En önemli test: null dönmeli, 0 ya da rastgele bir sayı değil.
  assert.equal(resolveClinicRating({}), null);
  assert.equal(resolveClinicRating({ id: 'abc-123', name: 'Deneme Kliniği' }), null);
  assert.equal(resolveClinicRating(null), null);
  assert.equal(resolveClinicRating(undefined), null);
});

test('aynı klinik için tekrar tekrar null dönüyor', () => {
  // Sahte puan üreten eski kod kimliğe göre KARARLI bir sayı veriyordu:
  // aynı girdi hep aynı sonucu döndürdüğü için gerçek gibi görünüyordu.
  // Kararlılık tek başına doğruluk kanıtı değil — değer null olmalı.
  const klinik = { id: 'sabit-kimlik', name: 'Sabit Klinik' };

  assert.equal(resolveClinicRating(klinik), null);
  assert.equal(resolveClinicRating(klinik), null);
});

test('sıfır puan değerlendirme sayılmıyor', () => {
  // 0 "puanı yok" demek; yıldız olarak gösterilirse en kötü klinik gibi
  // görünür.
  assert.equal(resolveClinicRating({ avg_rating: 0 }), null);
  assert.equal(resolveClinicRating({ rating: '0' }), null);
});

test('gerçek puan okunuyor ve tek ondalığa yuvarlanıyor', () => {
  assert.equal(resolveClinicRating({ avg_rating: 4.66 }), 4.7);
  assert.equal(resolveClinicRating({ rating: '3.21' }), 3.2);
  assert.equal(resolveClinicRating({ averageRating: 5 }), 5);
});

test('alan adı çeşitleri destekleniyor', () => {
  // Arka uç farklı uçlarda farklı adlar döndürüyor; biri kaçarsa puan
  // sessizce kaybolur ve klinik "Yeni" görünür.
  for (const alan of ['avg_rating', 'rating', 'average_rating', 'averageRating', 'review_score', 'reviewScore']) {
    assert.equal(resolveClinicRating({ [alan]: 4.5 }), 4.5, `alan okunmadı: ${alan}`);
  }
});

test('sayı olmayan puan yok sayılıyor', () => {
  assert.equal(resolveClinicRating({ avg_rating: 'çok iyi' }), null);
  assert.equal(resolveClinicRating({ avg_rating: NaN }), null);
  assert.equal(resolveClinicRating({ avg_rating: Infinity }), null);
});

test('değerlendirme sayısı yoksa sıfır', () => {
  assert.equal(resolveClinicReviewCount({}), 0);
  assert.equal(resolveClinicReviewCount(null), 0);
});

test('değerlendirme sayısı tam sayıya yuvarlanıyor ve negatif olmuyor', () => {
  assert.equal(resolveClinicReviewCount({ review_count: 12.7 }), 13);
  assert.equal(resolveClinicReviewCount({ reviews: '8' }), 8);

  // Negatif bir sayı ekranda anlamsız; sıfıra kelepçelenmeli.
  assert.equal(resolveClinicReviewCount({ review_count: -5 }), 0);
});

test('sayı alan adı çeşitleri destekleniyor', () => {
  for (const alan of ['review_count', 'reviews', 'reviewCount', 'total_reviews', 'totalReviews']) {
    assert.equal(resolveClinicReviewCount({ [alan]: 7 }), 7, `alan okunmadı: ${alan}`);
  }
});
