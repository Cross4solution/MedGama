import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { notificationTitle, NOTIFICATION_TYPES, DEFAULT_TITLE_KEY } from '../notificationTitle.js';

/**
 * Bildirim başlığının dili.
 *
 * Bulunan hata: arka uçtaki 21 bildirim sınıfının hepsi başlığı SABİT
 * İngİlizce üretiyor ("Appointment Confirmed"). Üç ekran da onu çevrilmiş
 * etiketin önüne koyuyordu:
 *
 *     data.title || t(meta.labelKey)      // sunucu başlığı hep kazanır
 *
 * `data.title` her zaman dolu olduğu için çeviri HİÇ kullanılmıyordu:
 * arayüzün tamamı Türkçeyken zil bildirimi İngilizce görünüyordu.
 *
 * E-postalar çevriliyordu, uygulama içi bildirimler çevrilmiyordu — hata bu
 * yüzden sessizdi: bir şey bozulmuş gibi durmuyor, sadece yanlış dilde.
 */

// Sahte çevirmen: anahtarı geri döndürür, böylece HANGİ anahtarın
// kullanıldığı ölçülebilir (gerçek metne bağlanmak testi kırılgan yapardı).
const t = (anahtar) => `«${anahtar}»`;

test('bilinen tür çevrilmiş etiketi kullanıyor', () => {
  const baslik = notificationTitle(
    { type: 'appointment_confirmed', title: 'Appointment Confirmed' },
    t,
  );

  assert.equal(baslik, '«notifications.type.appointment_confirmed»');
});

test('sunucunun İngilizce başlığı çeviriyi ezmiyor', () => {
  // ASIL REGRESYON. `data.title || t(...)` yazımı bu testi düşürür.
  for (const tur of NOTIFICATION_TYPES) {
    const baslik = notificationTitle({ type: tur, title: 'Some English Title' }, t);

    assert.equal(
      baslik,
      `«notifications.type.${tur}»`,
      `${tur} için sunucu başlığı çeviriyi ezdi`,
    );
  }
});

test('tanınmayan tür sunucu başlığına düşüyor', () => {
  // Ters uç: genel "Bildirim" etiketine düşmek bilgi kaybı olurdu.
  const baslik = notificationTitle({ type: 'yeni_bir_tur', title: 'Payout Released' }, t);

  assert.equal(baslik, 'Payout Released');
});

test('tanınmayan tür ve başlık yoksa genel etiket', () => {
  assert.equal(notificationTitle({ type: 'yeni_bir_tur' }, t), `«${DEFAULT_TITLE_KEY}»`);
  assert.equal(notificationTitle({}, t), `«${DEFAULT_TITLE_KEY}»`);
  assert.equal(notificationTitle(null, t), `«${DEFAULT_TITLE_KEY}»`);
});

test('her tür çevrilebilir olmalı — tr ve en dosyalarında karşılığı var', () => {
  // Liste ile dil dosyaları ayrışırsa başlık ham anahtar olarak basılır:
  // kullanıcı zilde "notifications.type.post_liked" görür.
  for (const dil of ['tr', 'en', 'de']) {
    const sozluk = JSON.parse(
      readFileSync(new URL(`../../i18n/locales/${dil}.json`, import.meta.url), 'utf8'),
    );
    const turler = sozluk?.notifications?.type || {};

    const eksik = NOTIFICATION_TYPES.filter((x) => !turler[x]);

    assert.deepEqual(eksik, [], `${dil}.json içinde eksik bildirim türü: ${eksik.join(', ')}`);
    assert.ok(turler.default, `${dil}.json içinde notifications.type.default yok`);
  }
});

test('üç ekran da ortak yardımcıyı kullanıyor', () => {
  // Kural üç yerde ayrı ayrı yazılmıştı ve üçü de aynı şekilde yanlıştı.
  // Biri geri kopyalanırsa o ekran sessizce İngilizceye döner.
  const ekranlar = [
    ['screens/Notifications.jsx', '../../'],
    ['components/layout/Header.jsx', '../../'],
    ['components/crm/CRMLayout.jsx', '../../'],
  ];

  for (const [yol] of ekranlar) {
    const kaynak = readFileSync(new URL(`../../${yol}`, import.meta.url), 'utf8');

    assert.match(kaynak, /notificationTitle\(data, t\)/, `${yol} ortak yardımcıyı kullanmıyor`);
    assert.doesNotMatch(
      kaynak,
      /data\.title \|\|/,
      `${yol} yine sunucu başlığını çevirinin önüne koyuyor`,
    );
  }
});
