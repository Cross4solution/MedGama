/**
 * İLK YÜKLEME DÜŞTÜĞÜNDE — ekran yokluk mu iddia ediyor, hata mı söylüyor?
 *
 * Paketteki `hata-yolu-uyarilari` YAZMA isteklerinin düşmesini deniyor. Bu
 * dosya OKUMA tarafını deniyor: sayfa açılıyor, listeyi çeken istek düşüyor,
 * ekranda ne yazıyor?
 *
 * Ölçüldüğünde otuz dokuz ekranın hiçbiri çökmüyordu ve hiçbiri sonsuza dek
 * dönen çarkta kalmıyordu. Ama altısı boş sonucu GERÇEK gibi sunuyordu:
 *
 *   /crm/appointments   → "0 Toplam  0 Bekliyor  0 Onaylandı"
 *   /crm/calendar       → "0 Bugünkü Randevular"
 *   /crm/faq            → "Henüz SSS yok"
 *   /saved              → "Henüz kaydedilmiş gönderi yok"
 *   /saved-clinics      → "Henüz favori klinik yok"
 *   /admin/moderation   → "Her Şey Yolunda"
 *
 * Hiçbirinde hata yoktu; hepsinde veri yerinde duruyordu, yalnız okunamıyordu.
 * En ağırı klinik tarafı: bir kesinti sırasında ekran o günü boş gösteriyor.
 * Yöneticiye "Her Şey Yolunda" demek de aynı şey — bekleyen şikayet duruyor,
 * ekran yapacak iş olmadığını söylüyor.
 *
 * Ölçüt iki şeyi birden tutuyor: hata bildirimi ÇIKMALI, ve yokluk iddiası
 * ÇIKMAMALI. İkincisi olmadan ekran hem hatayı hem "kayıt yok"u yan yana
 * gösterip yine yanıltabilir.
 *
 * VERİ ÜRETMEZ: istekler tarayıcıda kesiliyor, sunucuya hiç ulaşmıyor.
 */
const { test, expect } = require('@playwright/test');
const { oturumDosyasi } = require('./kurulum');

const YUKLENEMEDI = /İçerik yüklenemedi|Could not load data/i;

/** Sayfadaki bütün API okumalarını düşürür. Yazmalara dokunmaz. */
async function okumalariDusur(page) {
  await page.route('**/api/**', (rota) => {
    if (rota.request().method() !== 'GET') return rota.fallback();
    return rota.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Test amaçlı düşürüldü' }),
    });
  });
}

const DURUMLAR = [
  { rol: 'hasta', rota: '/saved', yanlisIddia: /Henüz kaydedilmiş gönderi yok/i },
  { rol: 'hasta', rota: '/saved-clinics', yanlisIddia: /Henüz favori klinik yok/i },
  { rol: 'klinik', rota: '/crm/faq', yanlisIddia: /Henüz SSS yok/i },
  { rol: 'yonetici', rota: '/admin/moderation', yanlisIddia: /Her Şey Yolunda/i },
  // Sayaç ekranlarında sıfırlar duruyor ama üstlerinde gerçek olmadıklarını
  // söyleyen bir uyarı var; yanlış iddia edilecek ayrı bir metin yok.
  { rol: 'klinik', rota: '/crm/appointments', yanlisIddia: null },
  { rol: 'klinik', rota: '/crm/calendar', yanlisIddia: null },
];

for (const { rol, rota, yanlisIddia } of DURUMLAR) {
  test.describe(`${rota} (${rol})`, () => {
    test.use({ storageState: oturumDosyasi(rol) });

    test('yükleme düşünce hata söylüyor, yokluk iddia etmiyor', async ({ page }) => {
      const cokmeler = [];
      page.on('pageerror', (e) => cokmeler.push(String((e && e.message) || e)));

      await okumalariDusur(page);
      await page.goto('/tr' + rota, { waitUntil: 'domcontentloaded' });

      await expect(page.getByText(YUKLENEMEDI).first()).toBeVisible({ timeout: 15000 });

      if (yanlisIddia) {
        await expect(page.getByText(yanlisIddia)).toHaveCount(0);
      }

      expect(cokmeler, 'ekran hata anında çöküyor').toEqual([]);
    });
  });
}
