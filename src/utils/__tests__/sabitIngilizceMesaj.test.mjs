import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Kullanıcıya gösterilen mesajlar çeviriden gelmeli.
 *
 * Ölçüldü: giriş ve kayıt akışının hata ve onay mesajları sabit İngilizceydi.
 * "Email is required", "Invalid credentials. Please check your email and
 * password.", "Too many attempts…", "Login successful" — dokuz dilin dokuzunda
 * da böyle görünüyordu.
 *
 * Bu, arayüzün yarısının çevrilmiş olmasından daha kötü: hata metni, insanın
 * bir şeyi düzeltmek için okuduğu TEK cümle. Anlamadığı bir dilde olması,
 * hatayı hiç göstermemekle neredeyse aynı şey.
 *
 * Sessizce geri gelir: yeni bir `notify({ message: '...' })` yazmak bir satır,
 * ve hiçbir şey kırılmaz.
 *
 * Tarama YALNIZ kullanıcıya giden yüzeye bakıyor — `notify` mesajları ve form
 * hata metinleri. Günlük satırları, geliştirici notları ve sahte veriler
 * kapsam dışı.
 */

const buDosya = fileURLToPath(import.meta.url);
const kaynakKok = path.resolve(path.dirname(buDosya), '../..');

/**
 * Kullanıcıya giden metin üreten kalıplar.
 *
 * Büyük harfle başlayan ve en az iki kelime içeren düz dizgeler aranıyor:
 * `'ok'` ya da `'error'` gibi teknik değerler değil, cümleler.
 */
const KALIPLAR = [
  /\bmessage:\s*'([A-Z][^']*\s[^']{6,})'/g,
  /newErrors\.\w+\s*=\s*'([A-Z][^']*\s[^']{4,})'/g,
];

/** Çeviri gerektirmeyen, ölçülmüş istisnalar. */
const MUAF = [
  // Ekranda hiç gösterilmeyen demo/örnek veriler.
  'data/clinicMockData.js',
  'components/notifications/PatientNotify.jsx',

  // Ölü dosya: `LoginPage` onun yerini almış. Hiçbir yerden import edilmiyor
  // ve üretim paketine girmiyor — ölçüldü. İçindeki 13 sabit mesaj Türkçe,
  // yani aynı hatanın aynası; ama ölü kodu çevirmek yerine silinmesi için
  // ayrıca işaretlendi.
  'screens/AuthPages.jsx',
];

function dosyalar(dizin = kaynakKok, toplam = []) {
  for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
    if (girdi.name === '__tests__' || girdi.name === 'i18n') continue;
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) dosyalar(tam, toplam);
    else if (/\.jsx?$/.test(girdi.name)) toplam.push(tam);
  }
  return toplam;
}

test('kullanıcıya giden mesajlar sabit İngilizce değil', () => {
  const kusurlu = [];
  let tarandi = 0;

  for (const yol of dosyalar()) {
    const goreli = path.relative(kaynakKok, yol);
    if (MUAF.includes(goreli)) continue;

    tarandi++;
    const metin = readFileSync(yol, 'utf8');

    for (const kalip of KALIPLAR) {
      for (const eslesme of metin.matchAll(kalip)) {
        const cumle = eslesme[1];

        // Türkçe karakter taşıyan metin zaten yerelleştirilmiş sayılmaz ama
        // İngilizce de değil; ayrı bir iş.
        if (/[çğıöşüÇĞİÖŞÜ]/.test(cumle)) continue;

        const satir = metin.slice(0, eslesme.index).split('\n').length;
        kusurlu.push(`${goreli}:${satir}  "${cumle.slice(0, 60)}"`);
      }
    }
  }

  assert.ok(tarandi > 100, `tarama çalışmıyor: ${tarandi} dosya`);

  assert.deepEqual(
    kusurlu,
    [],
    'Kullanıcıya sabit İngilizce metin gösteriliyor. `t(...)` ile çeviriden\n'
      + 'alın ve dokuz dile de ekleyin:\n  ' + kusurlu.join('\n  '),
  );
});

test('eklenen kimlik doğrulama mesajları dokuz dilde de var', () => {
  const anahtarlar = [
    'loginSuccess', 'registerSuccess', 'resetLinkSent', 'tooManyAttempts',
    'invalidCredentialsDetail', 'signInToContinue',
    'emailRequired', 'emailInvalid', 'passwordRequired', 'passwordTooShort',
    'confirmPasswordRequired', 'acceptTermsRequired', 'acceptPrivacyRequired', 'fixHighlighted',
  ];

  for (const dil of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'it', 'az']) {
    const sozluk = JSON.parse(readFileSync(path.join(kaynakKok, `i18n/locales/${dil}.json`), 'utf8'));
    const eksik = anahtarlar.filter((a) => !sozluk.auth?.[a]);

    assert.deepEqual(eksik, [], `${dil}.json içinde eksik: ${eksik.join(', ')}`);
  }
});
