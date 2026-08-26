/**
 * GÖRÜNMEYEN AMA ODAKLANABİLİR ÖĞE — klavye kullanıcısı için tuzak.
 *
 * "Başa dön" düğmesi sayfa kaydırılana kadar `opacity-0` ve
 * `pointer-events-none` ile gizleniyordu. İkisi de odaklanabilirliği
 * kaldırmaz: `opacity` yalnız çizimi, `pointer-events` yalnız fareyi etkiler.
 *
 * Sonuç, klavyeyle gezen kullanıcı için şuydu: odak halkası sayfanın hiçbir
 * yerinde görünmeyen bir noktaya gidiyor, Enter'a basınca ne olacağı belirsiz.
 * Ekran okuyucu da olmayan bir denetimi duyuruyordu.
 *
 * Fareyle kullananın hiç göremeyeceği bir kusur — o yüzden gözle bakarak
 * bulunamaz, ölçmek gerekir.
 *
 * Ölçüt genel: görünür alanı olmayan hiçbir öğe klavye sırasında durmamalı.
 *
 * VERİ ÜRETMEZ.
 */
const { test, expect } = require('@playwright/test');
const { cerezBandiniKapat } = require('./yardimcilar');

const SAYFALAR = ['/tr', '/tr/medstream', '/tr/browse/clinics', '/tr/contact'];

for (const yol of SAYFALAR) {
  test(`${yol} — görünmeyen öğe klavye sırasında durmuyor`, async ({ page }) => {
    await page.goto(yol, { waitUntil: 'domcontentloaded' });
    await cerezBandiniKapat(page);
    await page.waitForTimeout(1500);

    const tuzaklar = await page.evaluate(() => {
      const odaklanabilir = [...document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]',
      )].filter((e) => {
        const ti = e.getAttribute('tabindex');
        return ti === null || Number(ti) >= 0;
      });

      // `display:none` ve `visibility:hidden` odaklanabilirliği zaten kaldırıyor
      // ve bu ATALAR ÜZERİNDEN de geçerli: duyarlı yerleşimde `md:hidden` bir
      // kapsayıcının içindeki düğme masaüstünde sırada değildir. Öğenin kendi
      // biçimine bakmak yetmiyor — ilk denemede beş yanlış alarm verdi.
      const sirada = (e) => {
        for (let d = e; d && d !== document.documentElement; d = d.parentElement) {
          const s = getComputedStyle(d);
          if (s.display === 'none' || s.visibility === 'hidden') return false;
        }
        return true;
      };

      return odaklanabilir
        .filter((e) => {
          if (e.hasAttribute('disabled')) return false;
          if (!sirada(e)) return false;

          // Tuzak: sırada DURUYOR ama gözle görünmüyor.
          const r = e.getBoundingClientRect();

          return Number(getComputedStyle(e).opacity) === 0
            || r.width === 0
            || r.height === 0;
        })
        .map((e) => `${e.tagName}[${e.getAttribute('aria-label') || e.getAttribute('href') || (e.textContent || '').trim().slice(0, 24)}]`);
    });

    expect(
      tuzaklar,
      'görünmeyen öğe klavye sırasında: odak halkası boşluğa gidiyor',
    ).toEqual([]);
  });
}
