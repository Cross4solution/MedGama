const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek, apiKok } = require('./yardimcilar');

/**
 * Faturanın yaşam döngüsü: klinik keser → hasta görür → PDF iner → kapatılır.
 *
 * Fatura hastanın adını, aldığı hizmeti ve tutarı taşır; yani sağlık verisi.
 * Bu yüzden yalnızca "kesilebiliyor mu" değil, "yanlış kişi görebiliyor mu"
 * da sınanıyor. Kesilen fatura sonunda iptal edilir — canlıda açık kayıt
 * bırakılmaz.
 */

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

test.describe('Fatura yaşam döngüsü', () => {
  /** @type {string|null} */
  let faturaId = null;
  /** @type {string|null} */
  let faturaNo = null;
  /** @type {string|null} */
  let hastaId = null;

  test('klinik fatura kesebiliyor', async ({ browser }) => {
    hastaId = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/patient/invoices');
      await cerezBandiniKapat(page);
      return page.evaluate(
        () => JSON.parse(localStorage.getItem('auth_state') || '{}')?.user?.id,
      );
    });

    const sonuc = await rolIle(browser, 'demoKlinik', async (page) => {
      await page.goto('/tr/crm/billing');
      await cerezBandiniKapat(page);

      return apiIstek(page, '/api/crm/billing/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: hastaId,
          currency: 'EUR',
          issue_date: new Date().toISOString().slice(0, 10),
          notes: 'Otomatik test faturası',
          items: [{ description: 'Otomatik test kalemi', quantity: 1, unit_price: 1 }],
        }),
      });
    });

    // CRM aboneliği yoksa sunucu kapıyı kapatır — doğru davranış, sınanacak
    // bir şey kalmaz.
    test.skip(sonuc.http === 403, 'Demo klinikte CRM erişimi yok: fatura kesme kapalı');

    expect(sonuc.http, `Fatura kesilemedi: ${JSON.stringify(sonuc.govde)}`).toBe(201);

    const fatura = sonuc.govde?.data ?? sonuc.govde;
    faturaId = fatura?.id ?? null;
    faturaNo = fatura?.invoice_number ?? null;
    expect(faturaId).toBeTruthy();
    expect(Number(fatura?.grand_total)).toBeGreaterThan(0);
  });

  test('hasta kendi faturasını görüyor ve PDF indirebiliyor', async ({ browser }) => {
    test.skip(!faturaId, 'Fatura kesilmedi');

    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/patient/invoices');
      await cerezBandiniKapat(page);

      const { http, govde } = await apiIstek(page, `/api/patient/billing/invoices/${faturaId}`);
      expect(http).toBe(200);
      expect((govde?.data ?? govde)?.invoice_number).toBe(faturaNo);

      // Ekranda da görünmeli: sunucuda olup ekranda olmayan kayıt işe yaramaz.
      await expect(page.getByText(faturaNo).first()).toBeVisible({ timeout: 15_000 });

      const pdf = await page.evaluate(async ({ id, kok }) => {
        const t = JSON.parse(localStorage.getItem('auth_state') || '{}').token;
        const r = await fetch(`${kok}/api/patient/billing/invoices/${id}/pdf`, {
          headers: { Authorization: 'Bearer ' + t },
        });
        return { http: r.status, tur: r.headers.get('content-type') };
      }, { id: faturaId, kok: apiKok() });

      expect(pdf.http).toBe(200);
      expect(pdf.tur).toContain('pdf');
    });
  });

  test('faturayı kesen olmayan doktor göremiyor', async ({ browser }) => {
    test.skip(!faturaId, 'Fatura kesilmedi');

    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/billing');
      return apiIstek(page, `/api/crm/billing/invoices/${faturaId}`);
    });

    // Kliniğin kestiği fatura başka bir doktorun kapsamında değil: 404
    // (kapsam dışı) ya da 403 (yetki yok) beklenir; 200 olmamalı.
    expect([403, 404]).toContain(sonuc.http);
  });

  test.afterAll(async ({ browser }) => {
    if (!faturaId) return;
    await rolIle(browser, 'demoKlinik', async (page) => {
      await page.goto('/tr/crm/billing');
      // Silme kaydı iptal durumuna alıp yumuşak siliyor: canlıda açık fatura
      // kalmasın.
      await apiIstek(page, `/api/crm/billing/invoices/${faturaId}`, { method: 'DELETE' });
    }).catch(() => {});
  });
});
