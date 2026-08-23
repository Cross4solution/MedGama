import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Güvenlik başlıkları — iki ayrı dosyadan geliyor.
 *
 *   vercel.json       → HSTS, X-Frame-Options, nosniff, Referrer-Policy,
 *                       Permissions-Policy
 *   next.config.js    → Content-Security-Policy (şu an RAPORLAMA modunda)
 *
 * Canlıdan ölçüldü: hepsi gerçekten gönderiliyor. Bu testler onların
 * sessizce kaybolmasını engelliyor — bir başlığın düşmesi hiçbir yerde hata
 * üretmez, yalnız koruma yok olur.
 *
 * CSP bilinçli olarak `Report-Only`: engelleyici moda geçiş teslim
 * öncesi kararlardan biri. Test bunu ONAYLAMIYOR, mevcut durumu KAYDEDİYOR —
 * engelleyiciye geçildiğinde kasten kırılacak ve karar görünür olacak.
 */

const kok = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const vercel = JSON.parse(readFileSync(join(kok, 'vercel.json'), 'utf8'));
const nextConfig = readFileSync(join(kok, 'next.config.js'), 'utf8');

const basliklar = new Map(
  (vercel.headers || []).flatMap((k) => (k.headers || []).map((h) => [h.key.toLowerCase(), h.value])),
);

test('tıklama hırsızlığına karşı çerçeveleme kapalı', () => {
  // Sağlık platformunda çerçeveleme, hastayı sahte bir sayfada gerçek
  // arayüze tıklatmaya yarar.
  assert.equal(basliklar.get('x-frame-options'), 'DENY');
});

test('içerik türü tahmini kapalı', () => {
  // Yüklenen bir dosyanın tarayıcı tarafından HTML sanılması, depolanmış
  // XSS'in klasik yolu.
  assert.equal(basliklar.get('x-content-type-options'), 'nosniff');
});

test('HSTS uzun süreli ve alt alan adlarını kapsıyor', () => {
  const hsts = basliklar.get('strict-transport-security') || '';
  const sure = Number((hsts.match(/max-age=(\d+)/) || [])[1] || 0);

  // Altı aydan kısa bir süre koruma sayılmaz.
  assert.ok(sure >= 15552000, `HSTS süresi çok kısa: ${sure}`);
  assert.match(hsts, /includeSubDomains/, 'alt alan adları kapsanmıyor');
});

test('yönlendiren bilgisi dış sitelere sızmıyor', () => {
  // Adres satırında hasta ya da randevu kimliği olabiliyor.
  const rp = basliklar.get('referrer-policy') || '';
  assert.ok(
    ['strict-origin-when-cross-origin', 'no-referrer', 'same-origin'].includes(rp),
    `gevşek referrer politikası: ${rp}`,
  );
});

test('kamera ve mikrofon yalnız kendi sitemize açık', () => {
  // Görüntülü görüşme için gerekli; üçüncü taraf çerçevelere açılmamalı.
  const pp = basliklar.get('permissions-policy') || '';

  for (const yetki of ['camera', 'microphone', 'geolocation']) {
    assert.match(pp, new RegExp(`${yetki}=\\(self\\)`), `${yetki} yetkisi kısıtlanmamış: ${pp}`);
  }
});

test('CSP eklenti ve çerçeve gömmeyi tamamen kapatıyor', () => {
  // Bu üçü raporlama modunda bile anlamlı: engelleyiciye geçildiğinde
  // koruma bunlardan geliyor.
  assert.match(nextConfig, /"object-src 'none'"/, 'object-src açık bırakılmış');
  assert.match(nextConfig, /"frame-ancestors 'none'"/, 'frame-ancestors açık bırakılmış');
  assert.match(nextConfig, /"base-uri 'self'"/, 'base-uri kısıtlanmamış');
  assert.match(nextConfig, /"form-action 'self'"/, 'form gönderimi dış siteye açık');
});

test('CSP hâlâ raporlama modunda — teslim öncesi karar', () => {
  // MEVCUT DURUM KAYDEDİLİYOR, onaylanmıyor. Engelleyici moda geçildiğinde
  // bu test kasten kırılacak; o an `upgrade-insecure-requests` de eklenmeli
  // (raporlama modunda tarayıcı onu yok sayıp konsolu uyarıyla dolduruyor).
  assert.match(
    nextConfig,
    /key: 'Content-Security-Policy-Report-Only'/,
    'CSP modu değişmiş — engelleyiciye geçildiyse bu test güncellenmeli',
  );
});

test('CSP ihlal raporu bir uca gidiyor', () => {
  // Raporlama modunun tek faydası raporlar; toplanmıyorsa mod anlamsız.
  assert.match(nextConfig, /report-uri \/api\/csp-report/, 'ihlal raporu toplanmıyor');
});
