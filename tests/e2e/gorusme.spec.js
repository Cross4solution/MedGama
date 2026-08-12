const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Görüntülü görüşme — onay ve hazırlık ekranları.
 *
 * Test görüşmeye KATILMIYOR: hazırlık ekranında duruyor. Görüşme 1:1 olduğu
 * için katılsaydı müşterinin kalıcı demo görüşmesini meşgul eder, gerçek
 * kullanıcıyı dışarıda bırakırdı.
 */

test.describe('Görüşme ekranı', () => {
  test.use({ storageState: oturumDosyasi('doktor') });

  test('onay ekranından hazırlık ekranına geçiliyor, kamera önizlemesi geliyor', async ({ page }) => {
    await page.goto('/tr/telehealth');

    const { govde } = await apiIstek(page, '/api/appointments?per_page=50');
    const uygun = (govde?.data || []).find(
      (a) => a.status === 'confirmed' && a.appointment_type === 'online'
    );
    test.skip(!uygun, 'Onaylı görüntülü randevu bulunamadı');

    await page.goto(`/tr/telehealth/call/${uygun.id}`);
    await cerezBandiniKapat(page);

    // 1) Onay ekranı
    await expect(page.getByRole('heading', { name: /Görüşmeye Katıl|Join Call/i })).toBeVisible();
    // Tam ad: çerez bandındaki "Tümünü Kabul Et" ile karışmasın.
    await page.getByRole('button', { name: 'Kabul et ve devam et' }).click();

    // 2) Hazırlık ekranı — bu adım yeni; öncesinde doğrudan görüşmeye giriliyordu
    await expect(page.getByRole('heading', { name: /hazır mısınız|Ready to join/i })).toBeVisible();

    // Kendi görüntün oynuyor olmalı. Cihaz açılışı + ses zinciri kurulumu
    // soğuk sayfada birkaç saniye sürebiliyor; sabit bekleme yerine yoklama.
    await expect
      .poll(
        () => page.evaluate(() => document.querySelector('video')?.videoWidth ?? 0),
        { message: 'Hazırlık ekranında kamera önizlemesi gelmedi', timeout: 30_000 }
      )
      .toBeGreaterThan(0);

    // Cihaz seçicileri ve katıl düğmesi
    await expect(page.getByRole('combobox').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Görüşmeye katıl|Join call/i })).toBeVisible();

    // Katılmadan çık — demo görüşmesini meşgul etme.
    // Düğme metnine bağlanmak yerine sayfadan ayrılıyoruz: ayrılınca bileşen
    // kapanıyor ve kamera/mikrofon serbest bırakılıyor.
    await page.goto('/tr/telehealth');
    await expect(page).toHaveURL(/\/telehealth$/);
  });
});

test.describe('Görüşme erişimi', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  test('onaylanmamış randevunun görüşme odası açılmıyor', async ({ page }) => {
    await page.goto('/tr/telehealth');

    const { govde } = await apiIstek(page, '/api/appointments?per_page=50');
    const onaysiz = (govde?.data || []).find((a) => a.status !== 'confirmed');
    test.skip(!onaysiz, 'Onaylanmamış randevu bulunamadı');

    const { http } = await apiIstek(page, `/api/telehealth/${onaysiz.id}/webrtc`);
    expect(http, `"${onaysiz.status}" randevunun odası açılmamalı`).toBe(403);
  });

  test('onaylı randevunun odası açılıyor ve bağlantı bilgisi veriliyor', async ({ page }) => {
    await page.goto('/tr/telehealth');

    const { govde } = await apiIstek(page, '/api/appointments?per_page=50');
    const onayli = (govde?.data || []).find(
      (a) => a.status === 'confirmed' && a.appointment_type === 'online'
    );
    test.skip(!onayli, 'Onaylı görüntülü randevu yok');

    const { http, govde: cfg } = await apiIstek(page, `/api/telehealth/${onayli.id}/webrtc`);
    expect(http).toBe(200);

    const ice = cfg?.ice_servers || cfg?.data?.ice_servers || [];
    expect(ice.length, 'Bağlantı için ağ sunucusu listesi boş').toBeGreaterThan(0);
  });
});
