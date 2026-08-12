const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Randevu listesi kuralları.
 *
 * Bu ekranda iki hata vardı: saati geçmiş randevular "Yaklaşan" listesinde
 * kalıyordu ve hepsinde "Katıl" düğmesi açıktı. Testler o kuralları kilitliyor.
 * Hiçbir randevu OLUŞTURULMUYOR — canlı veri kirlenmesin.
 */

test.describe('Doktor randevuları', () => {
  test.use({ storageState: oturumDosyasi('doktor') });

  test('yaklaşan listesinde saati geçmiş randevu görünmüyor', async ({ page }) => {
    await page.goto('/tr/doctor/appointments');
    await cerezBandiniKapat(page);

    await expect(page.getByRole('button', { name: /Yaklaşan|Upcoming/i }).first()).toBeVisible();

    // Sunucudaki randevularla ekrandakini karşılaştır.
    const { govde } = await apiIstek(page, '/api/appointments?per_page=50');
    const hepsi = govde?.data || [];

    const GECMIS_PAYI_MS = 2 * 60 * 60 * 1000;
    const gecmisOlanlar = hepsi.filter((a) => {
      if (!['pending', 'confirmed'].includes(a.status) || !a.starts_at) return false;
      return new Date(a.starts_at).getTime() < Date.now() - GECMIS_PAYI_MS;
    });

    test.skip(gecmisOlanlar.length === 0, 'Geçmiş randevu yok — kural sınanamıyor');

    // Sayfa gövdesinde bu randevuların saati görünmemeli.
    const govdeMetni = await page.locator('body').innerText();
    for (const a of gecmisOlanlar.slice(0, 5)) {
      const saat = new Intl.DateTimeFormat('tr-TR', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul',
      }).format(new Date(a.starts_at));
      const tarih = a.appointment_date;
      expect(
        govdeMetni.includes(`${tarih}`) && govdeMetni.includes(saat),
        `Geçmiş randevu yaklaşanlarda görünüyor: ${tarih} ${saat}`
      ).toBe(false);
    }
  });

  test('reddetme hakkı sunucu kuralıyla aynı (2 saat)', async ({ page }) => {
    await page.goto('/tr/doctor/appointments');

    const { govde } = await apiIstek(page, '/api/appointments?per_page=50');
    const hepsi = (govde?.data || []).filter((a) => a.status === 'confirmed' && a.starts_at);
    test.skip(hepsi.length === 0, 'Onaylı randevu yok');

    for (const a of hepsi) {
      const kalanDk = (new Date(a.starts_at).getTime() - Date.now()) / 60000;
      const beklenen = kalanDk > 120;
      expect(
        a.doctor_can_reject,
        `${a.appointment_date} ${a.appointment_time}: kalan ${Math.round(kalanDk)} dk`
      ).toBe(beklenen);
    }
  });
});

test.describe('Hasta randevuları', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  test('randevu saati mutlak an olarak saklanıyor ve doğru gösteriliyor', async ({ page }) => {
    await page.goto('/tr/patient/appointments');
    await cerezBandiniKapat(page);

    const { govde } = await apiIstek(page, '/api/appointments?per_page=10');
    const hepsi = govde?.data || [];
    test.skip(hepsi.length === 0, 'Randevu yok');

    // Saat dilimi düzeltmesinin kanıtı: mutlak an + saat dilimi adı kayıtlı.
    const mutlakAnli = hepsi.filter((a) => a.starts_at && a.timezone);
    expect(mutlakAnli.length, 'Hiçbir randevuda mutlak an/saat dilimi yok').toBeGreaterThan(0);

    // Ekranda yazan saat, tarayıcının saat dilimindeki karşılığı olmalı.
    const ornek = mutlakAnli[0];
    const beklenenSaat = new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul',
    }).format(new Date(ornek.starts_at));

    await expect(page.getByText(beklenenSaat, { exact: false }).first()).toBeVisible();
  });
});
