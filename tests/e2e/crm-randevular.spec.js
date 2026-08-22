const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * CRM aboneliği olmayan hesapta ekran kilitli açılıyor ve randevu listesi hiç
 * gelmiyor. Test o durumda başarısız olmamalı — sınayacak bir şey yok.
 */
async function crmAcikMi(page) {
  return page.evaluate(() => {
    const u = JSON.parse(localStorage.getItem('auth_state') || '{}')?.user || {};
    return !!u.has_crm_subscription && !!u.is_verified;
  });
}

/**
 * CRM randevu ekranının ana siteyle aynı kuralları uygulaması.
 *
 * CRM geride kalmıştı: saati duvar saati olarak yazıyordu (yurt dışındaki
 * doktora yanlış saat) ve hâlâ "Onayla" düğmesi gösteriyordu — oysa randevu
 * hastanın aldığı anda onaylanıyor. İki ekran aynı randevu için farklı şey
 * söylüyordu.
 *
 * Hiçbir randevu OLUŞTURULMUYOR — canlı veri kirlenmesin.
 */

test.describe('CRM randevuları', () => {
  test.use({ storageState: oturumDosyasi('doktor') });

  test('onay düğmesi yok, ret hakkı sunucu kuralıyla aynı', async ({ page }) => {
    await page.goto('/tr/crm/appointments');
    await cerezBandiniKapat(page);
    test.skip(!(await crmAcikMi(page)), 'Hesapta CRM aboneliği yok — ekran kilitli');

    // Şerit "onay bekleyenler" değil, "hâlâ reddedilebilenler".
    const serit = page.getByText(/Randevular otomatik onaylı/i);
    const { govde } = await apiIstek(page, '/api/appointments?per_page=50');
    const hepsi = govde?.data || [];
    const reddedilebilir = hepsi.filter((a) => a.doctor_can_reject);

    if (reddedilebilir.length > 0) {
      await expect(serit).toBeVisible();
      await expect(page.getByRole('button', { name: /^Reddet$/i }).first()).toBeVisible();
    }

    // Onay düğmesi hiçbir koşulda çıkmamalı: onay diye bir adım kalmadı.
    await expect(page.getByRole('button', { name: /^Onayla$/ })).toHaveCount(0);
  });
});

/**
 * Yurt dışından çalışan doktor. Tarayıcı New York'ta, klinik İstanbul'da:
 * CRM kendi saatini göstermeli ve yanına kliniğin saatini yazmalı.
 */
test.describe('CRM randevuları — başka saat diliminden', () => {
  test.use({
    storageState: oturumDosyasi('doktor'),
    timezoneId: 'America/New_York',
  });

  test('saat izleyenin diliminde, klinik saati de yazılı', async ({ page }) => {
    await page.goto('/tr/crm/appointments');
    await cerezBandiniKapat(page);
    test.skip(!(await crmAcikMi(page)), 'Hesapta CRM aboneliği yok — ekran kilitli');

    const { govde } = await apiIstek(page, '/api/appointments?per_page=50');
    const govdeMetniOn = await page.locator('body').innerText();

    // Randevu EKRANDA GÖRÜNENLER arasından seçiliyor. Önceki hâli API
    // listesinden herhangi birini alıyordu; CRM ekranı farklı bir alt küme
    // (yaklaşanlar) gösterdiği için seçilen kayıt çoğu zaman sayfada
    // olmuyordu ve test, çalışan bir özelliği kırık gösteriyordu.
    const uygun = (govde?.data || []).find(
      (a) => a.doctor_can_reject && a.starts_at && a.timezone
        && govdeMetniOn.includes(String(a.id).slice(0, 8)),
    );
    test.skip(!uygun, 'Ekranda görünen reddedilebilir randevu yok — kural sınanamıyor');

    const saat = (tz) => new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
    }).format(new Date(uygun.starts_at));

    const izleyenSaati = saat('America/New_York');
    const klinikSaati = saat(uygun.timezone);

    const govdeMetni = await page.locator('body').innerText();

    expect(govdeMetni, 'İzleyenin kendi saati görünmüyor').toContain(izleyenSaati);
    // İki dilim farklıysa kliniğin saati de yazılmalı, yoksa "hangi 14:00?"
    // sorusu cevapsız kalıyor.
    if (klinikSaati !== izleyenSaati) {
      expect(govdeMetni, 'Klinik saati yazılmamış').toContain(klinikSaati);
    }
  });
});
