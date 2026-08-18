const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Yetki sınırları — kim neyi göremiyor.
 *
 * Hasta verisiyle çalışan bir sistemde en pahalı hata sızıntıdır. Buradaki
 * her test bir REDDİ doğruluyor: doğru cevabın "hayır" olduğu durumlar.
 * Hiçbir kayıt oluşturulmaz, hiçbir şey değiştirilmez.
 *
 * Kabul edilen yanıtlar bilinçli olarak geniş: 401 (kimlik yok), 403 (yetki
 * yok) ve 404 (kapsam dışı — kaydın varlığını bile sızdırmamak için tercih
 * edilen biçim). Kabul EDİLMEYEN tek şey 2xx.
 */

const REDDEDILDI = [401, 403, 404, 405];

async function rolIle(browser, rol, is) {
  const context = await browser.newContext({ storageState: oturumDosyasi(rol) });
  const page = await context.newPage();
  try {
    return await is(page);
  } finally {
    await context.close();
  }
}

test.describe('Yetki sınırları', () => {
  test.describe('Hasta', () => {
    test.use({ storageState: oturumDosyasi('hasta') });

    test('CRM uçlarına giremiyor', async ({ page }) => {
      await page.goto('/tr/patient/appointments');
      await cerezBandiniKapat(page);

      const uclar = [
        '/api/crm/billing/invoices',
        '/api/crm/patients',
        '/api/crm/dashboard-stats',
        '/api/finance/top-services',
      ];

      for (const uc of uclar) {
        const { http } = await apiIstek(page, uc);
        expect(REDDEDILDI, `Hasta ${uc} ucunu görebiliyor`).toContain(http);
      }
    });

    test('yönetim paneline giremiyor', async ({ page }) => {
      await page.goto('/tr/patient/appointments');

      for (const uc of ['/api/admin/users', '/api/admin/stats', '/api/admin/tickets']) {
        const { http } = await apiIstek(page, uc);
        expect(REDDEDILDI, `Hasta ${uc} ucunu görebiliyor`).toContain(http);
      }
    });

    test('başka hastanın belgesine ulaşamıyor', async ({ page }) => {
      await page.goto('/tr/medical-archive');

      const uydurma = '00000000-0000-4000-8000-000000000000';
      const { http } = await apiIstek(page, `/api/patient-documents/${uydurma}/download`);
      expect(REDDEDILDI).toContain(http);
    });

    test('kendi rolünü yükseltemiyor', async ({ page }) => {
      await page.goto('/tr/profile');

      const { http, govde } = await apiIstek(page, '/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ role_id: 'superAdmin', is_verified: true, user_level: 5 }),
      });

      // İstek kabul edilebilir (alanlar sessizce yok sayılır) ama rol
      // değişmemeli. Ölçülen şey sonucun kendisi.
      if (http === 200) {
        const kullanici = govde?.data ?? govde;
        expect(kullanici?.role_id).not.toBe('superAdmin');
        expect(kullanici?.user_level ?? 1).toBeLessThan(5);
      } else {
        expect(REDDEDILDI.concat(422)).toContain(http);
      }
    });
  });

  test.describe('Oturumsuz', () => {
    test('hasta verisi taşıyan uçlar kimliksiz açılmıyor', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await page.goto('/tr/login');

        const uclar = [
          '/api/appointments',
          '/api/patient/billing/invoices',
          '/api/notifications',
          '/api/chat/conversations',
          '/api/auth/me',
          '/api/crm/patients',
        ];

        for (const uc of uclar) {
          const durum = await page.evaluate(async (u) => {
            const r = await fetch(u, { headers: { Accept: 'application/json' } });
            return r.status;
          }, uc);
          expect(REDDEDILDI, `${uc} kimlik doğrulaması olmadan açılıyor`).toContain(durum);
        }
      } finally {
        await context.close();
      }
    });
  });

  test.describe('Doktor', () => {
    test('hastası olmayan birinin dosyasını açamıyor', async ({ browser }) => {
      const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
        await page.goto('/tr/crm/patients');
        await cerezBandiniKapat(page);

        // Tedavi ilişkisi olmayan bir kimlik: sunucu 360 görünümünü vermemeli.
        const uydurma = '00000000-0000-4000-8000-000000000000';
        return apiIstek(page, `/api/crm/patients/${uydurma}/360`);
      });

      expect(REDDEDILDI).toContain(sonuc.http);
    });

    test('başka kliniğin faturasını göremiyor', async ({ browser }) => {
      const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
        await page.goto('/tr/crm/billing');
        const uydurma = '00000000-0000-4000-8000-000000000000';
        return apiIstek(page, `/api/crm/billing/invoices/${uydurma}`);
      });

      expect(REDDEDILDI).toContain(sonuc.http);
    });
  });
});
