const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Bildirim tercihleri.
 *
 * Tercihler veritabanında tutuluyordu ama hiçbir bildirim onlara bakmıyordu ve
 * ekrandan değiştirilemiyordu. Test hem ekranı hem kaydın gerçekten yazıldığını
 * doğruluyor, sonra ayarı eski hâline geri alıyor — kalıcı iz bırakmıyor.
 */
test.describe('Bildirim tercihleri', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  const TERCIH_YOLU = '/api/auth/profile/notification-preferences';

  const tercihOku = async (page, anahtar) => {
    const { govde } = await apiIstek(page, TERCIH_YOLU);
    const p = govde?.preferences ?? govde?.data?.preferences ?? {};
    return p[anahtar];
  };

  test('kapatılan tercih sunucuya kaydediliyor', async ({ page }) => {
    // Tercihler Bildirimler ekranından Profil'e taşındı: bildirim listesi
    // ekranı yalnızca listeyi gösteriyor.
    await page.goto('/tr/profile');
    await cerezBandiniKapat(page);

    await expect(page.getByText(/Bildirim Tercihleri|Notification Settings/i).first()).toBeVisible();

    const once = await tercihOku(page, 'inapp_social');

    const dugme = page.getByRole('button', { name: /Beğeni ve yorum|Likes and comments/i });
    await expect(dugme).toBeEnabled();
    await dugme.click();

    await expect
      .poll(() => tercihOku(page, 'inapp_social'), {
        message: 'Tercih değişikliği sunucuya kaydedilmedi',
        timeout: 20_000,
      })
      .not.toBe(once);

    // Eski hâline döndür. Sunucu değeri, tarayıcının kendi isteği daha
    // sonuçlanmadan da değişmiş görünebiliyor; düğme yeniden etkinleşmeden
    // basılan tık kayboluyordu. Onun için önce düğmenin hazır olmasını bekle.
    await expect(dugme).toBeEnabled();
    await dugme.click();
    await expect.poll(() => tercihOku(page, 'inapp_social'), { timeout: 20_000 }).toBe(once);
  });

  test('randevu bildirimleri kapatılabilir tercihler arasında değil', async ({ page }) => {
    // Tercihler Bildirimler ekranından Profil'e taşındı: bildirim listesi
    // ekranı yalnızca listeyi gösteriyor.
    await page.goto('/tr/profile');

    const { govde } = await apiIstek(page, TERCIH_YOLU);
    const anahtarlar = Object.keys(govde?.preferences ?? govde?.data?.preferences ?? {});
    expect(anahtarlar.length, 'Tercih listesi boş döndü').toBeGreaterThan(0);

    for (const a of anahtarlar) {
      expect(a, `Randevu bildirimi kapatılabilir görünüyor: ${a}`).not.toMatch(/appointment|randevu|reminder/i);
    }
  });

  test('bildirim listesi yükleniyor', async ({ page }) => {
    await page.goto('/tr/notifications');
    await cerezBandiniKapat(page);

    const { http } = await apiIstek(page, '/api/notifications?per_page=5');
    expect(http).toBe(200);

    await expect(page.getByRole('heading', { name: /Bildirimler|Notifications/i }).first()).toBeVisible();
  });
});
