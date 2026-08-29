// Randevu takviminin günleri telefonda parmakla seçilebilmeli.
//
// Takvim ile saat listesi yan yana duran iki sütundu. Telefonda takvime
// 138px kalıyordu: yedi sütun × 14px. Gün düğmeleri 14×16px oluyor — 31'i
// birden WCAG 2.5.8'in istediği 24px'in altında — ve gün başlıkları
// ("Pzt Sal Çar") hücrelerinden taşıp üst üste biniyordu.
//
// Sayfa ölçümü bunu göremez: pencere sayfayı kaydırmaz, kapalıyken de
// ağaçta yoktur. Taşma da yoktu — düğmeler ekranın içindeydi, sadece
// dokunulamayacak kadar küçüktüler.
const fs = require('node:fs');
const { test, expect, devices } = require('@playwright/test');
const { oturumDosyasi, apiKok } = require('./yardimcilar');

const TELEFON = devices['iPhone 13 Mini'];

test.beforeAll(() => {
  expect(TELEFON, 'cihaz tanımı bulunamadı; ölçüm masaüstüne düşerdi').toBeTruthy();
  expect(TELEFON.viewport.width).toBeLessThan(400);
});

// WCAG 2.5.8 (Target Size, Minimum): 24×24 CSS px.
const ASGARI_HEDEF = 24;

for (const genislikPx of [375, 320]) {
  test.describe(`randevu takvimi @${genislikPx}px`, () => {
    test.use({
      viewport: { width: genislikPx, height: TELEFON.viewport.height },
      userAgent: TELEFON.userAgent,
      deviceScaleFactor: TELEFON.deviceScaleFactor,
      isMobile: TELEFON.isMobile,
      hasTouch: TELEFON.hasTouch,
      storageState: oturumDosyasi('hasta'),
    });

    test('gün düğmeleri parmakla seçilebilecek büyüklükte', async ({ page }) => {
      test.setTimeout(300_000);

      if (!fs.existsSync(oturumDosyasi('hasta'))) {
        test.skip(true, 'Hasta oturumu yok.');
      }

      // Hangi hekimin sayfası olduğu önemli değil; takvim ortak bileşen.
      // Branş sayfasından tıklamak yerine hekim doğrudan API'den alınıyor:
      // liste sayfasının bağlantı yapısı değişince ölçüt sessizce zaman
      // aşımına uğruyor ve hiçbir şey ölçmemiş oluyordu.
      const kok = apiKok();
      if (!kok) test.skip(true, 'E2E_API_ORIGIN tanımlı değil.');
      const liste = await (await fetch(`${kok}/api/doctors?per_page=5`,
        { headers: { Accept: 'application/json' } })).json();
      const hekim = (liste.data || liste)[0];
      const kimlik = hekim?.codename || hekim?.id;
      expect(kimlik, 'hekim bulunamadı — ölçüm yapılamaz').toBeTruthy();

      await page.goto(`/doctor/${kimlik}`, { waitUntil: 'domcontentloaded' });
      await page.locator('button').first().waitFor({ timeout: 90000 });
      await page.waitForTimeout(3000);

      const randevu = page.locator('button').filter({ hasText: /Randevu|Book/i }).first();
      await expect(
        randevu,
        'randevu düğmesi bulunamadı — pencere açılmadı, ölçüm bir şey kanıtlamaz',
      ).toBeVisible({ timeout: 30000 });
      await randevu.click();
      await page.waitForTimeout(2000);

      // 1. adım randevu türünü soruyor; seçilmeden takvim çizilmiyor.
      const tur = page.locator('.fixed button').filter({ hasText: /Yüz Yüze|In-person/i }).first();
      if (await tur.isVisible().catch(() => false)) {
        await tur.click();
        await page.waitForTimeout(2000);
      }

      const izgara = page.locator('div[class*="grid-cols-7"]').first();
      await expect(izgara, 'takvim çizilmedi').toBeVisible({ timeout: 30000 });

      const olcum = await page.evaluate((asgari) => {
        const g = document.documentElement.clientWidth;
        const izgaralar = [...document.querySelectorAll('div[class*="grid-cols-7"]')];
        const basliklar = [...izgaralar[0].children].map((e) => e.getBoundingClientRect());

        let ustUste = 0;
        for (let i = 1; i < basliklar.length; i++) {
          if (basliklar[i].left < basliklar[i - 1].right - 1) ustUste++;
        }

        const gunler = [...document.querySelectorAll('div[class*="grid-cols-7"] button')];
        const kucuk = gunler
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width < asgari || r.height < asgari);

        const kutu = izgaralar[0].closest('div[class*="border"]')?.getBoundingClientRect();
        return {
          sutun: Math.round(basliklar[0]?.width || 0),
          ustUste,
          kucukHedefSayisi: kucuk.length,
          ornekHedef: kucuk[0] ? `${Math.round(kucuk[0].width)}×${Math.round(kucuk[0].height)}` : null,
          tasma: kutu ? Math.max(0, Math.round(kutu.right - g)) : 0,
        };
      }, ASGARI_HEDEF);

      expect(
        olcum.kucukHedefSayisi,
        `${olcum.kucukHedefSayisi} gün düğmesi ${ASGARI_HEDEF}px altında `
        + `(ör. ${olcum.ornekHedef}); sütun genişliği ${olcum.sutun}px.`,
      ).toBe(0);

      expect(olcum.ustUste, 'gün başlıkları üst üste biniyor').toBe(0);
      expect(olcum.tasma, 'takvim ekranın dışına taşıyor').toBe(0);
    });
  });
}
