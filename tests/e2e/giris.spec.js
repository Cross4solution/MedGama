const { test, expect } = require('@playwright/test');
const { HESAPLAR, cerezBandiniKapat } = require('./yardimcilar');

/**
 * Giriş formu — arayüzden, gerçek tıklamalarla.
 *
 * Not: alanlar etiketlerine bağlı değil (label'da htmlFor yok), bu yüzden
 * name özniteliğiyle seçiliyor. Etiketle seçmek sessizce boşa düşüyordu.
 */
test.describe('Giriş', () => {
  const oturumVarMi = (page) => page.evaluate(() => {
    try { return !!JSON.parse(localStorage.getItem('auth_state') || '{}')?.token; }
    catch { return false; }
  });

  test.beforeEach(async ({ page }) => {
    // Oturumsuz başla — bu dosya girişin kendisini test ediyor.
    await page.context().clearCookies();
    await page.goto('/tr/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await cerezBandiniKapat(page);
  });

  test('hasta e-posta ve şifresiyle giriş yapabiliyor', async ({ page }) => {
    // ":visible" şart: sayfada aynı formun gizli bir kopyası da var (mobil/masaüstü).
    await page.locator('input[name="email"]:visible').first().fill(HESAPLAR.hasta.email);
    await page.locator('input[name="password"]:visible').first().fill(HESAPLAR.hasta.sifre);
    await page.locator('button:visible').filter({ hasText: /^Giriş Yap$/ }).first().click();

    await expect.poll(() => oturumVarMi(page), {
      message: 'Giriş sonrası oturum kurulmadı',
      timeout: 30_000,
    }).toBe(true);

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('yanlış şifre girişi reddediyor', async ({ page }) => {
    // ":visible" şart: sayfada aynı formun gizli bir kopyası da var (mobil/masaüstü).
    await page.locator('input[name="email"]:visible').first().fill(HESAPLAR.hasta.email);
    await page.locator('input[name="password"]:visible').first().fill('kesinlikle-yanlis-sifre');
    await page.locator('button:visible').filter({ hasText: /^Giriş Yap$/ }).first().click();

    // Hata metninin sözü değişebilir; asıl güvence oturumun açılmamış olması.
    await page.waitForTimeout(5000);
    expect(await oturumVarMi(page)).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });
});
