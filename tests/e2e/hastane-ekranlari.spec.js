const { test, expect } = require('@playwright/test');
const { oturumDosyasi, apiIstek } = require('./yardimcilar');

/**
 * Hastane (L4) ekranları — ilk kez oturum açılmış hâlde.
 *
 * Bu rol bugüne dek hiç test edilmemişti: şifresiz demo girişi yalnızca hasta,
 * doktor ve klinik veriyordu, dolayısıyla hastaneye özel her şey — şube
 * yönetimi, her zaman açık CRM, ayrı kenar çubuğu — bir kez bile açılmamıştı.
 * Demo girişine `hastane` eklendikten sonra ilk gezinti iki hata buldu:
 *
 *   • Kenar çubuğundaki "Personel" bağlantısı ekranı açıyor, ekran "Klinik
 *     Bulunamadı — hesabınız bir klinikle ilişkili değil" diyordu. Hastane
 *     kullanıcısının `clinic_id`si yok, `hospital_id`si var; arka uçta hastane
 *     personeli diye bir uç da yok. Yani bağlantı hiçbir koşulda çalışamazdı.
 *
 *   • CRM panosu "Good Evening" diyordu — dokuz dilin hepsinde, sabit
 *     İngilizce.
 *
 * Ölçüt menüyü ekrandan okuyor: elle yazılmış bir liste, menü değişince
 * sessizce eskir.
 */

test.use({ storageState: oturumDosyasi('hastane') });

/** Kenar çubuğundaki CRM bağlantıları (adres → etiket). */
async function menuBaglantilari(page) {
  return page.evaluate(() => {
    const bulunan = new Map();

    for (const a of document.querySelectorAll('a[href*="/crm"]')) {
      const yol = new URL(a.href).pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

      if (!/^\/crm(\/|$|\?)/.test(yol)) continue;
      if (!bulunan.has(yol)) bulunan.set(yol, (a.textContent || '').trim());
    }

    return [...bulunan.entries()];
  });
}

test.describe('Hastane paneli', () => {
  test('menüdeki her bağlantı o rolde çalışan bir ekran açıyor', async ({ page }) => {
    await page.goto('/tr/crm');
    await page.waitForLoadState('domcontentloaded');
    // Kenar çubuğu istemci tarafında çiziliyor; beklemeden okumak boş liste
    // veriyor ve ölçüt kendi kurulumuna kırmızı yanıyordu.
    await page.locator('a[href*="/crm/"]').first().waitFor({ timeout: 20_000 });

    const baglantilar = await menuBaglantilari(page);

    expect(baglantilar.length, 'hastane kenar çubuğu okunamadı').toBeGreaterThan(5);

    const bozuk = [];

    for (const [yol] of baglantilar) {
      await page.goto(`/tr${yol}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2200);

      const metin = await page.evaluate(() => {
        const k = (document.querySelector('main#icerik') || document.body).cloneNode(true);
        k.querySelectorAll('nav, aside, header, script, footer').forEach((e) => e.remove());

        return (k.innerText || '').replace(/\s+/g, ' ').trim();
      });

      // "Bu ekran senin hesabına ait değil" diyen bir sayfa, menüde olmamalı.
      if (/Klinik Bulunamadı|No Clinic Found|ilişkili değil|not associated/i.test(metin)) {
        bozuk.push(`${yol} → rolüne ait olmayan ekran`);
      }
      if (/^404|Sayfa Bulunamadı|Page Not Found/i.test(metin)) {
        bozuk.push(`${yol} → 404`);
      }
    }

    expect(bozuk, 'hastane menüsünde çalışmayan bağlantı var').toEqual([]);
  });

  test('panodaki selamlama sayfanın dilinde', async ({ page }) => {
    await page.goto('/tr/crm');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);

    const baslik = await page.locator('h1').first().innerText();

    // Metnin kendisi değil, İNGİLİZCE OLMAMASI ölçülüyor: sabit dizge geri
    // gelirse hangi saat diliminde koşulduğundan bağımsız yakalanır.
    expect(baslik, 'CRM panosu Türkçe sayfada İngilizce selamlıyor')
      .not.toMatch(/Good (Morning|Afternoon|Evening)/i);
    expect(baslik, 'selamlama yer tutucusu ham çıkıyor').not.toContain('{{');
  });

  test('şube yönetimi hastane rolünde açılıyor', async ({ page }) => {
    // Şube ucu `role:hospital,superAdmin,saasAdmin` ile sınırlı; klinik sahibi
    // 403 alıyor. Hastanenin ALDIĞINI doğrulamak, kısıtın doğru tarafta
    // olduğunu gösteriyor.
    // `page.request` ön yüz kökenine gider; şube ucu arka uçta. Yardımcı,
    // oturum jetonunu da taşıyor.
    await page.goto('/tr/crm');
    await page.waitForLoadState('domcontentloaded');

    const yanit = await apiIstek(page, '/api/branches');

    expect(yanit.http, 'hastane şube ucundan reddediliyor').not.toBe(403);
  });
});
