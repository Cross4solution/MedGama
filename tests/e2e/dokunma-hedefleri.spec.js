const { test, expect } = require('@playwright/test');
const { oturumDosyasi } = require('./yardimcilar');

/**
 * Dokunma hedefleri — mobil genişlikte, oturum açılmış ekranlarda.
 *
 * WCAG 2.2 AA "Target Size (Minimum)" tabanı 24×24 CSS pikseli. Bunun altındaki
 * bir düğme parmakla güvenilir biçimde vurulamıyor; kullanıcı ıskalıyor,
 * yanındakine basıyor ya da tıklamadığını sanıyor. Hiçbir hata görünmüyor.
 *
 * Ölçüldüğünde on iki ekranda 24px altında ON BEŞ hedef vardı, dört kalıpta:
 *
 *   • CRM panosundaki içgörü noktaları 4×4 px'ti — düğmenin KENDİSİ nokta
 *     kadardı. Nokta artık düğmenin içinde bir span; görünüm aynı, vuruş
 *     alanı 24px.
 *   • "Tümünü Gör" bağlantıları (dört yerde) 16px yüksekliğindeydi.
 *   • Hasta listesindeki "etiket" / "aşama" eylemleri 15px.
 *   • Aynı listenin sıralama başlığı 17px.
 *
 * 24–44px aralığındaki hedefler bilinçli olarak KAPSAM DIŞI: onlar AA'yı
 * karşılıyor, AAA'nın 44px'i bir tasarım kararı ve müşteriye ait.
 *
 * Ölçüt yalnız 24px tabanını tutuyor.
 */

const MOBIL = { width: 375, height: 812 };

const EKRANLAR = [
  ['hasta', '/patient-dashboard'],
  ['hasta', '/notifications'],
  ['doktor', '/crm'],
  ['doktor', '/crm/patients'],
  ['doktor', '/crm/appointments'],
  ['klinik', '/clinic/dashboard'],
  ['klinik', '/crm/leads'],
  ['hastane', '/crm'],
];

/** Görünür, tıklanabilir ve en kısa kenarı 24px'in altında olan hedefler. */
async function kucukHedefler(page) {
  return page.evaluate(() => {
    const bulunan = [];
    const kok = document.querySelector('main#icerik') || document.body;

    for (const e of kok.querySelectorAll('a[href], button, [role="button"], select')) {
      const kutu = e.getBoundingClientRect();

      if (!kutu.width || !kutu.height) continue;

      const bicim = getComputedStyle(e);

      if (bicim.visibility === 'hidden' || bicim.display === 'none' || bicim.pointerEvents === 'none') {
        continue;
      }

      const enKisa = Math.min(kutu.width, kutu.height);

      if (enKisa < 24) {
        const ad = (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().replace(/\s+/g, ' ');

        bulunan.push(`${Math.round(enKisa)}px "${ad.slice(0, 30)}"`);
      }
    }

    return bulunan;
  });
}

for (const [rol, yol] of EKRANLAR) {
  // Başlıkta rol de var: `/crm` iki farklı rolle geziliyor ve yalnız yol
  // kullanılınca Playwright başlığı yinelenmiş sayıyor.
  test.describe(`Dokunma hedefleri — ${rol} ${yol}`, () => {
    test.use({ storageState: oturumDosyasi(rol), viewport: MOBIL, isMobile: true, hasTouch: true });

    test('24px altında dokunma hedefi yok', async ({ page }) => {
      await page.goto(`/tr${yol}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);

      // Oturum düşmüşse ekran hiç açılmaz ve ölçüt boş bir sayfaya yeşil yanar.
      expect(new URL(page.url()).pathname, 'ekran açılmadı — oturum düşmüş olabilir')
        .toBe(`/tr${yol}`);

      expect(await kucukHedefler(page), 'WCAG 2.2 AA tabanının altında hedef var').toEqual([]);
    });
  });
}
