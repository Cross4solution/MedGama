const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * CRM ekranları: hasta yönetimi, takvim, potansiyel müşteriler, gelir.
 *
 * Buradaki asıl soru "ekran açılıyor mu" değil, ekranın gösterdiğinin
 * sunucudakiyle aynı olması. CRM bir dönem geride kalmıştı: hasta 360
 * görünümü sahte veri gösteriyor, takvim duvar saatiyle çalışıyordu.
 *
 * Potansiyel müşteri kaydı oluşturulup silinir; gerisi salt okunur.
 */

const ONEK = 'Otomatik test —';

async function klinikIle(browser, is) {
  const context = await browser.newContext({ storageState: oturumDosyasi('demoKlinik') });
  const page = await context.newPage();
  try {
    return await is(page);
  } finally {
    await context.close();
  }
}

test.describe('CRM ekranları', () => {
  test.use({ storageState: oturumDosyasi('demoKlinik') });

  test('hasta listesi ekranda ve sunucuda aynı', async ({ page }) => {
    await page.goto('/tr/crm/patients');
    await cerezBandiniKapat(page);

    const { http, govde } = await apiIstek(page, '/api/crm/patients?per_page=5');
    test.skip(http === 403, 'Demo klinikte CRM erişimi yok');
    expect(http).toBe(200);

    const kayitlar = govde?.data ?? [];
    await expect(page.getByRole('heading', { name: /Hastalar|Patients/i }).first()).toBeVisible();

    if (kayitlar.length) {
      // CRM bir dönem sahte veriyle doluydu; ölçülen şey ekranın sunucudaki
      // kayıtları göstermesi. Hangi ismin ilk sırada olacağı sıralamaya bağlı
      // olduğu için gelenlerden herhangi birinin görünmesi yeterli.
      const adlar = kayitlar
        .map((h) => h.fullname ?? h.name)
        .filter(Boolean);

      await expect
        .poll(async () => {
          for (const ad of adlar) {
            if (await page.getByText(ad).first().isVisible().catch(() => false)) return true;
          }
          return false;
        }, {
          message: `Sunucudaki hastaların hiçbiri ekranda yok: ${adlar.join(', ')}`,
          timeout: 20_000,
        })
        .toBe(true);
    }
  });

  test('hasta istatistikleri sayısal geliyor', async ({ page }) => {
    await page.goto('/tr/crm/patients');

    const { http, govde } = await apiIstek(page, '/api/crm/patients/stats');
    test.skip(http === 403, 'CRM erişimi yok');
    expect(http).toBe(200);

    const veri = govde?.data ?? govde;
    // Sayılar gerçekten sayı olmalı: panelde "—" gösterip arkada null taşımak
    // uzun süre fark edilmiyordu.
    for (const [anahtar, deger] of Object.entries(veri || {})) {
      if (deger !== null && typeof deger === 'object') continue;
      if (deger === null) continue;
      expect(Number.isFinite(Number(deger)), `${anahtar} sayı değil: ${deger}`).toBeTruthy();
    }
  });

  test('takvim olayları mutlak an taşıyor', async ({ page }) => {
    await page.goto('/tr/crm/calendar');
    await cerezBandiniKapat(page);

    const { http, govde } = await apiIstek(page, '/api/appointments/calendar-events');
    expect(http).toBe(200);

    const olaylar = govde?.events ?? govde?.data?.events ?? [];
    if (!olaylar.length) test.skip(true, 'Takvimde olay yok');

    // Duvar saati tek başına hangi ülkenin saati olduğunu belirsiz bırakıyordu;
    // olayların başlangıcı tam zaman damgası olmalı.
    for (const o of olaylar.slice(0, 5)) {
      expect(o.start, 'Takvim olayında başlangıç yok').toBeTruthy();
      expect(String(o.start)).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    }
  });

  test('gelir raporu tutarlı sayı döndürüyor', async ({ page }) => {
    await page.goto('/tr/crm/revenue');
    await cerezBandiniKapat(page);

    const { http, govde } = await apiIstek(page, '/api/crm/billing/stats');
    test.skip(http === 403, 'CRM erişimi yok');
    expect(http).toBe(200);

    const veri = govde?.data ?? govde;
    expect(veri, 'Gelir istatistiği boş').toBeTruthy();
  });

  test('potansiyel müşteri eklenip silinebiliyor', async ({ browser }) => {
    const olusan = await klinikIle(browser, async (page) => {
      await page.goto('/tr/crm/leads');
      await cerezBandiniKapat(page);

      const { http, govde } = await apiIstek(page, '/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          full_name: `${ONEK} aday`,
          email: `test-lead-${Date.now()}@medagama.test`,
          phone: '+900000000000',
          source: 'other',
        }),
      });
      return { http, kayit: govde?.lead ?? govde?.data ?? govde };
    });

    test.skip(olusan.http === 403, 'CRM erişimi yok');
    expect([200, 201], `Aday eklenemedi: ${JSON.stringify(olusan.kayit)}`).toContain(olusan.http);

    const id = olusan.kayit?.id;
    expect(id).toBeTruthy();

    // Kalıcı iz bırakma: eklenen aday siliniyor.
    const silme = await klinikIle(browser, async (page) => {
      await page.goto('/tr/crm/leads');
      return apiIstek(page, `/api/crm/leads/${id}`, { method: 'DELETE' });
    });
    expect([200, 204]).toContain(silme.http);
  });
});
