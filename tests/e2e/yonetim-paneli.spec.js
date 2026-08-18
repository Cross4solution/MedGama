const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Yönetim paneli.
 *
 * Panelin tamamı platformun her hastasına, doktoruna ve faturasına açılan bir
 * kapı. Elimizde yönetici oturumu YOK ve test için bir tane açmıyoruz: en
 * yetkili hesabı otomatik teste bağlamak, kazanacağımız kapsamdan daha büyük
 * bir risk.
 *
 * Bu yüzden burada ölçülen tek şey KAPININ KAPALI olması — hasta, doktor,
 * klinik ve oturumsuz istek panele giremiyor. Panelin kendi işleyişi
 * (doğrulama onayı, kullanıcı yönetimi) backend testlerinin alanı.
 */

/** Kabul edilen tek şey isteğin başarısız olması; 2xx sızıntı demektir. */
const reddedildiMi = (http) => http >= 400;

const YONETIM_UCLARI = [
  '/api/admin/dashboard',
  '/api/admin/users',
  '/api/admin/doctors',
  '/api/admin/reviews',
  '/api/admin/verification-requests',
  '/api/admin/growth-trend',
];

async function rolIle(browser, rol, is) {
  const context = await browser.newContext({ storageState: oturumDosyasi(rol) });
  const page = await context.newPage();
  try {
    return await is(page);
  } finally {
    await context.close();
  }
}

test.describe('Yönetim paneli erişimi', () => {
  for (const rol of ['hasta', 'demoDoktor', 'demoKlinik']) {
    test(`${rol} panele giremiyor`, async ({ browser }) => {
      const sonuclar = await rolIle(browser, rol, async (page) => {
        await page.goto('/tr/medstream');
        await cerezBandiniKapat(page);

        const cikti = {};
        for (const uc of YONETIM_UCLARI) {
          const { http } = await apiIstek(page, uc);
          cikti[uc] = http;
        }
        return cikti;
      });

      for (const [uc, http] of Object.entries(sonuclar)) {
        expect(reddedildiMi(http), `${rol} ${uc} ucunu görebiliyor (${http})`).toBeTruthy();
      }
    });
  }

  test('oturumsuz istek panele giremiyor', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/tr/login');

      for (const uc of YONETIM_UCLARI) {
        const durum = await page.evaluate(async (u) => {
          const r = await fetch(u, { headers: { Accept: 'application/json' } });
          return r.status;
        }, uc);
        expect(reddedildiMi(durum), `${uc} kimliksiz açılıyor`).toBeTruthy();
      }
    } finally {
      await context.close();
    }
  });

  test('yetkisiz kullanıcı doğrulama kararı veremiyor', async ({ browser }) => {
    // En tehlikeli işlem: doğrulama onayı doktoru hastaya "onaylı" gösterir.
    const uydurma = '00000000-0000-4000-8000-000000000000';

    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm');
      return apiIstek(page, `/api/admin/verification-requests/${uydurma}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    });

    expect(reddedildiMi(sonuc.http), 'Doktor kendi doğrulamasını onaylayabiliyor').toBeTruthy();
  });

  test('yönetim ekranı yetkisiz kullanıcıyı içeri almıyor', async ({ browser }) => {
    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/admin');
      await cerezBandiniKapat(page);

      // Ekran ya girişe/ana sayfaya yönlendirmeli ya da yetki uyarısı
      // göstermeli; yönetim verisi görünmemeli.
      await page.waitForTimeout(2500);
      const yol = new URL(page.url()).pathname;
      const metin = await page.evaluate(() => document.body.innerText.slice(0, 400));

      const panelde = /\/admin(\/|$)/.test(yol);
      if (panelde) {
        expect(
          /yetki|erişim|izin|permission|unauthor|forbidden|giriş/i.test(metin),
          `Hasta yönetim ekranında kaldı ve içerik gördü: ${metin.slice(0, 120)}`,
        ).toBeTruthy();
      }
    });
  });
});
