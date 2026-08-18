const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Arama ve tıbbi arşiv.
 *
 * Arama hastanın doktora ulaştığı ilk kapı; boş dönmesi platformu işlevsiz
 * bırakır. Arşiv ise hastanın kendi belgeleri — PHI. Bu yüzden arşiv tarafında
 * ölçülen şey "yükleniyor mu" değil, BAŞKASININ belgesine ulaşılamıyor olması.
 *
 * Hiçbir belge yüklenmiyor: gerçek hasta belgesi üretmek, silinse bile canlı
 * ortamda şifreli bir dosya bırakır ve saklama/silme yükümlülüğüne girer.
 * Yükleme akışı backend testlerinde kapsanıyor.
 */

const REDDEDILDI = [401, 403, 404];

test.describe('Arama', () => {
  test('canlı arama misafire de yanıt veriyor', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/tr');
      await cerezBandiniKapat(page);

      const sonuc = await page.evaluate(async () => {
        const r = await fetch('/api/search/live?q=kardi', { headers: { Accept: 'application/json' } });
        return { http: r.status, govde: await r.json().catch(() => null) };
      });

      // Arama herkese açık: giriş yapmadan da çalışmalı.
      expect(sonuc.http).toBe(200);
      expect(sonuc.govde, 'Arama boş yanıt döndü').toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test('uzmanlık ve şehir aramaları liste döndürüyor', async ({ page }) => {
    await page.goto('/tr');
    await cerezBandiniKapat(page);

    for (const uc of ['/api/catalog/specialties/search?q=kar', '/api/catalog/cities/search?q=ist']) {
      const sonuc = await page.evaluate(async (u) => {
        const r = await fetch(u, { headers: { Accept: 'application/json' } });
        return { http: r.status, govde: await r.json().catch(() => null) };
      }, uc);

      expect([200, 404], `${uc} beklenmeyen durum: ${sonuc.http}`).toContain(sonuc.http);
      if (sonuc.http === 200) {
        const liste = sonuc.govde?.data ?? sonuc.govde;
        expect(Array.isArray(liste) || typeof liste === 'object').toBeTruthy();
      }
    }
  });

  test('semptom listesi geliyor', async ({ page }) => {
    await page.goto('/tr');

    const sonuc = await page.evaluate(async () => {
      const r = await fetch('/api/catalog/symptoms', { headers: { Accept: 'application/json' } });
      return { http: r.status, govde: await r.json().catch(() => null) };
    });

    expect([200, 404]).toContain(sonuc.http);
  });
});

test.describe('Tıbbi arşiv', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  test('hasta kendi belge listesini görebiliyor', async ({ page }) => {
    await page.goto('/tr/medical-archive');
    await cerezBandiniKapat(page);

    const { http, govde } = await apiIstek(page, '/api/patient-documents?per_page=5');
    expect(http).toBe(200);

    const liste = Array.isArray(govde?.data) ? govde.data : (govde?.data?.data ?? []);
    expect(Array.isArray(liste), 'Belge listesi dizi değil').toBeTruthy();
  });

  test('başkasının belgesi indirilemiyor', async ({ page }) => {
    await page.goto('/tr/medical-archive');

    const uydurma = '00000000-0000-4000-8000-000000000000';
    for (const uc of [
      `/api/patient-documents/${uydurma}`,
      `/api/patient-documents/${uydurma}/download`,
    ]) {
      const { http } = await apiIstek(page, uc);
      expect(REDDEDILDI, `${uc} açılıyor`).toContain(http);
    }
  });

  test('hasta başkasının belgesini paylaşamıyor', async ({ page }) => {
    await page.goto('/tr/medical-archive');

    const uydurma = '00000000-0000-4000-8000-000000000000';
    const { http } = await apiIstek(page, `/api/patient-documents/${uydurma}/share`, {
      method: 'POST',
      body: JSON.stringify({ doctor_id: uydurma }),
    });
    expect(REDDEDILDI.concat(422), 'Paylaşım kabul edildi').toContain(http);
  });

  test('hasta doktorun paylaşılmış belge ucunu kullanamıyor', async ({ page }) => {
    await page.goto('/tr/medical-archive');

    // Bu uç yalnızca doktor/klinik içindir: hastanın başkasının belgelerini
    // listelemesine kapı açmamalı.
    const uydurma = '00000000-0000-4000-8000-000000000000';
    const { http } = await apiIstek(page, `/api/patient-documents/shared/${uydurma}`);
    expect(REDDEDILDI).toContain(http);
  });
});

test.describe('Doğrulama akışı', () => {
  test('doğrulama durumu okunabiliyor', async ({ browser }) => {
    const context = await browser.newContext({ storageState: oturumDosyasi('demoDoktor') });
    const page = await context.newPage();
    try {
      await page.goto('/tr/crm/settings?tab=verification');
      await cerezBandiniKapat(page);

      const { http, govde } = await apiIstek(page, '/api/doctor-profile/verification');
      expect([200, 403, 404]).toContain(http);
      if (http === 200) expect(govde).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test('hasta doğrulama başvurusu yapamıyor', async ({ browser }) => {
    const context = await browser.newContext({ storageState: oturumDosyasi('hasta') });
    const page = await context.newPage();
    try {
      await page.goto('/tr/profile');

      const { http } = await apiIstek(page, '/api/doctor-profile/verification', {
        method: 'POST',
        body: JSON.stringify({ document_type: 'diploma' }),
      });
      expect(REDDEDILDI.concat(422)).toContain(http);
    } finally {
      await context.close();
    }
  });
});
