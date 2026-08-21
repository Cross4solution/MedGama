const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat } = require('./yardimcilar');

/**
 * Bir ekran açılışta kaç API isteği atıyor?
 *
 * Genel hız sınırı kullanıcı başına dakikada 120 istek. Sınırın kendisi
 * makul; asıl soru tek bir ekranın ne kadarını tükettiği. Ekran başına 20
 * istek, kullanıcının dakikada altı ekran gezmesini 429'a çeviriyor —
 * CRM'de sekmeler arasında gezinmek son derece olağan.
 *
 * Geniş tarama beş ekranda 429 gördü. O taramanın kendisi hızlıydı, yani
 * bulgu doğrudan kullanıcı deneyimine dair değil; ama "ekran başına kaç
 * istek" sorusunu ölçmeden sınırın yeterli olduğunu söylemek tahmin olur.
 *
 * Bu test bir eşik dayatmıyor — sayıyı ölçüp raporluyor ve yalnızca tek bir
 * ekran sınırın yarısını tüketiyorsa düşüyor.
 *
 * VERİ ÜRETMEZ.
 */

const DAKIKA_SINIRI = 120;
const EKRANLAR = [
  '/tr/crm',
  '/tr/crm/patients',
  '/tr/crm/appointments',
  '/tr/crm/billing',
  '/tr/crm/calendar',
  '/tr/crm/revenue',
];

test.describe('İstek yoğunluğu', () => {
  test.use({ storageState: oturumDosyasi('demoKlinik') });

  test('tek ekran hız sınırının yarısını tüketmiyor', async ({ page }) => {
    test.setTimeout(EKRANLAR.length * 45_000 + 60_000);

    const olcumler = [];

    for (const yol of EKRANLAR) {
      let sayac = 0;
      const dinle = (istek) => {
        if (new URL(istek.url()).pathname.startsWith('/api/')) sayac += 1;
      };
      page.on('request', dinle);

      await page.goto(yol, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await cerezBandiniKapat(page);
      // Açılıştaki isteklerin tamamı için bekle; ölçüm erken kesilirse
      // gerçekte olduğundan hafif görünür.
      await page.waitForTimeout(6000);

      page.off('request', dinle);
      olcumler.push({ yol, sayac });
      console.log(`  ${String(sayac).padStart(3)} istek  ${yol}`);
    }

    const enAgir = olcumler.reduce((a, b) => (b.sayac > a.sayac ? b : a));
    const toplam = olcumler.reduce((t, o) => t + o.sayac, 0);
    console.log(`\n  en ağır ekran: ${enAgir.yol} (${enAgir.sayac} istek)`);
    console.log(`  ${olcumler.length} ekran toplamı: ${toplam} istek — sınır dakikada ${DAKIKA_SINIRI}`);
    console.log(`  bu hızda sınıra takılmadan gezilebilecek ekran: ~${Math.floor(DAKIKA_SINIRI / Math.max(1, Math.round(toplam / olcumler.length)))}/dakika`);

    expect(
      enAgir.sayac,
      `Tek ekran (${enAgir.yol}) dakikalık sınırın yarısından fazlasını tüketiyor`,
    ).toBeLessThan(DAKIKA_SINIRI / 2);
  });
});
