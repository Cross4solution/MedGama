import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Ekrana yazılan metin `t()` içinden geçmeli.
 *
 * Yönetici panelinde on yedi metin doğrudan JSX'e yazılmıştı: "Refresh",
 * "Export CSV", "Support Management", "Feature Toggles", "Block"… Uygulama
 * on dile çeviriliyor ve bu metinler HER dilde İngilizce görünüyordu.
 *
 * Sessiz sınıf: eksik çeviri değil bu — i18next'e hiç sorulmuyor, dolayısıyla
 * "eksik anahtar" uyarısı da çıkmıyor. Ekran çalışıyor, yalnız yanlış dilde.
 *
 * Aynı biçim CRM panosundaki "Good Evening" selamlamasında da vardı (548ddd3).
 *
 * Ölçüt JSX metin düğümlerine bakıyor: `>Metin<` biçiminde, süslü parantez
 * içermeyen ve Türkçe karakter taşımayan İngilizce ifadeler. Marka adları ve
 * teknik kısaltmalar muaf.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

/** Çeviriden muaf: marka adları, kısaltmalar, tek harfli etiketler. */
const MUAF = new Set([
  'Medagama', 'MedStream', 'Medstream', 'CRM', 'GDPR', 'KVKK', 'HIPAA', 'PDF',
  'CSV', 'AI', 'SSL', 'API', 'URL', 'ID', 'OK', 'TR', 'EN', 'EUR', 'USD',
  'TRY', 'GBP', 'Vasco', 'Vasco AI', 'SuperAdmin', 'WhatsApp', 'Facebook', 'Google',
  'Google Calendar', 'Outlook', 'Instagram', 'LinkedIn', 'YouTube', 'Twitter',
]);

const TURKCE = /[çğıöşüÇĞİÖŞÜ]/;
const METIN_DUGUMU = />(\s*)([A-Z][A-Za-z][A-Za-z \-&/']{3,40})(\s*)</g;

function ekranlar(dizin) {
  const bulunan = [];

  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name.startsWith('.') || g.name === '__tests__') continue;

    const tam = path.join(dizin, g.name);

    if (g.isDirectory()) bulunan.push(...ekranlar(tam));
    else if (g.name.endsWith('.jsx')) bulunan.push(tam);
  }

  return bulunan;
}

/**
 * Hukuki sayfalar KAPSAM DIŞI.
 *
 * Gizlilik Politikası, Kullanım Koşulları ve Çerez Politikası'nda 158 sabit
 * metin var. Onları `t()` ile sarmalamak yanlış olurdu: KVKK/GDPR metinlerinin
 * on dilde HUKUKEN GEÇERLİ çevirisi gerekiyor, makine sarmalaması değil. Bu
 * bir ürün/hukuk kararı ve müşteriye bırakıldı.
 */
const HUKUKI = new Set([
  'PrivacyPolicyPage.jsx',
  'TermsOfServicePage.jsx',
  'CookiePolicyPage.jsx',
  'CookieInfoPopup.jsx',
  'DataPrivacyRightsPage.jsx',
  'PrivacyPopup.jsx',
]);

/**
 * Bilinçli olarak çevrilmeyenler.
 *
 * `DELETE` kullanıcının onay için YAZMASI gereken sabit sözcük — çevirmek
 * karşılaştırmayı bozar. `DEV MODE` yalnız geliştirme kipinde çiziliyor.
 */
const BILINCLI = new Set(['Profile.jsx', 'CRMTelehealth.jsx']);

test('ekranlarda sabit İngilizce metin yok', () => {
  const ihlaller = [];

  const taranacak = [
    ...ekranlar(path.join(kok, 'src/screens')),
    ...ekranlar(path.join(kok, 'src/components')),
    ...ekranlar(path.join(kok, 'src/context')),
  ].filter((y) => !HUKUKI.has(path.basename(y)) && !BILINCLI.has(path.basename(y)));

  for (const yol of taranacak) {
    const kaynak = readFileSync(yol, 'utf8');

    for (const m of kaynak.matchAll(METIN_DUGUMU)) {
      const metin = m[2].trim();

      if (MUAF.has(metin) || TURKCE.test(metin)) continue;

      const satir = kaynak.slice(0, m.index).split('\n').length;

      ihlaller.push(`${path.basename(yol)}:${satir} "${metin}"`);
    }
  }

  assert.deepEqual(
    ihlaller,
    [],
    'ekrana doğrudan yazılmış metin: on dilin hepsinde İngilizce görünür ve eksik-anahtar uyarısı vermez',
  );
});

/**
 * Öznitelikler de kullanıcıya görünüyor.
 *
 * İlk tarama yalnız `>Metin<` düğümlerine bakıyordu. `placeholder`,
 * `aria-label`, `title` ve `alt` de ekrana ya da ekran okuyucuya gidiyor;
 * `aria-label` özellikle, çünkü görme engelli kullanıcının duyduğu tek metin o.
 *
 * Bu yüzey ölçüldüğünde neredeyse temizdi — on bir örnekten dokuzu marka adı.
 * Ölçüt onu böyle tutuyor.
 */
test('öznitelik metinleri de çeviriden geçiyor', () => {
  const OZNITELIK = /\b(placeholder|aria-label|title|alt)="([A-Za-z][A-Za-z0-9 ,.\-&/'?!]{3,60})"/g;
  const ihlaller = [];

  const taranacak = [
    ...ekranlar(path.join(kok, 'src/screens')),
    ...ekranlar(path.join(kok, 'src/components')),
  ].filter((y) => !HUKUKI.has(path.basename(y)));

  for (const yol of taranacak) {
    const kaynak = readFileSync(yol, 'utf8');

    for (const m of kaynak.matchAll(OZNITELIK)) {
      const metin = m[2].trim();

      if (MUAF.has(metin) || TURKCE.test(metin)) continue;

      const satir = kaynak.slice(0, m.index).split('\n').length;

      ihlaller.push(`${path.basename(yol)}:${satir} ${m[1]}="${metin}"`);
    }
  }

  assert.deepEqual(ihlaller, [], 'öznitelik metni çeviriden geçmiyor');
});

test('muafiyet listesi taramayı boşa çıkarmıyor', () => {
  // Muafiyetler büyüyerek ölçütü anlamsızlaştırmasın.
  assert.ok(MUAF.size < 40, 'muafiyet listesi şişmiş: tarama artık bir şey söylemiyor');
});
