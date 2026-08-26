/**
 * ARAPÇA METİN GERÇEKTEN SAĞA YASLANIYOR MU?
 *
 * `<html dir="rtl">` konuyor ve tarayıcı akışın çoğunu kendisi çeviriyor:
 * esnek kutu sırası, kaydırma yönü, satır içi metin. `dilYonu` ölçütü bunu
 * zaten tutuyor ve doğru not ediyor — kaynakta yön duyarlı sınıf SAYMAK kötü
 * bir kestirim, çünkü yerleşimin çoğu `gap` ve sıra ile kuruluyor.
 *
 * Sayım kötü bir kestirimdi; çizilen sonuca bakmak değil. Ölçüldüğünde on
 * dört Arapça sayfanın SEKİZİNDE Arapça metin sola yaslıydı:
 *
 *   /crm/patients   tablo başlıkları solda, sütun içeriği sağda
 *   /crm/billing    aynısı
 *   /profile        gezinme düğmeleri
 *   /settings       sekme listesi
 *   /medstream      açılır kutu yer tutucuları
 *
 * Sebep `text-left` ve `text-right`: bunlar FİZİKSEL, yani `dir` ne olursa
 * olsun dönmezler. Karşılıkları `text-start` / `text-end` mantıksal ve yönü
 * izliyor — soldan sağa dillerde ikisi aynı şeyi çiziyor, sağdan sola dilde
 * doğru tarafa geçiyor. Depodaki 263 kullanımın hepsi çevrildi.
 *
 * Ölçüt iki yönü birden tutuyor: Arapçada sola yaslı metin OLMAMALI, Türkçede
 * sağa yaslı metin olmamalı. İkincisi olmadan "hepsini sağa yasla" gibi bir
 * düzeltme de yeşil yanardı.
 *
 * VERİ ÜRETMEZ.
 */
const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat } = require('./yardimcilar');

const ACIK = ['/', '/browse/clinics', '/medstream'];
const OZEL = {
  hasta: ['/profile', '/settings'],
  klinik: ['/crm/patients', '/crm/billing'],
};

/** O dilde YANLIŞ tarafa yaslanmış metinleri döndürür. */
async function tersHizalar(page, dil, rota) {
  const yanlisTaraf = dil === 'ar' ? 'left' : 'right';

  await page.goto(`/${dil}${rota}`, { waitUntil: 'domcontentloaded' });
  await cerezBandiniKapat(page);
  await page.waitForTimeout(2000);

  return page.evaluate((taraf) => {
    const bulunan = [];

    for (const e of document.querySelectorAll('body *')) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      const metin = (e.textContent || '').trim();
      if (metin.length < 4) continue;

      if (getComputedStyle(e).textAlign === taraf) {
        bulunan.push(metin.slice(0, 30));
      }
    }

    return bulunan.slice(0, 6);
  }, yanlisTaraf);
}

for (const rota of ACIK) {
  test(`${rota} — Arapça metin sola yaslanmıyor`, async ({ page }) => {
    expect(await tersHizalar(page, 'ar', rota)).toEqual([]);
  });

  test(`${rota} — Türkçe metin sağa yaslanmıyor`, async ({ page }) => {
    expect(await tersHizalar(page, 'tr', rota)).toEqual([]);
  });
}

for (const [rol, rotalar] of Object.entries(OZEL)) {
  test.describe(rol, () => {
    test.use({ storageState: oturumDosyasi(rol) });

    for (const rota of rotalar) {
      test(`${rota} — Arapça metin sola yaslanmıyor`, async ({ page }) => {
        expect(await tersHizalar(page, 'ar', rota)).toEqual([]);
      });
    }
  });
}
