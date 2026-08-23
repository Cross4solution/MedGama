const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek, apiKok } = require('./yardimcilar');

/**
 * Muayene/reçete ve destek talepleri.
 *
 * Muayene kaydı tıbbi veridir: tanı notu, hayati bulgular, reçete. Bu yüzden
 * hem yazılabildiği hem de YALNIZCA ilgili doktorun okuyabildiği sınanıyor.
 * Kayıt test sonunda silinir.
 *
 * Destek talebi kalıcıdır (kapatılabilir ama silinmez); bu yüzden yalnızca
 * bir tane açılıp hemen yanıtlanıyor ve konusu test olduğu belli olacak
 * şekilde etiketleniyor.
 */

const ONEK = '[otomatik test]';
const REDDEDILDI = [401, 403, 404];

async function rolIle(browser, rol, is) {
  const context = await browser.newContext({ storageState: oturumDosyasi(rol) });
  const page = await context.newPage();
  try {
    return await is(page);
  } finally {
    await context.close();
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('Muayene ve reçete', () => {
  /** @type {string|null} */
  let muayeneId = null;
  /** @type {string|null} */
  let hastaId = null;

  test('doktor muayene kaydı açabiliyor', async ({ browser }) => {
    hastaId = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/patient/appointments');
      await cerezBandiniKapat(page);
      return page.evaluate(
        () => JSON.parse(localStorage.getItem('auth_state') || '{}')?.user?.id,
      );
    });

    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/examination');
      await cerezBandiniKapat(page);

      return apiIstek(page, '/api/crm/examinations', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: hastaId,
          diagnosis_note: `${ONEK} kayıt test sonunda silinir`,
          vitals: { systolic: 120, diastolic: 80, pulse: 72 },
        }),
      });
    });

    test.skip(sonuc.http === 403, 'Demo doktorda muayene yetkisi yok');
    expect(sonuc.http, `Muayene açılamadı: ${JSON.stringify(sonuc.govde)}`).toBe(201);

    const kayit = sonuc.govde?.examination ?? sonuc.govde?.data ?? sonuc.govde;
    muayeneId = kayit?.id ?? null;
    expect(muayeneId).toBeTruthy();
  });

  test('reçete PDF olarak iniyor', async ({ browser }) => {
    test.skip(!muayeneId, 'Muayene açılmadı');

    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/examination');
      return page.evaluate(async ({ id, kok }) => {
        const t = JSON.parse(localStorage.getItem('auth_state') || '{}').token;
        const r = await fetch(`${kok}/api/crm/examinations/${id}/prescription-pdf`, {
          headers: { Authorization: 'Bearer ' + t },
        });
        return { http: r.status, tur: r.headers.get('content-type') };
      }, { id: muayeneId, kok: apiKok() });
    });

    // Reçetesiz muayenede sunucu üretmeyi reddedebilir; ürettiyse gerçekten
    // PDF olmalı.
    expect([200, 404, 422]).toContain(sonuc.http);
    if (sonuc.http === 200) expect(sonuc.tur).toContain('pdf');
  });

  test('hasta muayene kaydını CRM ucundan okuyamıyor', async ({ browser }) => {
    test.skip(!muayeneId, 'Muayene açılmadı');

    const sonuc = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/patient/appointments');
      return apiIstek(page, `/api/crm/examinations/${muayeneId}`);
    });

    // Tıbbi kayıt hastanın kendisine ait ama bu uç doktorun çalışma alanı;
    // hasta rolüne kapalı olmalı.
    expect(REDDEDILDI).toContain(sonuc.http);
  });

  test.afterAll(async ({ browser }) => {
    if (!muayeneId) return;
    await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/examination');
      await apiIstek(page, `/api/crm/examinations/${muayeneId}`, { method: 'DELETE' });
    }).catch(() => {});
  });
});

test.describe('Destek talepleri', () => {
  /** @type {string|null} */
  let talepId = null;

  test('kullanıcı talep açabiliyor ve yanıt yazabiliyor', async ({ browser }) => {
    const acma = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/support');
      await cerezBandiniKapat(page);

      return apiIstek(page, '/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: `${ONEK} destek talebi`,
          body: 'Bu talep otomatik test tarafından açıldı, dikkate almayın.',
          priority: 'low',
        }),
      });
    });

    test.skip(acma.http === 403, 'Destek talebi yetkisi yok');
    expect([200, 201], `Talep açılamadı: ${JSON.stringify(acma.govde)}`).toContain(acma.http);

    const talep = acma.govde?.ticket ?? acma.govde?.data ?? acma.govde;
    talepId = talep?.id ?? null;
    expect(talepId).toBeTruthy();

    const yanit = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/support');
      return apiIstek(page, `/api/support/tickets/${talepId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: 'Otomatik test yanıtı.' }),
      });
    });
    expect([200, 201]).toContain(yanit.http);
  });

  test('başkasının talebi okunamıyor', async ({ browser }) => {
    test.skip(!talepId, 'Talep açılmadı');

    const sonuc = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/profile');
      return apiIstek(page, `/api/support/tickets/${talepId}`);
    });

    expect(REDDEDILDI).toContain(sonuc.http);
  });
});
