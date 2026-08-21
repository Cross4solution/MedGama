const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Menüde görünen her ekran, o rolde GERÇEKTEN çalışmalı.
 *
 * Kırık olan ekran değil, eşleşmeydi: Raporlar ekranı klinik sahibinin
 * menüsünde duruyor ama ilk isteğini /doctor/billing/stats'a atıyordu — o uç
 * yalnızca doctor rolüne açık. Klinik 403 alıyor, hata bloğu ekranın tamamını
 * silip "veriler yüklenemedi" bırakıyordu.
 *
 * Geniş tarama bunu "tamam" saymıştı: sayfa açılıyor, içerik geliyor, hata
 * yalnızca konsolda. Ekranın AÇILMASI ile ÇALIŞMASI ayrı şeyler.
 *
 * VERİ ÜRETMEZ.
 */

// Ekrandaki hata metni bir dönem "Dokümanlar yüklenirken..." diyordu: genel
// bir anahtara (common.loadError) belgelere özgü cümle yazılmıştı ve Raporlar
// ekranında da o görünüyordu. İlk yazdığım kalıp yalnızca yeni cümleyi
// arıyordu, bu yüzden test hata varken bile YEŞİL geçti. İkisi de aranıyor.
const HATA_METNI = /(Veriler|Dokümanlar) yüklenirken bir hata oluştu|went wrong while loading|error occurred while loading/i;

test.describe('Rol ile uç uyumu — klinik', () => {
  test.use({ storageState: oturumDosyasi('demoKlinik') });

  test('Raporlar ekranı klinik rolünde çalışıyor', async ({ page }) => {
    await page.goto('/tr/crm/reports');
    await cerezBandiniKapat(page);

    // Ekranın kullanması gereken uç kliniğe açık olmalı.
    const kendi = await apiIstek(page, '/api/crm/billing/stats');
    expect(kendi.http, 'Klinik gelir özetini alamıyor').toBe(200);

    // Doktora özel uç kliniğe KAPALI olmalı — ekranın bunu çağırmaması gerek.
    const doktorUcu = await apiIstek(page, '/api/doctor/billing/stats');
    expect([401, 403], 'Doktor ucu kliniğe açık olmamalı').toContain(doktorUcu.http);

    await expect(page.getByText(HATA_METNI)).toHaveCount(0);
  });
});

test.describe('Rol ile uç uyumu — doktor', () => {
  test.use({ storageState: oturumDosyasi('demoDoktor') });

  test('Raporlar ekranı doktor rolünde çalışıyor', async ({ page }) => {
    await page.goto('/tr/crm/reports');
    await cerezBandiniKapat(page);

    const kendi = await apiIstek(page, '/api/doctor/billing/stats');
    expect(kendi.http, 'Doktor kendi gelir özetini alamıyor').toBe(200);

    await expect(page.getByText(HATA_METNI)).toHaveCount(0);
  });
});
