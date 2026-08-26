import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Doğrulama belgesi ADRESLE değil, kimlikli istekle çekilir.
 *
 * İki yönetici ekranı belgeyi `<img src>` / `<iframe src>` ile gösteriyor ve
 * adrese `?token=...` ekliyordu. İkisi de çalışmıyordu:
 *
 *   • Jeton `localStorage['auth_token']` anahtarından okunuyordu; uygulama o
 *     ada hiç yazmıyor, yani değer her zaman boştu.
 *   • Dolu olsa bile fark etmezdi: uç jetonu `Authorization` başlığından
 *     okuyor, `<img>` o başlığı göndermiyor.
 *
 * Ölçüldü (`DogrulamaBelgesiGoruntulemeTest`): `<img src>` isteği 401.
 * Yönetici, onaylayacağı diplomayı hiç göremiyordu.
 *
 * Sorgudaki jetonu sunucuya okutmak da çözüm değil: adres o zaman tarayıcı
 * geçmişine ve sunucu günlüklerine düşen bir anahtara dönüşür.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (goreli) => readFileSync(path.join(kok, goreli), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((satir) => !satir.trim().startsWith('//') && !satir.trim().startsWith('*'))
  .join('\n');

const EKRANLAR = [
  'src/screens/admin/AdminVerification.jsx',
  'src/screens/admin/AdminVerificationReview.jsx',
];

test('belge adresine jeton eklenmiyor', () => {
  for (const yol of EKRANLAR) {
    assert.doesNotMatch(
      oku(yol),
      /\?token=/,
      `${yol}: belge adresine jeton ekleniyor — istek kimliksiz gider ve 401 alır`,
    );
  }
});

test('uygulamanın yazmadığı bir anahtardan jeton okunmuyor', () => {
  for (const yol of EKRANLAR) {
    assert.doesNotMatch(
      oku(yol),
      /auth_token/,
      `${yol}: `
      + "`auth_token` diye bir anahtar yok; uygulama `access_token` ve `auth_state` yazıyor",
    );
  }
});

test('belge kimlikli istekle çekiliyor', () => {
  for (const yol of EKRANLAR) {
    assert.match(
      oku(yol),
      /useBelgeBlobu/,
      `${yol}: belge kimlikli istekle çekilmiyor`,
    );
  }
});

test('istemci blob bekliyor', () => {
  // `responseType: 'blob'` olmadan yanıt metne çevrilir ve ikili dosya bozulur.
  assert.match(
    oku('src/lib/api.js'),
    /verificationDocument:[\s\S]{0,200}responseType:\s*'blob'/,
    'belge çağrısı blob istemiyor — ikili içerik bozulur',
  );
});

test('blob adresi serbest bırakılıyor', () => {
  // Bırakılmazsa bellekte kalır; belgeler birkaç megabayt ve yönetici arka
  // arkaya onlarca açıyor.
  assert.match(
    oku('src/hooks/useBelgeBlobu.js'),
    /revokeObjectURL/,
    'blob adresi serbest bırakılmıyor',
  );
});
