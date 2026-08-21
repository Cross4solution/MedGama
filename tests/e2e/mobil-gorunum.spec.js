const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat } = require('./yardimcilar');

/**
 * MOBİL GÖRÜNÜM — dar ekranda ne bozuluyor?
 *
 * Şimdiye kadar her şey masaüstü genişliğinde denendi. Sağlık platformunun
 * ziyaretçilerinin büyük kısmı telefondan geliyor; masaüstünde kusursuz duran
 * bir ekranın telefonda kullanılamaz olması sık rastlanan bir durum.
 *
 * Üç somut arıza aranıyor:
 *
 *   1. YATAY TAŞMA — sayfa ekrandan geniş. Kullanıcı sağa sola kaydırmak
 *      zorunda kalıyor, metin kesiliyor. Tek bir sabit genişlikli öğe tüm
 *      sayfayı taşırmaya yeter, o yüzden gözle fark edilmesi zor.
 *   2. DOKUNULAMAYAN DÜĞME — 24 pikselden küçük tıklama alanı. Parmakla
 *      isabet ettirilemiyor.
 *   3. EKRAN DIŞINA TAŞAN ÖĞE — sol kenardan dışarı çıkmış içerik.
 *
 * Ölçüt yatay taşma; diğer ikisi raporlanıp elle triyaj ediliyor, çünkü
 * tasarım kararıyla küçük bırakılmış ikonlar olabiliyor.
 *
 * VERİ ÜRETMEZ.
 */

const TELEFON = { width: 390, height: 844 }; // iPhone 14 sınıfı

const HERKESE_ACIK = [
  '/tr', '/tr/medstream', '/tr/browse/clinics', '/tr/doctors-departments',
  '/tr/tedaviler', '/tr/search', '/tr/about', '/tr/contact', '/tr/login',
  '/tr/register', '/tr/telehealth', '/tr/for-patients', '/tr/for-clinics',
];

const HASTA_SAYFALARI = [
  '/tr/patient-dashboard', '/tr/patient/appointments', '/tr/patient/invoices',
  '/tr/profile', '/tr/notifications', '/tr/medical-archive', '/tr/saved',
];

/** Sayfanın dar ekranda ne kadar taştığını ve küçük düğmeleri ölçer. */
async function olc(page) {
  return page.evaluate(() => {
    const govde = document.documentElement;
    const tasma = govde.scrollWidth - govde.clientWidth;

    // Ekranın sağından ya da solundan taşan görünür öğeler
    const tasanlar = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') continue;
      // Kaydırılabilir kapsayıcının kendi içeriği taşabilir — bu kasıtlı.
      if (r.right > window.innerWidth + 2 || r.left < -2) {
        const kapsayiciKaydirir = el.closest('[style*="overflow"], .overflow-x-auto, .overflow-auto, .overflow-scroll');
        if (kapsayiciKaydirir && kapsayiciKaydirir !== el) continue;
        tasanlar.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''} → ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
      if (tasanlar.length >= 5) break;
    }

    // Parmakla isabet ettirilemeyecek kadar küçük tıklanabilir öğeler
    const kucukDugmeler = [];
    for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 24 || r.height < 24) {
        kucukDugmeler.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || '').trim().slice(0, 20)}"`);
      }
      if (kucukDugmeler.length >= 5) break;
    }

    return { tasma, tasanlar, kucukDugmeler, metinUzunluk: (document.body.innerText || '').trim().length };
  });
}

function mobilTesti(baslik, yollar, oturum) {
  test(baslik, async ({ browser }) => {
    test.setTimeout(yollar.length * 45_000 + 60_000);

    const context = await browser.newContext({
      viewport: TELEFON,
      isMobile: true,
      hasTouch: true,
      ...(oturum ? { storageState: oturum } : {}),
    });
    const page = await context.newPage();
    const sorunlu = [];

    try {
      for (const yol of yollar) {
        try {
          await page.goto(yol, { waitUntil: 'domcontentloaded', timeout: 45_000 });
          await cerezBandiniKapat(page);
          await page.waitForTimeout(2500);

          const o = await olc(page);
          const satir = `${String(o.tasma).padStart(4)}px taşma  ${yol}`;
          console.log(`  ${o.tasma > 4 ? '✗' : '✓'} ${satir}`);

          if (o.tasma > 4) {
            sorunlu.push(`${yol} → ${o.tasma}px yatay taşma | ${o.tasanlar.slice(0, 3).join(' ; ') || 'taşan öğe bulunamadı'}`);
          }
          if (o.kucukDugmeler.length) {
            console.log(`        küçük düğme: ${o.kucukDugmeler.slice(0, 3).join(' | ')}`);
          }
        } catch (e) {
          sorunlu.push(`${yol} → açılamadı: ${String(e.message || e).split('\n')[0].slice(0, 100)}`);
        }
      }
    } finally {
      await context.close();
    }

    expect(sorunlu, 'Dar ekranda yatay taşma').toEqual([]);
  });
}

test.describe('Mobil görünüm', () => {
  test.describe.configure({ mode: 'serial' });

  mobilTesti('herkese açık sayfalar telefonda taşmıyor', HERKESE_ACIK, null);
  mobilTesti('hasta sayfaları telefonda taşmıyor', HASTA_SAYFALARI, oturumDosyasi('hasta'));
});
