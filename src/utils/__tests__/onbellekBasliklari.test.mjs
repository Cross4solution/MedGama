import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * `public/` altındaki görseller her ziyarette yeniden doğrulanmamalı.
 *
 * Canlıdan ölçüldü. Parmak izli varlıklar doğru ayarlı:
 *
 *     /_next/static/...  → public, max-age=31536000, immutable  (brotli)
 *     /_next/image       → public, max-age=31536000
 *
 * Ama `public/` altındaki elle yönetilen dosyalar Vercel'in varsayılanını
 * alıyordu:
 *
 *     /images/...        → public, max-age=0, must-revalidate
 *
 * ETag olduğu için yanıt 304 dönüyor, yani bayt inmiyor — ama her görsel için
 * her sayfa görüntülemesinde bir GİDİŞ-DÖNÜŞ var. 400 ms gecikmeli bir
 * bağlantıda üç görsel, tekrar ziyaretlerde saniyeye yakın saf bekleme demek.
 *
 * Süre bilerek kısa: bu dosyaların adında içerik parmak izi yok, yani biri
 * arka planı değiştirdiğinde adres aynı kalıyor. Bir gün taze + bir hafta
 * "eskisini göster, arkada yenile" dengesi, değişikliğin bir gün içinde
 * yayılmasını sağlıyor. `immutable` burada yanlış olurdu.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const vercel = JSON.parse(readFileSync(path.join(uygulamaKok, 'vercel.json'), 'utf8'));

/** Bir yol deseni için tanımlı başlıklar. */
function basliklar(desen) {
  const kural = (vercel.headers || []).find((k) => k.source === desen);
  if (!kural) return null;

  return new Map((kural.headers || []).map((h) => [h.key.toLowerCase(), h.value]));
}

test('görseller için önbellek kuralı var', () => {
  const h = basliklar('/images/(.*)');

  assert.ok(h, '`/images/(.*)` için kural yok: her ziyarette yeniden doğrulanır');
  assert.ok(h.get('cache-control'), 'Cache-Control ayarlanmamış');
});

test('önbellek süresi tarayıcıda gerçekten tutuyor', () => {
  const deger = basliklar('/images/(.*)').get('cache-control');

  assert.match(deger, /public/, 'yanıt paylaşımlı önbelleğe kapalı');

  const maxAge = Number((deger.match(/max-age=(\d+)/) || [])[1]);

  assert.ok(maxAge >= 3600, `max-age çok kısa (${maxAge} sn): gidiş-dönüş sürüyor`);
});

test('süre sonsuz değil — dosya adlarında parmak izi yok', () => {
  // `immutable` ya da bir yıllık süre, elle değiştirilen bir arka planın
  // aylarca eski hâliyle görünmesi demek olurdu.
  const deger = basliklar('/images/(.*)').get('cache-control');

  assert.doesNotMatch(deger, /immutable/, '`immutable`: değiştirilen görsel kullanıcıya hiç ulaşmaz');

  const maxAge = Number((deger.match(/max-age=(\d+)/) || [])[1]);

  assert.ok(maxAge <= 604800, `max-age çok uzun (${maxAge} sn): görsel değişikliği geç yayılır`);
});

test('güvenlik başlıkları bu değişiklikten etkilenmemiş', () => {
  // Yeni bir kural eklerken var olanı düşürmek kolay; bunlar canlıda ölçülmüş
  // ve `guvenlikBasliklari.test.mjs` tarafından da korunuyor.
  const h = basliklar('/(.*)');

  assert.ok(h, 'genel başlık kuralı kaybolmuş');

  for (const anahtar of ['x-frame-options', 'x-content-type-options', 'strict-transport-security']) {
    assert.ok(h.get(anahtar), `${anahtar} kaybolmuş`);
  }
});
