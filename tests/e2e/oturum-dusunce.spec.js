/**
 * OTURUM DÜŞTÜĞÜNDE — kullanıcı nereye düşüyor, ne öğreniyor?
 *
 * Jeton süresi dolduğunda ya da sunucuda iptal edildiğinde her istek 401
 * dönüyor. Ölçüldüğünde uygulama jetonu doğru temizliyordu ama kullanıcıyı
 * PAZARLAMA ana sayfasına atıyordu:
 *
 *   /tr/crm            → /        "Dünyanın #1 Sağlık Portalı"
 *   /tr/medical-archive → /        aynı sayfa
 *
 * Üç ayrı kayıp vardı. Ne olduğunu söyleyen bir şey yoktu — CRM'de çalışan
 * klinik, uygulamanın bozulduğunu sanır. Dil düşüyordu (`/tr/...` → `/`).
 * Ve kaldığı yer kayboluyordu: tekrar giren kullanıcı rolünün varsayılan
 * ekranına düşüyor, yarım kalan işine dönemiyordu.
 *
 * Rol tespiti de kırılgandı. 401'i yakalayan yer depoyu temizledikten SONRA
 * olay yayıyordu, dinleyici de rolü React durumundan okuyordu — o durum 401
 * anında henüz dolmamış olabiliyor. Sayfa açılışında birden çok istek aynı
 * anda 401 aldığı için aynı klinik oturumu bazen /clinic-login'e, bazen
 * /login'e düşüyordu. Rol artık olayla taşınıyor ve modül düzeyinde
 * hatırlanıyor.
 *
 * VERİ ÜRETMEZ: 401 tarayıcıda üretiliyor, sunucuya istek gitmiyor.
 */
const { test, expect } = require('@playwright/test');
const { oturumDosyasi } = require('./kurulum');

/**
 * Giriş ekranına varmayı bekler.
 *
 * `waitForURL` burada işe yaramıyor: yönlendirme `window.location.href` ile
 * yapılıyor, yani TAM sayfa gezinmesi. Playwright'ın beklediği çerçeve
 * kopuyor ve çağrı `ERR_ABORTED` ile düşüyor. Adresi yoklamak sağlam.
 */
async function girisEkraniniBekle(page) {
  await expect.poll(
    () => new URL(page.url()).pathname,
    { timeout: 15000, message: 'giriş ekranına yönlendirme gelmedi' },
  ).toMatch(/login/);

  // Yönlendirme sonrası sayfanın yerleşmesi.
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/** Her API isteği reddediliyor — iptal edilmiş jeton gibi. */
async function jetonuReddet(page) {
  await page.route('**/api/**', (rota) => rota.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Unauthenticated.' }),
  }));
}

test.describe('klinik oturumu düşünce', () => {
  test.use({ storageState: oturumDosyasi('klinik') });

  test('pazarlama sayfasına değil, kendi giriş ekranına düşüyor', async ({ page }) => {
    await jetonuReddet(page);
    await page.goto('/tr/crm/patients', { waitUntil: 'domcontentloaded' });
    await girisEkraniniBekle(page);

    const adres = new URL(page.url());

    // Klinik kullanıcısı kliniğin giriş ekranına gidiyor, hastanınkine değil.
    expect(adres.pathname).toBe('/tr/clinic-login');

    // Dil korunuyor.
    expect(adres.pathname.startsWith('/tr/')).toBe(true);

    // Kaldığı yer taşınıyor.
    expect(adres.searchParams.get('next')).toBe('/tr/crm/patients');
    expect(adres.searchParams.get('expired')).toBe('1');
  });

  test('ne olduğunu söylüyor', async ({ page }) => {
    await jetonuReddet(page);
    await page.goto('/tr/crm', { waitUntil: 'domcontentloaded' });
    await girisEkraniniBekle(page);

    await expect(
      page.getByText(/Oturumunuz sona erdi|session ended/i).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('jeton gerçekten siliniyor', async ({ page }) => {
    // Yönlendirme kolaylık; asıl mesele jetonun kalmaması.
    await jetonuReddet(page);
    await page.goto('/tr/crm', { waitUntil: 'domcontentloaded' });
    await girisEkraniniBekle(page);

    const kalan = await page.evaluate(() => ({
      auth: localStorage.getItem('auth_state'),
      token: localStorage.getItem('access_token'),
      oturum: sessionStorage.getItem('access_token'),
    }));

    expect(kalan).toEqual({ auth: null, token: null, oturum: null });
  });
});

test.describe('hasta oturumu düşünce', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  test('hastanın kendi giriş ekranına düşüyor', async ({ page }) => {
    await jetonuReddet(page);
    await page.goto('/tr/medical-archive', { waitUntil: 'domcontentloaded' });
    await girisEkraniniBekle(page);

    const adres = new URL(page.url());
    expect(adres.pathname).toBe('/tr/login');
    expect(adres.searchParams.get('next')).toBe('/tr/medical-archive');
  });
});
