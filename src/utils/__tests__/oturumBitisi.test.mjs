import test from 'node:test';
import assert from 'node:assert/strict';
import { cikisHedefi, guvenliDonusYolu, yoldakiDil } from '../oturumBitisi.js';

/**
 * Zorla çıkışta nereye gidiliyor.
 *
 * Bu dosya kararın KENDİSİNİ tutuyor; tarayıcıdaki karşılığı
 * `tests/e2e/oturum-dusunce.spec.js`.
 *
 * `next` parametresi adres çubuğundan geliyor, yani saldırganın elinde:
 * `?next=//kotu.site` yazan bir bağlantı, giriş yapan kullanıcıyı kendi
 * sitesine atardı. Açık yönlendirme (open redirect) kimlik avında kullanılan
 * standart bir yöntem — bağlantı gerçekten bizim alan adımızla başlıyor,
 * kurban da öyle görüyor.
 */

const DILLER = ['tr', 'en', 'de', 'ar'];

test('dönüş adresi yalnız site içinden kabul ediliyor', () => {
  assert.equal(guvenliDonusYolu('/tr/crm/patients'), '/tr/crm/patients');
  assert.equal(guvenliDonusYolu('/dashboard'), '/dashboard');
});

test('site dışına çıkaran her biçim reddediliyor', () => {
  for (const kotu of [
    '//kotu.site/giris',        // protokolsüz mutlak adres
    '/\\kotu.site',             // ters eğik çizgi, bazı tarayıcılarda aynı şey
    'https://kotu.site',
    'http://kotu.site',
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,x',
    'crm/patients',             // göreli — nereye gideceği belirsiz
    '',
    null,
    undefined,
    42,
  ]) {
    assert.equal(guvenliDonusYolu(kotu), null, `kabul edilmemeliydi: ${String(kotu)}`);
  }
});

test('dil yoldan okunuyor', () => {
  assert.equal(yoldakiDil('/tr/crm', DILLER), 'tr');
  assert.equal(yoldakiDil('/ar/dashboard', DILLER), 'ar');
  assert.equal(yoldakiDil('/crm', DILLER), null);
  assert.equal(yoldakiDil('/xx/crm', DILLER), null, 'desteklenmeyen dil kabul edilmemeli');
});

test('rol kendi giriş ekranına götürüyor', () => {
  assert.match(cikisHedefi('/tr/crm', 'clinicOwner', DILLER), /^\/tr\/clinic-login\?/);
  assert.match(cikisHedefi('/tr/crm', 'clinic', DILLER), /^\/tr\/clinic-login\?/);
  assert.match(cikisHedefi('/tr/crm', 'doctor', DILLER), /^\/tr\/doctor-login\?/);
  assert.match(cikisHedefi('/tr/crm', 'hospital', DILLER), /^\/tr\/hospital-login\?/);
  assert.match(cikisHedefi('/tr/dashboard', 'patient', DILLER), /^\/tr\/login\?/);
  assert.match(cikisHedefi('/tr/dashboard', '', DILLER), /^\/tr\/login\?/, 'rol bilinmiyorsa genel giriş');
});

test('dil korunuyor', () => {
  assert.match(cikisHedefi('/de/medical-archive', 'patient', DILLER), /^\/de\/login\?/);
  assert.match(cikisHedefi('/ar/crm', 'clinicOwner', DILLER), /^\/ar\/clinic-login\?/);
  // Dil öneki yoksa uydurulmuyor.
  assert.match(cikisHedefi('/crm', 'doctor', DILLER), /^\/doctor-login\?/);
});

test('kaldığı yer taşınıyor', () => {
  const hedef = new URL(cikisHedefi('/tr/crm/patients', 'clinicOwner', DILLER), 'https://x');
  assert.equal(hedef.searchParams.get('next'), '/tr/crm/patients');
  assert.equal(hedef.searchParams.get('expired'), '1');
});

test('anlamsız dönüş adresleri taşınmıyor', () => {
  // Giriş ekranından giriş ekranına dönmek ya da ana sayfayı "kaldığı yer"
  // saymak, kullanıcıya hiçbir şey kazandırmaz.
  for (const yol of ['/tr', '/tr/', '/', '/tr/clinic-login', '/tr/login']) {
    const hedef = new URL(cikisHedefi(yol, 'clinicOwner', DILLER), 'https://x');
    assert.equal(hedef.searchParams.get('next'), null, `taşınmamalıydı: ${yol}`);
    assert.equal(hedef.searchParams.get('expired'), '1', 'bildirim yine de gösterilmeli');
  }
});
