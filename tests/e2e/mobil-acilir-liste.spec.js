// Açılır seçim listesi ekranın dışına taşmamalı.
//
// `SelectCombobox` panelini `position: fixed` ile tetikleyicinin soluna
// hizalıyor, ama panelin `min-w-[220px]` tabanı var. Tetikleyici dar (132px)
// ve sağa yakın olduğunda panel ekranı aşıyordu: MedStream'in branş süzgeci
// 375px'te 39px, 390px'te 31px dışarı çıkıyor ve seçeneklerin sağ tarafı
// okunamıyordu.
//
// Sayfa taraması bunu göremez — sabit konumlu öğe belgeyi genişletmez, yani
// `mobil-yatay-kayma.spec.js` yeşil kalır. Kapalıyken de ağaçta yoktur.
const { test, expect, devices } = require('@playwright/test');

const TELEFON = devices['iPhone 13 Mini'];

test.beforeAll(() => {
  expect(TELEFON, 'cihaz tanımı bulunamadı; ölçüm masaüstüne düşerdi').toBeTruthy();
  expect(TELEFON.viewport.width).toBeLessThan(400);
});

for (const genislikPx of [375, 320]) {
  test.describe(`/medstream branş süzgeci @${genislikPx}px`, () => {
    test.use({
      viewport: { width: genislikPx, height: TELEFON.viewport.height },
      userAgent: TELEFON.userAgent,
      deviceScaleFactor: TELEFON.deviceScaleFactor,
      isMobile: TELEFON.isMobile,
      hasTouch: TELEFON.hasTouch,
    });

    test('açılan liste ekranın içinde kalıyor', async ({ page }) => {
      test.setTimeout(300_000);

      await page.goto('/medstream', { waitUntil: 'domcontentloaded' });
      await page.locator('button, a[href]').first().waitFor({ timeout: 90000 });
      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(1500);

      // Sayfada "Tümü" yazan birden çok denetim var; panel açılana kadar
      // sırayla deneniyor. Hiçbiri açmazsa test SESSİZCE GEÇMESİN.
      const adaylar = page.locator('button, [role="button"]').filter({ hasText: /Tümü|All/ });
      const sayi = await adaylar.count();
      let acildi = false;
      for (let i = 0; i < sayi; i++) {
        await adaylar.nth(i).click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(600);
        acildi = await page.locator('div[class*="min-w-[220px]"]').isVisible().catch(() => false);
        if (acildi) break;
        await page.keyboard.press('Escape');
      }

      expect(acildi, 'branş süzgeci hiç açılmadı — ölçüm bir şey kanıtlamaz').toBe(true);

      const olcum = await page.evaluate(() => {
        const g = document.documentElement.clientWidth;
        const panel = document.querySelector('div[class*="min-w-[220px]"]');
        const r = panel.getBoundingClientRect();
        return {
          sagTasma: Math.max(0, Math.round(r.right - g)),
          solTasma: Math.max(0, Math.round(-r.left)),
          olcu: `${Math.round(r.left)}…${Math.round(r.right)}`,
        };
      });

      expect(
        [olcum.sagTasma, olcum.solTasma],
        `panel ${olcum.olcu} aralığında, ekran 0…${genislikPx} — dışarı taşıyor.`,
      ).toEqual([0, 0]);
    });
  });
}
