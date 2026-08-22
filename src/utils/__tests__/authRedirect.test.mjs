import test from 'node:test';
import assert from 'node:assert/strict';

import { getRedirectForRole, getRedirectFromLoginResult } from '../authRedirect.js';

/**
 * Giriş sonrası rolün hangi ekrana düştüğü.
 *
 * Proje kurallarında "kritik" diye işaretli ve tek bir switch'e bağlı.
 * Yanlış eşleme sessiz: kullanıcı hata görmez, sadece yanlış ekrana düşer —
 * hastane yöneticisi sosyal akışta, satışçı boş bir panelde bulur kendini.
 *
 * Yanıt biçimi de burada sabitleniyor: giriş yanıtı dört farklı şekilde
 * gelebiliyor (data.user.role_id, data.user.role, user.role_id, user.role)
 * ve bunlardan birinin desteği düşerse yönlendirme sessizce yedeğe kayar.
 */

test('yönetici roller panele gidiyor', () => {
  assert.equal(getRedirectForRole('superAdmin'), '/admin');
  assert.equal(getRedirectForRole('saasAdmin'), '/admin');
});

test('hastane doğrudan CRM\'e gidiyor', () => {
  // Hastane yalnızca yönetim rolü — sosyal akışta işi yok.
  assert.equal(getRedirectForRole('hospital'), '/crm');
});

test('satışçı doğrudan aday listesine gidiyor', () => {
  assert.equal(getRedirectForRole('salesperson'), '/crm/leads');
});

test('hasta, doktor ve klinik akışa gidiyor', () => {
  for (const rol of ['patient', 'doctor', 'clinicOwner', 'clinic']) {
    assert.equal(getRedirectForRole(rol), '/medstream', `başarısız: ${rol}`);
  }
});

test('bilinmeyen rol akışa düşüyor, çökmüyor', () => {
  // Sunucu yeni bir rol eklerse ekran boş kalmamalı.
  assert.equal(getRedirectForRole('yepyeni_rol'), '/medstream');
  assert.equal(getRedirectForRole(undefined), '/medstream');
});

test('giriş yanıtının dört biçimi de tanınıyor', () => {
  const bicimler = [
    { data: { user: { role_id: 'hospital' } } },
    { data: { user: { role: 'hospital' } } },
    { user: { role_id: 'hospital' } },
    { user: { role: 'hospital' } },
  ];

  for (const [i, yanit] of bicimler.entries()) {
    assert.equal(getRedirectFromLoginResult(yanit), '/crm', `biçim ${i} tanınmadı`);
  }
});

test('rol okunamazsa yedek adres kullanılıyor', () => {
  assert.equal(getRedirectFromLoginResult({}), '/medstream');
  assert.equal(getRedirectFromLoginResult(null), '/medstream');
  assert.equal(getRedirectFromLoginResult({}, '/giris'), '/giris');
});
