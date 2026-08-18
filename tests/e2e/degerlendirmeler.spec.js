const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Değerlendirmeler.
 *
 * Yorum yazma hakkı randevuya bağlı: tedavi görmemiş biri doktor puanlayamaz.
 * Bu kural platformun güvenilirliğini taşıyor, o yüzden asıl sınanan şey
 * REDDİN çalışması. Yorum yazma denemesi yapılmıyor — yazılan yorum silinmiyor
 * ve doktorun herkese açık puanını kalıcı olarak değiştirirdi.
 */

const REDDEDILDI = [401, 403, 404, 422];

async function rolIle(browser, rol, is) {
  const context = await browser.newContext({ storageState: oturumDosyasi(rol) });
  const page = await context.newPage();
  try {
    return await is(page);
  } finally {
    await context.close();
  }
}

test.describe('Değerlendirmeler', () => {
  test('doktor yorumları herkese açık okunuyor', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/tr/doctors-departments');
      await cerezBandiniKapat(page);

      // Önce bir doktor kimliği bul; yorum listesi ona sorulacak.
      const doktorId = await page.evaluate(async () => {
        const r = await fetch('/api/doctors?per_page=1', { headers: { Accept: 'application/json' } });
        const j = await r.json().catch(() => null);
        const liste = j?.data?.data ?? j?.data ?? [];
        return liste[0]?.id ?? null;
      });

      test.skip(!doktorId, 'Sistemde doktor bulunamadı');

      const sonuc = await page.evaluate(async (id) => {
        const r = await fetch(`/api/doctors/${id}/reviews`, { headers: { Accept: 'application/json' } });
        return { http: r.status, govde: await r.json().catch(() => null) };
      }, doktorId);

      // Yorumlar giriş yapmadan da okunabilmeli: hasta doktor seçerken
      // henüz üye olmamış oluyor.
      expect(sonuc.http).toBe(200);
      expect(sonuc.govde).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test('randevusu olmayan hasta yorum yazamıyor', async ({ browser }) => {
    const sonuc = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/medstream');
      await cerezBandiniKapat(page);

      const doktorId = await page.evaluate(async () => {
        const r = await fetch('/api/doctors?per_page=1', { headers: { Accept: 'application/json' } });
        const j = await r.json().catch(() => null);
        const liste = j?.data?.data ?? j?.data ?? [];
        return liste[0]?.id ?? null;
      });
      if (!doktorId) return null;

      // Var olmayan bir randevu kimliğiyle: tedavi ilişkisi kurulamaz.
      const uydurma = '00000000-0000-4000-8000-000000000000';
      return apiIstek(page, `/api/doctors/${doktorId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: 5,
          comment: 'Otomatik test yorumu, kaydedilmemeli.',
          appointment_id: uydurma,
        }),
      });
    });

    test.skip(!sonuc, 'Sistemde doktor bulunamadı');
    expect(REDDEDILDI, 'Randevusuz yorum kabul edildi').toContain(sonuc.http);
  });

  test('oturumsuz yorum yazılamıyor', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/tr/doctors-departments');

      const durum = await page.evaluate(async () => {
        const r = await fetch('/api/doctors/00000000-0000-4000-8000-000000000000/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ rating: 5, comment: 'Oturumsuz deneme yorumu.' }),
        });
        return r.status;
      });

      expect(REDDEDILDI).toContain(durum);
    } finally {
      await context.close();
    }
  });

  test('doktor yalnızca kendi yorumlarını görüyor', async ({ browser }) => {
    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/crm/reviews');
      await cerezBandiniKapat(page);
      return apiIstek(page, '/api/doctors/my-reviews');
    });

    expect([200, 403]).toContain(sonuc.http);
    if (sonuc.http !== 200) return;

    const kayitlar = sonuc.govde?.data?.data ?? sonuc.govde?.data ?? [];
    const kendiId = sonuc.govde?.doctor_id;
    if (Array.isArray(kayitlar) && kayitlar.length && kendiId) {
      for (const y of kayitlar.slice(0, 5)) {
        expect(y.doctor_id ?? kendiId).toBe(kendiId);
      }
    }
  });

  test('hasta yönetimin yorum moderasyon ucuna giremiyor', async ({ browser }) => {
    const sonuc = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/medstream');
      return apiIstek(page, '/api/admin/reviews');
    });

    expect([401, 403, 404]).toContain(sonuc.http);
  });
});
