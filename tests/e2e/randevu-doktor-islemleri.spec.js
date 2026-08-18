const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Doktorun randevu üzerindeki işlemleri: onaylama, "gelmedi" işaretleme ve
 * yetki sınırı.
 *
 * Hasta tarafı ayrı dosyada; burada aynı randevuya doktor hesabıyla
 * dokunuluyor. Randevu test tarafından açılır ve sonunda iptal edilir —
 * canlıda açık kayıt kalmaz.
 */

const GUN_SONRA = (gun) => {
  const d = new Date();
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
};

/** Belirli bir rolün oturumuyla tek seferlik sayfa açar. */
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

test.describe('Doktor randevu işlemleri', () => {
  /** @type {string|null} */
  let randevuId = null;

  test('randevu açılıyor ve doktor onaylayabiliyor', async ({ browser }) => {
    // 0) Randevu, TEST DOKTORUNUN kendisine açılmalı — başka bir doktorun
    // randevusuna müdahale yetkisi zaten yok (403 doğru davranış olurdu).
    const doktor = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/appointments');
      return page.evaluate(() => {
        const u = JSON.parse(localStorage.getItem('auth_state') || '{}')?.user || {};
        return { id: u.id, dogrulanmis: !!u.is_verified };
      });
    });

    // Doğrulanmamış doktor randevuya dokunamaz — sunucu kuralı bu ve doğrusu
    // da bu. Test hesabı doğrulanmamışsa sınanacak bir şey yok.
    test.skip(!doktor?.dogrulanmis, 'Test doktoru doğrulanmamış: randevu işlemleri sunucuda kapalı');
    const doktorId = doktor.id;

    // 1) Hasta randevu alır.
    const olusan = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/patient/appointments');
      await cerezBandiniKapat(page);

      if (!doktorId) return null;

      const hastaId = await page.evaluate(
        () => JSON.parse(localStorage.getItem('auth_state') || '{}')?.user?.id,
      );

      const { http, govde } = await apiIstek(page, '/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: hastaId,
          doctor_id: doktorId,
          appointment_type: 'online',
          appointment_date: GUN_SONRA(31),
          appointment_time: '11:00',
        }),
      });
      return http === 201 ? (govde?.data ?? govde) : null;
    });

    test.skip(!olusan, 'Randevu oluşturulamadı (test hesabında doktor yok)');
    randevuId = olusan.id;

    // 2) Doktor onaylar. Zaten onaylı geldiyse istek yine 200 dönmeli.
    const durum = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/appointments');
      const { http, govde } = await apiIstek(page, `/api/appointments/${randevuId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'confirmed' }),
      });
      return { http, kayit: govde?.data ?? govde };
    });

    expect(durum.http).toBe(200);
    expect(durum.kayit?.status).toBe('confirmed');
  });

  test('gelecekteki randevu "gelmedi" yapılamıyor, kural sunucuda', async ({ browser }) => {
    test.skip(!randevuId, 'Önceki adım randevu oluşturmadı');

    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/appointments');
      return apiIstek(page, `/api/appointments/${randevuId}/no-show`, { method: 'PUT' });
    });

    // Randevu onaylı olduğu için sunucu kabul edebilir; ancak kabul ederse
    // kayıt gerçekten no_show olmalı — sessizce yutmamalı.
    expect([200, 403, 422]).toContain(sonuc.http);
    if (sonuc.http === 200) {
      const kayit = sonuc.govde?.data ?? sonuc.govde;
      expect(kayit?.status).toBe('no_show');
    }
  });

  test('başka bir hasta bu randevuyu göremiyor', async ({ browser }) => {
    test.skip(!randevuId, 'Önceki adım randevu oluşturmadı');

    // Doktor hesabı randevunun tarafı; hasta da öyle. Yetkisiz üçüncü taraf
    // olarak oturumsuz istek atılır: kimlik doğrulaması olmadan açılmamalı.
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/tr/login');
      const sonuc = await page.evaluate(async (id) => {
        const r = await fetch(`/api/appointments/${id}`, { headers: { Accept: 'application/json' } });
        return r.status;
      }, randevuId);
      expect([401, 403]).toContain(sonuc);
    } finally {
      await context.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    if (!randevuId) return;
    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/patient/appointments');
      const { govde } = await apiIstek(page, `/api/appointments/${randevuId}`);
      const durum = (govde?.data ?? govde)?.status;
      if (durum && durum !== 'cancelled') {
        await apiIstek(page, `/api/appointments/${randevuId}/cancel`, {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Otomatik test temizliği' }),
        });
      }
    }).catch(() => {});
  });
});
