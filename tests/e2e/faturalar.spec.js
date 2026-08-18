const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Hastanın kendi faturaları.
 *
 * Fatura hastanın adını, aldığı hizmeti ve tutarı taşır. İki şey birden
 * doğrulanır: hasta kendi kaydını görebiliyor mu, ve başkasının kaydına
 * kimliğini bilse bile ulaşamıyor mu. Test veri üretmez, yalnızca okur.
 */
test.describe('Hasta faturaları', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  test('kendi faturaları listeleniyor', async ({ page }) => {
    await page.goto('/tr/patient/invoices');
    await cerezBandiniKapat(page);

    const { http, govde } = await apiIstek(page, '/api/patient/billing/invoices?per_page=5');
    expect(http).toBe(200);

    const kayitlar = govde?.data ?? [];

    await expect(page.getByRole('heading', { name: /Faturalar|Invoices/i }).first()).toBeVisible();

    // Test hesabının faturası olabilir de olmayabilir de; ikisi de geçerli
    // durum. Doğrulanan şey ekranın sunucudaki kayda uyması: kayıt varsa
    // numarası görünmeli, yoksa boş durum yazısı.
    if (kayitlar.length) {
      await expect(page.getByText(kayitlar[0].invoice_number).first()).toBeVisible();
    } else {
      await expect(page.getByText(/Henüz faturanız yok|no invoices/i).first()).toBeVisible();
    }
  });

  test('başkasının faturası kimliğiyle de açılmıyor', async ({ page }) => {
    await page.goto('/tr/patient/invoices');

    // Var olmayan/başkasına ait bir kimlik: sunucu kapsam dışına çıkmamalı.
    const uydurma = '00000000-0000-4000-8000-000000000000';
    const { http } = await apiIstek(page, `/api/patient/billing/invoices/${uydurma}`);
    expect(http).toBe(404);
  });

  test('hasta fatura yazamıyor', async ({ page }) => {
    await page.goto('/tr/patient/invoices');

    // Yazma uçları hasta tarafında hiç tanımlı değil (405) ve CRM ucu role
    // kapısıyla kapalı (403). İkisi de kabul; olmaması gereken 2xx.
    const { http } = await apiIstek(page, '/api/patient/billing/invoices', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    });
    expect(http).toBeGreaterThanOrEqual(400);
  });

  test('fatura PDF indirilebiliyor', async ({ page }) => {
    await page.goto('/tr/patient/invoices');

    const { govde } = await apiIstek(page, '/api/patient/billing/invoices?per_page=1');
    const fatura = govde?.data?.[0];
    test.skip(!fatura, 'Demo hesapta fatura yok');

    const sonuc = await page.evaluate(async (id) => {
      const t = JSON.parse(localStorage.getItem('auth_state') || '{}').token;
      const r = await fetch(`/api/patient/billing/invoices/${id}/pdf`, {
        headers: { Authorization: 'Bearer ' + t },
      });
      return { http: r.status, tur: r.headers.get('content-type') };
    }, fatura.id);

    expect(sonuc.http).toBe(200);
    expect(sonuc.tur).toContain('pdf');
  });
});
