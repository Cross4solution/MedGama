const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Profil ekranı otomatik kaydeder — Kaydet düğmesi yok.
 *
 * Dil ve çeviri tercihi zaten anında kaydediliyordu; ad ve ülke için ayrı bir
 * düğme beklemek tutarsızdı ve kullanıcı düğmeye basmadan çıkınca değişiklik
 * sessizce kayboluyordu. Test hem düğmenin gitmiş olduğunu hem de alandan
 * çıkınca kaydın gerçekten yazıldığını doğruluyor, sonra eski adı geri koyuyor.
 */
test.describe('Profil otomatik kayıt', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  const adOku = async (page) => {
    const { govde } = await apiIstek(page, '/api/auth/me');
    const u = govde?.data ?? govde?.user ?? govde;
    return u?.fullname ?? u?.name;
  };

  test('ad alanından çıkınca kaydediliyor ve Kaydet düğmesi yok', async ({ page }) => {
    await page.goto('/tr/profile');
    await cerezBandiniKapat(page);

    const alan = page.locator('input[name="fullname"]:visible, input[name="name"]:visible').first();
    await expect(alan).toBeVisible();

    const once = await adOku(page);
    expect(once, 'Oturumdaki kullanıcının adı okunamadı').toBeTruthy();

    // Hesap bölümünde kaydetme düğmesi kalmamalı.
    const kaydet = page.getByRole('button', { name: /^(Kaydet|Save)$/i });
    await expect(kaydet).toHaveCount(0);

    const yeni = `${once} X`.slice(0, 30);
    await alan.fill(yeni);
    await alan.blur();

    await expect
      .poll(() => adOku(page), { message: 'Ad sunucuya kaydedilmedi', timeout: 20_000 })
      .toBe(yeni);

    // Eski hâline döndür — test kalıcı iz bırakmasın.
    await alan.fill(once);
    await alan.blur();
    await expect.poll(() => adOku(page), { timeout: 20_000 }).toBe(once);
  });

  test('değişmeyen ad boşuna sunucuya gönderilmiyor', async ({ page }) => {
    await page.goto('/tr/profile');
    await cerezBandiniKapat(page);

    const alan = page.locator('input[name="fullname"]:visible, input[name="name"]:visible').first();
    await expect(alan).toBeVisible();

    let istek = 0;
    page.on('request', (r) => {
      if (r.method() !== 'GET' && /\/api\/auth\/profile(\?|$)/.test(r.url())) istek += 1;
    });

    await alan.click();
    await alan.blur();
    await page.waitForTimeout(1500);

    expect(istek, 'Alan değişmediği hâlde kayıt isteği gitti').toBe(0);
  });
});
