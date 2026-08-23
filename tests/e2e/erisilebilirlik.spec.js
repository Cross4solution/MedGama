const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat } = require('./yardimcilar');

/**
 * Erişilebilirlik — ekran okuyucuyla kullanılabilirlik.
 *
 * Bu alanın kapsamı sıfırdı. Sağlık platformunda ağırlığı ayrıca yüksek:
 * görme engelli bir hasta randevu alamıyorsa hizmete hiç erişemiyor demektir,
 * ve KVKK dışında AB erişilebilirlik mevzuatı da bunu gerektiriyor.
 *
 * Ölçütler OTOMATİK denetlenebilecek olanlarla sınırlı. Bunlar erişilebilirlik
 * denetiminin tamamı DEĞİL — renk karşıtlığı, odak sırası ve ekran okuyucu
 * akışı elle sınanmalı. Buradakiler "sessizce kırılan" türden:
 *
 *  • Adsız girdi/düğme ekran okuyucuda BOŞ okunur. Kullanıcı formu dolduramaz
 *    ama sayfa gözle bakınca kusursuz görünür.
 *  • `alt` özniteliği olmayan görsel, dosya adıyla okunur.
 *  • Yanlış `lang`, ekran okuyucunun metni yanlış aksanla okumasına yol açar —
 *    Türkçe metni İngilizce sesle dinlemek anlaşılmaz.
 *
 * NOT — ölçüm İNCE bir iş: ilk yazımda gizli dosya girdileri ve içindeki
 * görselden ad alan düğmeler "adsız" sayılmıştı. `display:none` öğeler
 * erişilebilirlik ağacında yok, düğmeler de alt metninden ad alıyor. Bu
 * yüzden hesap görünürlüğü ve alt metni de hesaba katıyor.
 */

/** Sayfadaki erişilebilirlik ölçümünü tarayıcıda yapar. */
const olc = (page) => page.evaluate(() => {
  // Görünürlük ÖLÇÜSÜ: gerçekten yer kaplıyor mu.
  //
  // İlk yazımda `offsetParent !== null` kullanılmıştı ve YANLIŞTI:
  // `position: fixed` bir atanın altındaki her öğede `offsetParent` null
  // döner. Giriş sayfası öyle bir düzen kullanıyor, dolayısıyla sayfadaki
  // TÜM öğeler "görünmez" sayılıyordu — denetimler de boşa geçiyordu.
  const gorunur = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // Erişilebilir ad hesabı — tarayıcının yaptığının pratik bir yaklaşımı.
  const ad = (el) => (
    el.getAttribute('aria-label')
    || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.innerText)
    || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.innerText)
    || el.closest('label')?.innerText
    || el.getAttribute('title')
    || el.getAttribute('placeholder')
    || el.innerText
    || [...el.querySelectorAll('img[alt]')].map((i) => i.alt).join(' ')
    || el.querySelector('svg title')?.textContent
    || ''
  ).trim();

  const tanim = (el) => `${el.tagName.toLowerCase()}${el.name ? `[name=${el.name}]` : ''}`
    + `${el.type ? `[type=${el.type}]` : ''} .${(el.className || '').toString().trim().split(/\s+/).slice(0, 3).join('.')}`;

  const girdiler = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(gorunur);
  const tiklanabilir = [...document.querySelectorAll('button, a[href]')].filter(gorunur);
  const gorseller = [...document.querySelectorAll('img')].filter(gorunur);

  return {
    // Kaç öğe ÖLÇÜLDÜĞÜ de dönüyor: sayfa yerleşmemişse hepsi sıfır çıkar ve
    // denetimler "hiç kusur yok" diye boşuna yeşil yanardı. Ölçümün kendisi
    // sınanmadan sonucuna güvenilmez.
    olculen: girdiler.length + tiklanabilir.length + gorseller.length,
    lang: document.documentElement.lang || '',
    // GÖRÜNÜR h1 sayısı: sekmeli giriş ekranı gizli panellerinde de
    // başlık taşıyor, onları saymak yanlış olur.
    h1: [...document.querySelectorAll('h1')].filter(gorunur).length,
    adsizGirdi: girdiler.filter((e) => !ad(e)).map(tanim),
    adsizTiklanabilir: tiklanabilir.filter((e) => !ad(e)).map(tanim),
    altsizGorsel: gorseller.filter((e) => !e.hasAttribute('alt')).map((e) => (e.currentSrc || e.src || '').slice(-60)),
  };
});

const denetle = async (page, yol, dil) => {
  await page.goto(yol);
  await cerezBandiniKapat(page);
  await page.waitForTimeout(1200);

  const s = await olc(page);

  expect(s.olculen, `${yol} — sayfa yerleşmemiş, ölçüm boşuna yeşil olurdu`).toBeGreaterThan(5);
  expect(s.adsizGirdi, `${yol} — ekran okuyucuda adsız girdi`).toEqual([]);
  expect(s.adsizTiklanabilir, `${yol} — ekran okuyucuda adsız düğme/bağlantı`).toEqual([]);
  expect(s.altsizGorsel, `${yol} — alt metni olmayan görsel`).toEqual([]);
  expect(s.lang, `${yol} — sayfa dili yanlış`).toBe(dil);

  return s;
};

test.describe('Erişilebilirlik — ziyaretçi sayfaları', () => {
  const sayfalar = ['/tr', '/tr/login', '/tr/register', '/tr/for-patients', '/tr/about', '/tr/medstream'];

  for (const yol of sayfalar) {
    test(`${yol} ekran okuyucuyla kullanılabilir`, async ({ page }) => {
      await denetle(page, yol, 'tr');
    });
  }

  test('sayfa dili seçilen dille birlikte değişiyor', async ({ page }) => {
    // Yanlış `lang`, ekran okuyucunun Türkçe metni İngilizce aksanla
    // okuması demek — dinleyen için anlaşılmaz olur.
    const s = await denetle(page, '/en/about', 'en');
    expect(s.lang).toBe('en');
  });

  test('her sayfada tam olarak bir ana başlık var', async ({ page }) => {
    // Ekran okuyucu kullanıcıları sayfayı başlıklardan geziyor; h1 yoksa
    // sayfanın ne olduğu anlaşılmıyor, birden fazlaysa yapı bozuluyor.
    //
    // Sayım GÖRÜNÜR başlıklar üzerinden: /tr/login kaynağında iki `h1` var
    // (giriş ve şifre-sıfırlama panelleri) ama aynı anda yalnız biri ekranda.
    for (const yol of ['/tr', '/tr/login', '/tr/about']) {
      await page.goto(yol);
      await cerezBandiniKapat(page);
      const s = await olc(page);
      expect(s.olculen, `${yol} — sayfa yerleşmemiş`).toBeGreaterThan(5);
      expect(s.h1, `${yol} — h1 sayısı`).toBe(1);
    }
  });
});

test.describe('Erişilebilirlik — oturumlu ekranlar', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  for (const yol of ['/tr/profile', '/tr/patient/appointments', '/tr/doctor-chat']) {
    test(`${yol} ekran okuyucuyla kullanılabilir`, async ({ page }) => {
      await denetle(page, yol, 'tr');
    });
  }
});
