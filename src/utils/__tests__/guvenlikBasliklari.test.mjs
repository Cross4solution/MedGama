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

test('HSTS tek yerden gönderiliyor', () => {
  /*
   * `vercel.json` HSTS'i zaten gönderiyor ve mevcut bir ölçüt onu koruyor
   * ("canlıda ölçülmüş"). İlk denemede buraya da eklenmişti; iki
   * `Strict-Transport-Security` başlığı gidince hangisinin geçerli olduğu
   * belirsizleşiyor — süreleri ve `preload` durumları farklıydı.
   *
   * Aynı hata, güvenlik başlıklarının "hiç yok" sanılmasından doğdu: ölçüm
   * yerel sunucuya yapılmıştı ve o Vercel'den geçmiyor. Canlı korunuyordu.
   */
  assert.doesNotMatch(
    yorumsuz,
    /Strict-Transport-Security/,
    'HSTS hem next.config.js hem vercel.json tarafından gönderiliyor',
  );

  const vercel = JSON.parse(readFileSync(path.join(kok, 'vercel.json'), 'utf8'));
  const hepsi = (vercel.headers || []).flatMap((b) => b.headers.map((h) => h.key));

  assert.ok(
    hepsi.includes('Strict-Transport-Security'),
    'HSTS hiçbir yerden gönderilmiyor',
  );
});

test('uygulama düzeyi başlıklar Vercel dışı barındırma için duruyor', () => {
  // `vercel.json` yalnız Vercel'de uygulanıyor. Ön yüz başka bir yerde
  // barındırılırsa (Docker, kendi sunucu) o dosya hiç okunmaz ve site sessizce
  // korumasız kalırdı. Bu başlıklar uygulamayla birlikte taşınıyor.
  assert.match(yorumsuz, /'X-Frame-Options'/);
  assert.match(yorumsuz, /'X-Content-Type-Options'/);
  assert.match(yorumsuz, /'Referrer-Policy'/);
});
