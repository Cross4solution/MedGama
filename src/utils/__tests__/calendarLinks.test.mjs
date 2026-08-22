import test from 'node:test';
import assert from 'node:assert/strict';

import { googleCalendarUrl, outlookCalendarUrl, icsDataUri } from '../calendarLinks.js';

/**
 * Takvime ekleme bağlantıları.
 *
 * Randevu başlığı ve açıklaması kullanıcı/klinik tarafından yazılıyor ve
 * doğrudan bir adrese ya da bir .ics dosyasının içine giriyor. İki ayrı kaçış
 * gerekiyor ve ikisi de farklı kurallara tabi:
 *
 *   • Adres tarafı — URLSearchParams kodluyor.
 *   • ICS tarafı — virgül, noktalı virgül, ters bölü ve satır sonu ELLE
 *     kaçırılmak zorunda. Kaçmayan bir satır sonu, değerin alan sınırını
 *     aşıp takvim dosyasına yeni bir özellik satırı eklemesine yol açar.
 */

const randevu = (ek = {}) => ({
  startsAt: '2026-08-11T07:00:00Z',
  durationMin: 30,
  title: 'Kardiyoloji randevusu',
  description: 'Kontrol muayenesi',
  location: 'Medagama Kliniği',
  id: 'abc-123',
  ...ek,
});

test('Google bağlantısı özel karakterleri kodluyor', () => {
  const url = googleCalendarUrl(randevu({ title: 'Kontrol & Tahlil #2' }));

  // Ham "&" ikinci bir parametre gibi okunur, "#" sonrasını tamamen keser.
  assert.ok(url.startsWith('https://calendar.google.com/'), url);
  assert.ok(!url.includes('& Tahlil'), 'ham & adrese sızdı');
  assert.ok(!url.includes('#2'), 'ham # adrese sızdı');
});

test('Outlook bağlantısı üretiliyor', () => {
  const url = outlookCalendarUrl(randevu());
  assert.ok(url.startsWith('https://outlook.live.com/'), url);
});

test('geçersiz randevu boş dize veriyor', () => {
  // Çağıran bunu href'e koyuyor; çökme ya da "undefined" bağlantı olmamalı.
  assert.equal(icsDataUri({}), '');
  assert.equal(googleCalendarUrl({}), '');
});

test('ICS virgül, noktalı virgül ve ters bölüyü kaçırıyor', () => {
  const ics = decodeURIComponent(
    icsDataUri(randevu({ title: 'Tahlil, kontrol; ek\\bilgi' })).replace('data:text/calendar;charset=utf-8,', ''),
  );

  const satir = ics.split('\r\n').find((l) => l.startsWith('SUMMARY:'));
  assert.ok(satir.includes('\\,'), 'virgül kaçırılmamış');
  assert.ok(satir.includes('\\;'), 'noktalı virgül kaçırılmamış');
});

test('ICS başlığı satır sonuyla bölünemiyor', () => {
  // Asıl saldırı: başlığa satır sonu koyup ICS'e kendi özelliğini eklemek.
  const ics = decodeURIComponent(
    icsDataUri(randevu({ title: 'Zararsız\r\nDESCRIPTION:enjekte' })).replace('data:text/calendar;charset=utf-8,', ''),
  );

  const aciklamaSatirlari = ics.split('\r\n').filter((l) => l.startsWith('DESCRIPTION:'));
  assert.equal(aciklamaSatirlari.length, 1, `başlıktan ICS satırı enjekte edildi:\n${ics}`);

  // Satır sayısına bakmak YETMİYOR: ilk yazışta bu test /\r?\n/ ile bölüyordu,
  // tek başına kalan CR bölme noktası sayılmadığı için ham CR gözden kaçtı ve
  // test yanlış sebeple geçti. Asıl ölçüt, hiçbir DEĞERİN içinde ham satır
  // sonu kalmaması.
  for (const satir of ics.split('\r\n')) {
    const deger = satir.slice(satir.indexOf(':') + 1);
    assert.ok(!deger.includes('\r'), `değerde ham CR kaldı: ${JSON.stringify(satir)}`);
    assert.ok(!deger.includes('\n'), `değerde ham LF kaldı: ${JSON.stringify(satir)}`);
  }
});

test('ters bölü iki kez kaçırılmıyor', () => {
  // Kaçış sırası bozulursa "\," önce "\\," olur, sonra virgül yeniden
  // kaçırılıp "\\\," çıkar ve başlık ekranda bozuk görünür.
  const ics = decodeURIComponent(
    icsDataUri(randevu({ title: 'yol\\alt, ek' })).replace('data:text/calendar;charset=utf-8,', ''),
  );
  const satir = ics.split('\r\n').find((l) => l.startsWith('SUMMARY:'));

  assert.ok(satir.includes('yol\\\\alt'), `ters bölü yanlış kaçırıldı: ${satir}`);
  assert.ok(!satir.includes('\\\\\\'), `üç kat kaçış oluştu: ${satir}`);
});

test('ICS geçerli bir takvim gövdesi üretiyor', () => {
  const ics = decodeURIComponent(
    icsDataUri(randevu()).replace('data:text/calendar;charset=utf-8,', ''),
  );

  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(/DTSTART:\d{8}T\d{6}/.test(ics), 'başlangıç anı biçimi bozuk');
});
