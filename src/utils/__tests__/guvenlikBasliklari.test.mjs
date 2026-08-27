import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Güvenlik başlıkları — ölçüldüğünde HİÇBİRİ yoktu.
 *
 * Yanıtlarda `Strict-Transport-Security`, `X-Frame-Options`,
 * `X-Content-Type-Options` ve `Referrer-Policy` bulunmuyordu. CSP içinde
 * `frame-ancestors 'none'` yazıyordu ama politika `Report-Only` kipinde:
 * tarayıcı hiçbir şeyi engellemiyor, yalnız rapor ediyor. Yani site bir
 * iframe'e gömülebiliyordu.
 *
 * Bu ölçüt başlıkların varlığını değil, DOĞRU ayarlandıklarını tutuyor —
 * yanlış ayarlanmış bir Permissions-Policy telesağlık görüşmesini keserdi.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');
const yapilandirma = readFileSync(path.join(kok, 'next.config.js'), 'utf8');

const yorumsuz = yapilandirma
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((s) => !s.trim().startsWith('//'))
  .join('\n');

test('tıklama hırsızlığı ve MIME koklama kapalı', () => {
  assert.match(yorumsuz, /'X-Frame-Options'[\s\S]{0,40}'DENY'/);
  assert.match(yorumsuz, /'X-Content-Type-Options'[\s\S]{0,40}'nosniff'/);
});

test('adres üçüncü taraflara sızmıyor', () => {
  // Adresler hasta ve hekim kimliği taşıyor (`/doctor/{id}`). Tam adresin
  // dış sitelere gitmesi sızıntıdır.
  assert.match(yorumsuz, /'Referrer-Policy'[\s\S]{0,60}strict-origin-when-cross-origin/);
});

test('telesağlığın kamerası ve mikrofonu KAPATILMAMIŞ', () => {
  /*
   * Bu ölçütün işi bir şeyi yasaklamak değil, aşırı kilitlemeyi yakalamak.
   * `camera=()` yazmak başlığı "daha güvenli" gösterir ve görüntülü
   * görüşmeyi tamamen çalışmaz hâle getirir — hem de sessizce.
   */
  assert.match(yorumsuz, /camera=\(self\)/, 'kamera kapatılmış: telesağlık çalışmaz');
  assert.match(yorumsuz, /microphone=\(self\)/, 'mikrofon kapatılmış: telesağlık çalışmaz');
  assert.match(yorumsuz, /geolocation=\(self\)/, 'konum kapatılmış: "yakınımdakiler" çalışmaz');
});

test('HSTS yerel ortama sızmıyor', () => {
  /*
   * HSTS tarayıcıya "bu alan adına bir daha http ile bağlanma" diyor ve
   * aylarca hatırlıyor. İlk sürüm `NODE_ENV === 'production'` diye kapılıydı,
   * ama `next start` üretim kipinde çalışıyor — yerel sunucu da başlığı
   * gönderiyordu. `localhost` üzerinden çalışan biri geliştirme ortamını
   * kalıcı olarak https'e kilitlerdi.
   */
  assert.match(yorumsuz, /HSTS_ETKIN/, 'HSTS açık bir anahtara bağlı değil');
  assert.doesNotMatch(
    yorumsuz,
    /NODE_ENV === 'production'[\s\S]{0,200}Strict-Transport-Security/,
    'HSTS NODE_ENV ile kapılı: `next start` yerelde de gönderir',
  );
});

test('HSTS preload listesine girmiyor', () => {
  // `preload` tarayıcı üreticilerinin listesine kalıcı kayıt demek; geri
  // dönüşü çok zor ve alan adı kararı verilmeden yapılmamalı.
  assert.doesNotMatch(yorumsuz, /max-age=[\s\S]{0,60}preload/);
});
