/**
 * DOĞRULAMA BELGESİ — yönetici onaylayacağı diplomayı görebiliyor mu?
 *
 * `/admin/verification/review`, uygulamadaki 93 sayfa içinde hiçbir testin
 * uğramadığı TEK sayfaydı. Orada bulunan kusur da tam olarak sayfanın varlık
 * sebebini bozuyordu: belge hiç görüntülenemiyordu.
 *
 * Ekran belgeyi `<img src>` ile gösteriyor ve adrese `?token=...` ekliyordu.
 * İki şey birden yanlıştı: jeton uygulamanın hiç yazmadığı bir anahtardan
 * (`auth_token`) okunuyordu, ve dolu olsa bile uç jetonu `Authorization`
 * başlığından okuyor — `<img>` o başlığı göndermez. Ölçüldü: 401.
 *
 * Belge artık kimlikli istekle çekilip blob adresine çevriliyor. Bu, sunucudaki
 * "kim baktı" denetim kaydını da koruyor; imzalı bağlantı olsaydı istek
 * sahipsiz gelirdi.
 *
 * Mekanizmanın kesin kanıtı `DogrulamaBelgesiGoruntulemeTest`. Buradaki ölçüt
 * canlı ekranı deniyor: bekleyen belge yoksa atlanıyor.
 *
 * VERİ ÜRETMEZ.
 */
const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

test.describe('Doğrulama belgesi', () => {
  test.use({ storageState: oturumDosyasi('yonetici') });

  test('belge kimlikli istekle geliyor ve gerçekten çiziliyor', async ({ page }) => {
    await page.goto('/tr/admin/verification');
    await cerezBandiniKapat(page);

    const { http, govde } = await apiIstek(page, '/api/admin/verification-requests?status=pending');
    test.skip(http !== 200, `doğrulama listesi alınamadı (HTTP ${http})`);

    const bekleyen = (govde?.data?.data || govde?.data || [])[0];
    test.skip(!bekleyen, 'bekleyen doğrulama belgesi yok');

    const istekler = [];
    page.on('response', (yanit) => {
      const adres = new URL(yanit.url());
      if (adres.pathname.endsWith('/document')) {
        istekler.push({ sorgu: adres.search, durum: yanit.status() });
      }
    });

    const hekimId = bekleyen.doctor_id || bekleyen.doctor?.id;
    await page.goto(`/tr/admin/verification/review?id=${hekimId}`);
    await page.waitForTimeout(3000);

    expect(istekler.length, 'belge hiç istenmedi').toBeGreaterThan(0);

    for (const istek of istekler) {
      expect(istek.durum, 'belge isteği reddedildi — yönetici belgeyi göremiyor').toBe(200);

      // Jeton adres olarak taşınmamalı: adres tarayıcı geçmişine ve sunucu
      // günlüklerine düşer, jeton da onunla birlikte.
      expect(istek.sorgu, 'jeton adres üzerinde taşınıyor').not.toContain('token=');
    }

    // İstek 200 dönse bile görsel çizilmemiş olabilir (bozuk ikili, yanlış
    // tür). Ölçüt çizilmiş olmasını istiyor.
    const gorseller = await page.evaluate(() => [...document.querySelectorAll('img')]
      .filter((e) => (e.src || '').startsWith('blob:'))
      .map((e) => e.naturalWidth > 0));

    expect(gorseller.length, 'belge blob adresinden gösterilmiyor').toBeGreaterThan(0);
    expect(gorseller.every(Boolean), 'belge yüklenmedi — ekranda boş kare var').toBe(true);
  });
});
