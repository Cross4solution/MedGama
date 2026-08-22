import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseLocalDate,
  parseLocalDateTime,
  formatTimeInZone,
  appointmentTimeDisplay,
  isSameLocalDay,
} from '../dates.js';

/**
 * Randevu tarihi ve saati.
 *
 * Bu projede saat dilimi hatası iki kez canlıya çıktı: bir kere randevular
 * bir gün önce göründü, bir kere de Türkiye randevuları üç saat erken
 * "tamamlandı" sayıldı. İkisi de sessiz — kimse hata görmedi, sadece yanlış
 * bilgi gösterildi.
 *
 * Buradaki asıl ayrım: randevunun TARİHİ bir takvim günü (kaydırılmamalı),
 * SAATİ ise mutlak bir an (izleyenin diline çevrilmeli).
 */

test('takvim günü saat dilimiyle kaymıyor', () => {
  // new Date('2026-08-11') UTC gece yarısı demek; UTC-5'teki kullanıcı bunu
  // 10 Ağustos akşamı olarak görür ve randevu BİR GÜN ÖNCE görünür.
  const d = parseLocalDate('2026-08-11');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);        // 0 tabanlı: 7 = Ağustos
  assert.equal(d.getDate(), 11);
  assert.equal(d.getHours(), 0);
});

test('tam zaman damgasından da gün bileşeni alınıyor', () => {
  const d = parseLocalDate('2026-08-11T00:00:00.000000Z');
  assert.equal(d.getDate(), 11, 'UTC gece yarısı bir gün geriye kaydı');
});

test('geçersiz ve boş değerler null veriyor', () => {
  // Çağıranlar sonucu doğrudan biçimlendiriciye veriyor; çökme olmamalı.
  assert.equal(parseLocalDate(null), null);
  assert.equal(parseLocalDate(''), null);
  assert.equal(parseLocalDate('anlamsız'), null);
});

test('tarih ve saat tek bir yerel ana birleşiyor', () => {
  const d = parseLocalDateTime('2026-08-11', '10:45');
  assert.equal(d.getDate(), 11);
  assert.equal(d.getHours(), 10);
  assert.equal(d.getMinutes(), 45);
});

test('saat verilmezse gün başına düşüyor', () => {
  const d = parseLocalDateTime('2026-08-11', null);
  assert.equal(d.getHours(), 0);
  assert.equal(d.getMinutes(), 0);
});

test('bir an istenen saat diliminde yazılıyor', () => {
  // 2026-08-11T07:00:00Z — yaz saatinde İstanbul UTC+3.
  const an = '2026-08-11T07:00:00Z';
  assert.equal(formatTimeInZone(an, 'Europe/Istanbul', 'tr-TR'), '10:00');
  assert.equal(formatTimeInZone(an, 'UTC', 'tr-TR'), '07:00');
});

test('farklı saat dilimindeki izleyiciye klinik saati de gösteriliyor', () => {
  const gosterim = appointmentTimeDisplay({
    starts_at: '2026-08-11T07:00:00Z',
    timezone: 'Europe/Istanbul',
    appointment_date: '2026-08-11',
    appointment_time: '10:00',
  }, 'tr-TR');

  // Sadece "10:00" yazmak yurt dışındaki hasta için belirsiz: kimin 10:00'u?
  assert.equal(gosterim.providerTime, '10:00', 'Klinik saati yanlış');
  assert.ok(gosterim.time, 'İzleyen saati boş');
  assert.equal(typeof gosterim.showProvider, 'boolean');
});

test('aynı saat dilimindeki izleyici ikinci saatle meşgul edilmiyor', () => {
  const izleyenTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const gosterim = appointmentTimeDisplay({
    starts_at: '2026-08-11T07:00:00Z',
    timezone: izleyenTz,
  }, 'tr-TR');

  assert.equal(gosterim.showProvider, false, 'Aynı dilimde ikinci saat gösteriliyor');
});

test('mutlak an yoksa duvar saatine düşülüyor', () => {
  // Eski kayıtlarda starts_at yok; karşılaştırma yapılamayacağı için
  // sağlayıcı saati de gösterilmemeli.
  const gosterim = appointmentTimeDisplay({
    appointment_date: '2026-08-11',
    appointment_time: '10:00:00',
  }, 'tr-TR');

  assert.equal(gosterim.time, '10:00');
  assert.equal(gosterim.showProvider, false);
});

test('aynı gün karşılaştırması saat farkından etkilenmiyor', () => {
  assert.equal(isSameLocalDay('2026-08-11', new Date(2026, 7, 11, 23, 59)), true);
  assert.equal(isSameLocalDay('2026-08-11', new Date(2026, 7, 12, 0, 1)), false);
});
