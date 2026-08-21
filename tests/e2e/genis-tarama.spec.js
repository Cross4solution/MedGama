const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat } = require('./yardimcilar');

/**
 * GENİŞ TARAMA — her ekranı aç, ne kırıldığını gör.
 *
 * Diğer testler derin ve dar: belli bir akışı sonuna kadar sürüyorlar. Bu
 * dosya tam tersi — sığ ve geniş. Sistemdeki her rotayı ilgili rolle açıp
 * dört şeye bakıyor:
 *
 *   1. ÇÖKME       — yakalanmamış çalışma-anı hatası (beyaz ekran)
 *   2. SUNUCU      — 5xx dönen istek
 *   3. BOŞ EKRAN   — sayfa açıldı ama içerik yok
 *   4. ÇEVİRİ      — ekranda ham çeviri anahtarı ("crm.patients.tagLower")
 *
 * Neden gerekli: canlıda fatura kesmek hiç çalışmıyordu ve 77 testin hiçbiri
 * görmemişti, çünkü hiçbiri o ekranı açıp bakmıyordu. Sığ ama geniş bir
 * geçiş, derin testlerin göremediği bu tür boşlukları yakalıyor.
 *
 * Rapor: tests/e2e/rapor/tarama.json  (özet ayrıca konsola basılır)
 *
 * VERİ ÜRETMEZ: yalnızca sayfa açılır, hiçbir form gönderilmez.
 */

const RAPOR_KLASOR = path.join(__dirname, 'rapor');

// Dinamik rotalar ([id], [handle]) gerçek kayıt ister; ayrı ele alınacak.
const HERKESE_ACIK = [
  '/', '/about', '/auth', '/browse/clinics', '/browse/treatments', '/contact',
  '/cookie-policy', '/data-rights', '/doctors-departments', '/explore',
  '/for-clinics', '/for-patients', '/forgot-password', '/home', '/home-v2',
  '/kvkk', '/login', '/medstream', '/privacy', '/privacy-policy', '/register',
  '/search', '/tedaviler', '/telehealth', '/terms', '/terms-of-service',
  '/vasco-ai', '/clinic-login', '/doctor-login', '/hospital-login',
];

const HASTA_ROTALARI = [
  '/dashboard', '/patient-dashboard', '/patient/appointments', '/patient/invoices',
  '/profile', '/settings', '/notifications', '/saved', '/saved-clinics',
  '/medical-archive', '/telehealth-appointment', '/verify-email',
];

const KLINIK_ROTALARI = [
  '/crm', '/crm/appointments', '/crm/billing', '/crm/branches', '/crm/calendar',
  '/crm/clinic-manager', '/crm/contact-inbox', '/crm/documents', '/crm/examination',
  '/crm/faq', '/crm/help', '/crm/integrations', '/crm/leads', '/crm/medstream',
  '/crm/messages', '/crm/patients', '/crm/prescriptions', '/crm/reports',
  '/crm/revenue', '/crm/reviews', '/crm/salespeople', '/crm/settings',
  '/crm/staff', '/crm/support', '/crm/telehealth',
  '/clinic', '/clinic-edit', '/clinic/dashboard', '/clinic/team',
];

const DOKTOR_ROTALARI = [
  '/doctor/dashboard', '/doctor/appointments', '/doctor/billing', '/doctor-chat',
];

const YONETICI_ROTALARI = [
  '/admin', '/admin/announcements', '/admin/audit-logs', '/admin/catalog',
  '/admin/feature-toggles', '/admin/financials', '/admin/moderation',
  '/admin/reviews', '/admin/settings', '/admin/support', '/admin/users',
  '/admin/verification',
];

/**
 * Ham çeviri anahtarı: "crm.patients.tagLower" gibi. Çeviri bulunamayınca
 * i18next anahtarın kendisini basıyor; ekranda nokta ayraçlı, boşluksuz,
 * deveKamburu bir dizi görünüyorsa çeviri eksik demektir.
 *
 * Alan adı, dosya adı ve sürüm numarası da bu kalıba benziyor — onları
 * dışarıda bırakmak için bilinen uzantılar eleniyor.
 */
const ANAHTAR_KALIBI = /\b[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*){1,4}\b/g;
const YOK_SAY = /\.(com|net|org|tr|io|dev|co|app|json|jsx?|tsx?|png|jpe?g|svg|pdf|css|html?|xml|webp)$/i;

function hamAnahtarlar(metin) {
  const bulunan = new Set();
  for (const parca of metin.match(ANAHTAR_KALIBI) || []) {
    if (YOK_SAY.test(parca)) continue;
    if (/^\d/.test(parca)) continue;
    // Gerçek anahtarlar en az bir deveKamburu ya da bilinen ön ek taşıyor;
    // "ör.bir.cümle" gibi düz metinleri elemek için.
    if (!/[a-z][A-Z]/.test(parca) && !/^(crm|admin|common|auth|nav|footer|home|patient|doctor|clinic|medstream|telehealth|billing|profile|settings|errors?|validation)\./.test(parca)) continue;
    bulunan.add(parca);
  }
  return [...bulunan];
}

