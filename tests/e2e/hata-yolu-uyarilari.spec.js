const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat } = require('./yardimcilar');

/**
 * HATA YOLU — kayıt başarısız olduğunda ne oluyor?
 *
 * Paketteki diğer testlerin hepsi başarılı akışı deniyor: fatura kesiliyor,
 * randevu açılıyor, mesaj gidiyor. Ama üç kutucukta (etiket ekle, aşama
 * belirle, fatura oluştur) `notify` yalnızca ÜST bileşende tanımlıydı ve
 * yalnızca `catch` bloğunda çağrılıyordu. Yani:
 *
 *   - istek başarılı olduğu sürece hiçbir şey olmuyordu,
 *   - istek başarısız olduğu anda hata yakalayıcının KENDİSİ
 *     "notify is not defined" ile çöküyor, kullanıcı uyarı yerine
 *     beyaz ekran görüyordu.
 *
 * Yalnızca hata anında ortaya çıkan bir çökme. Mevcut testlerin hiçbiri
 * yakalayamazdı çünkü hiçbiri bir isteği bilerek düşürmüyor. Buradaki
 * testler tam olarak bunu yapıyor: yanıt 500'e çevriliyor ve ekranın
 * (a) çökmediği, (b) kullanıcıya uyarı gösterdiği doğrulanıyor.
 *
 * Fatura testi ayrıca bir gerilemeyi de tutuyor: hasta seçici sayfalı yanıtı
 * bir kat fazla açtığı için HEP BOŞ geliyordu, yani bu ekrandan fatura
 * kesmek mümkün değildi. Seçenek gelmezse test burada düşer.
 *
 * VERİ ÜRETMEZ: istekler tarayıcıda kesiliyor, sunucuya hiç ulaşmıyor.
 */

const KLINIK = oturumDosyasi('demoKlinik');

/** Yakalanmamış çalışma-anı hatalarını toplar. Asıl ölçüt bu. */
function cokmeIzleyici(page) {
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(String((e && e.message) || e)));
  return hatalar;
}

/** İlgili ucu 500'e çevirir; istek sunucuya gitmez. */
async function ucuDusur(page, desen, yontem = null) {
  await page.route(desen, (rota) => {
    if (yontem && rota.request().method() !== yontem) return rota.fallback();
    return rota.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Test amaçlı düşürüldü' }),
    });
  });
}

const uyari = (page, metin) =>
  page.getByRole('alert').filter({ hasText: metin }).first();

test.describe('Hata yolu uyarıları', () => {
  test.use({ storageState: KLINIK });

  test('etiket eklenemezse uyarı çıkıyor, ekran çökmüyor', async ({ page }) => {
    const cokmeler = cokmeIzleyici(page);
    await ucuDusur(page, '**/api/crm/patients/*/tags', 'POST');

    await page.goto('/tr/crm/patients');
    await cerezBandiniKapat(page);

    const baslik = page.getByRole('heading', { name: /^Hastalar$|^Patients$/i }).first();
    await expect(baslik).toBeVisible();

    // Liste sunucudan gelene kadar beklenir; hemen sorulursa düğme henüz yok.
    const tetik = page.getByRole('button', { name: /^etiket$/i }).first();
    await expect(tetik).toBeVisible();
    await tetik.click();

    await expect(page.getByRole('heading', { name: /Etiket ekle/i }).first()).toBeVisible();
    await page.getByPlaceholder(/VIP/i).fill('otomatik-test');
    await page.getByRole('button', { name: /^Kaydet$/i }).click();

    // Düzeltmeden önce burada beyaz ekran vardı: catch bloğu kendi çöküyordu.
    await expect(uyari(page, /Etiket eklenemedi/i)).toBeVisible();

    await expect(baslik).toBeVisible();
    expect(cokmeler, `Yakalanmamış hata: ${cokmeler.join(' | ')}`).toEqual([]);
  });

  test('aşama güncellenemezse uyarı çıkıyor, ekran çökmüyor', async ({ page }) => {
    const cokmeler = cokmeIzleyici(page);
    await ucuDusur(page, '**/api/crm/patients/*/stage', 'POST');

    await page.goto('/tr/crm/patients');
    await cerezBandiniKapat(page);

    const baslik = page.getByRole('heading', { name: /^Hastalar$|^Patients$/i }).first();
    await expect(baslik).toBeVisible();

    const tetik = page.getByRole('button', { name: /^aşama$/i }).first();
    await expect(tetik).toBeVisible();
    await tetik.click();

    await expect(page.getByRole('heading', { name: /Aşama Belirle/i }).first()).toBeVisible();
    // Hazır seçenek serbest metin alanını da dolduruyor.
    await page.getByRole('button', { name: /^Tanı$|^Diagnostic$/i }).first().click();
    await page.getByRole('button', { name: /^Kaydet$/i }).click();

    await expect(uyari(page, /Aşama güncellenemedi/i)).toBeVisible();

    await expect(baslik).toBeVisible();
    expect(cokmeler, `Yakalanmamış hata: ${cokmeler.join(' | ')}`).toEqual([]);
  });

  test('fatura oluşturulamazsa uyarı çıkıyor, ekran çökmüyor', async ({ page }) => {
    const cokmeler = cokmeIzleyici(page);
    // Yalnızca oluşturma düşürülüyor; listeleme ve hasta çekme çalışsın.
    await ucuDusur(page, '**/api/crm/billing/invoices', 'POST');

    await page.goto('/tr/crm/billing');
    await cerezBandiniKapat(page);

    const baslik = page.getByRole('heading', { name: /Tahsilat|Billing/i }).first();
    await expect(baslik).toBeVisible();

    // Sayfa başlığındaki düğme kutucuğu açar; alttaki aynı adlı düğme gönderir.
    await page.getByRole('button', { name: /^Fatura$|^Create Invoice$/ }).first().click();

    const hastaSecici = page.locator('select').first();
    await expect(hastaSecici).toBeVisible();

    // Seçici bir dönem hep boştu (sayfalı yanıt bir kat fazla açılıyordu).
    // Seçenek gelmezse bu satır düşer — gerileme buradan yakalanır.
    await expect
      .poll(() => hastaSecici.locator('option').count(), {
        message: 'Hasta seçicide seçenek yok — sayfalı yanıt yine yanlış açılıyor olabilir',
        timeout: 20_000,
      })
      .toBeGreaterThan(1);

    await hastaSecici.selectOption({ index: 1 });
    await page.getByPlaceholder('Açıklama *').first().fill('Otomatik test kalemi');
    await page.locator('input[placeholder="0.00"]').first().fill('100');

    const gonder = page.getByRole('button', { name: /^Fatura$|^Create Invoice$/ }).last();
    await expect(gonder).toBeEnabled();
    await gonder.click();

    await expect(uyari(page, /Fatura oluşturulamadı/i)).toBeVisible();

    await expect(baslik).toBeVisible();
    expect(cokmeler, `Yakalanmamış hata: ${cokmeler.join(' | ')}`).toEqual([]);
  });
});