/** Tek bir rotayı açar ve ne kırıldığını döndürür. */
async function rotayiDene(page, dil, rota) {
  const cokmeler = [];
  const sunucuHatalari = [];
  const konsolHatalari = [];

  const cokmeDinle = (e) => cokmeler.push(String((e && e.message) || e));
  const yanitDinle = (r) => {
    if (r.status() >= 500) sunucuHatalari.push(`${r.status()} ${new URL(r.url()).pathname}`);
  };
  const konsolDinle = (m) => {
    if (m.type() === 'error') konsolHatalari.push(m.text().slice(0, 200));
  };

  page.on('pageerror', cokmeDinle);
  page.on('response', yanitDinle);
  page.on('console', konsolDinle);

  const sonuc = { dil, rota, url: null, durum: 'tamam', cokmeler, sunucuHatalari, konsolHatalari, hamAnahtar: [], metinUzunluk: 0 };

  try {
    const yanit = await page.goto(`/${dil}${rota === '/' ? '' : rota}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    if (yanit && yanit.status() >= 400) sonuc.durum = `http ${yanit.status()}`;

    await cerezBandiniKapat(page);
    // İçerik istemcide geliyor; bir miktar beklemeden ölçmek yanıltıyor.
    await page.waitForTimeout(3500);

    sonuc.url = page.url();

    const govde = await page.locator('body').innerText().catch(() => '');
    sonuc.metinUzunluk = govde.trim().length;
    sonuc.hamAnahtar = hamAnahtarlar(govde);

    if (sonuc.metinUzunluk < 40) sonuc.durum = 'bos ekran';
  } catch (e) {
    sonuc.durum = `acilamadi: ${String(e.message || e).split('\n')[0].slice(0, 120)}`;
  } finally {
    page.off('pageerror', cokmeDinle);
    page.off('response', yanitDinle);
    page.off('console', konsolDinle);
  }

  if (cokmeler.length) sonuc.durum = 'COKME';
  return sonuc;
}

/** Bir rolün rotalarını sırayla gezer. */
function taramaTesti(baslik, rotalar, diller, oturum) {
  test(baslik, async ({ browser }) => {
    test.setTimeout(rotalar.length * diller.length * 60_000);

    if (oturum && !fs.existsSync(oturum)) {
      test.skip(true, `Oturum yok: ${path.basename(oturum)}`);
    }

    const context = await browser.newContext(oturum ? { storageState: oturum } : {});
    const page = await context.newPage();
    const sonuclar = [];

    try {
      for (const dil of diller) {
        for (const rota of rotalar) {
          sonuclar.push(await rotayiDene(page, dil, rota));
        }
      }
    } finally {
      await context.close();
    }

    fs.mkdirSync(RAPOR_KLASOR, { recursive: true });
    const dosya = path.join(RAPOR_KLASOR, `${baslik.replace(/\W+/g, '-')}.json`);
    fs.writeFileSync(dosya, JSON.stringify(sonuclar, null, 2));

    // Konsol hataları da özete GİRMELİ. İlk sürümde toplanıyor ama
    // yazılmıyordu; 12 sayfada hata varken rapor "0 sorunlu" diyordu.
    // Raporlar ekranının klinik rolünde tamamen kırık olduğu tam böyle
    // gözden kaçtı: ekran açılıyor, arkada 403 düşüyordu.
    const sorunlu = sonuclar.filter(
      (s) => s.durum !== 'tamam' || s.sunucuHatalari.length || s.hamAnahtar.length || s.konsolHatalari.length,
    );
    console.log(`\n=== ${baslik}: ${sonuclar.length} sayfa, ${sorunlu.length} sorunlu ===`);
    for (const s of sorunlu) {
      console.log(
        `  [${s.durum}] ${s.dil}${s.rota}` +
          (s.sunucuHatalari.length ? ` | 5xx: ${[...new Set(s.sunucuHatalari)].join(', ')}` : '') +
          (s.cokmeler.length ? ` | ÇÖKME: ${s.cokmeler[0]}` : '') +
          (s.hamAnahtar.length ? ` | ham anahtar: ${s.hamAnahtar.slice(0, 4).join(', ')}` : ''),
      );
      for (const h of [...new Set(s.konsolHatalari)].slice(0, 3)) {
        console.log(`        konsol: ${h.slice(0, 140)}`);
      }
    }

    // Tarama bir rapor aracı; tek gerçek kapı çökmeler. Boş ekran ve çeviri
    // eksiği raporda kalıyor, elle triyaj ediliyor — aksi hâlde tek bir
    // gürültülü satır bütün taramayı kırmızıya çevirip işe yaramaz hale
    // getiriyor.
    const cokenler = sonuclar.filter((s) => s.cokmeler.length);
    expect(
      cokenler.map((s) => `${s.dil}${s.rota}: ${s.cokmeler[0]}`),
      'Çöken sayfa var',
    ).toEqual([]);
  });
}

test.describe('Geniş tarama', () => {
  test.describe.configure({ mode: 'serial' });

  taramaTesti('misafir', HERKESE_ACIK, ['tr'], null);
  taramaTesti('hasta', HASTA_ROTALARI, ['tr'], oturumDosyasi('hasta'));
  taramaTesti('doktor', DOKTOR_ROTALARI, ['tr'], oturumDosyasi('demoDoktor'));
  taramaTesti('klinik', KLINIK_ROTALARI, ['tr'], oturumDosyasi('demoKlinik'));
  taramaTesti('yonetici', YONETICI_ROTALARI, ['tr'], oturumDosyasi('yonetici'));
});
