const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek, apiKok } = require('./yardimcilar');

/**
 * Aynı saate eşzamanlı randevu.
 *
 * Bu bir hız testi değil, doğruluk testi. Tek kullanıcıyla asla görünmez:
 * iki hasta aynı anda aynı doktorun aynı saatini istediğinde ikisi birden
 * kabul edilirse doktor o saatte iki kişiyi bekliyor demektir. Yük altında
 * ortaya çıkan bu tür hatalar yavaşlamadan çok daha pahalıdır.
 *
 * Yerel veritabanı SQLite; orada satır kilidi yok, dolayısıyla korumanın
 * gerçekten çalıştığı ancak canlıdaki TiDB'ye karşı kanıtlanabilir.
 *
 * Oluşan her randevu sonunda iptal edilir.
 */

const ADET = 5;

/** Testin bıraktığı kayıtlar burada toplanır ve sonunda iptal edilir. */
const olusanlar = [];

function yarin(gunSonra = 45) {
  const t = new Date();
  t.setDate(t.getDate() + gunSonra);
  return t.toISOString().slice(0, 10);
}

test.describe.configure({ mode: 'serial' });

test.describe('Eşzamanlı randevu', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  test('aynı doktorun aynı saati yalnızca bir kez verilebiliyor', async ({ page }) => {
    await page.goto('/tr/patient/appointments');
    await cerezBandiniKapat(page);

    const { govde: liste } = await apiIstek(page, '/api/appointments?per_page=1');
    const doktorId = liste?.data?.[0]?.doctor?.id ?? liste?.data?.[0]?.doctor_id ?? null;
    test.skip(!doktorId, 'Test hesabında doktor bulunamadı');

    const hastaId = await page.evaluate(
      () => JSON.parse(localStorage.getItem('auth_state') || '{}')?.user?.id,
    );

    const tarih = yarin();
    const saat = '09:30';

    // Beklemeden, hepsi birden gönderiliyor: sıraya girerlerse yarış hiç
    // oluşmaz ve test bir şey ölçmemiş olur.
    const sonuclar = await page.evaluate(
      async ({ adet, hastaId, doktorId, tarih, saat, kok }) => {
        const t = JSON.parse(localStorage.getItem('auth_state') || '{}').token;
        const istek = () =>
          fetch(`${kok}/api/appointments`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + t,
            },
            body: JSON.stringify({
              patient_id: hastaId,
              doctor_id: doktorId,
              appointment_type: 'online',
              appointment_date: tarih,
              appointment_time: saat,
            }),
          }).then(async (r) => ({ http: r.status, govde: await r.json().catch(() => null) }));

        return Promise.all(Array.from({ length: adet }, istek));
      },
      { adet: ADET, hastaId, doktorId, tarih, saat, kok: apiKok() },
    );

    for (const s of sonuclar) {
      const kayit = s.govde?.data ?? s.govde?.appointment ?? s.govde;
      if (s.http === 201 && kayit?.id) olusanlar.push(kayit.id);
    }

    const kabul = sonuclar.filter((s) => s.http === 201).length;

    expect(
      kabul,
      `Aynı doktorun ${tarih} ${saat} saati ${kabul} kez verildi. ` +
        'Doktor o saatte birden fazla hastayı bekliyor.',
    ).toBe(1);
  });

  test.afterAll(async ({ browser }) => {
    if (!olusanlar.length) return;

    const context = await browser.newContext({ storageState: oturumDosyasi('hasta') });
    const page = await context.newPage();
    try {
      await page.goto('/tr/patient/appointments');
      for (const id of olusanlar) {
        await apiIstek(page, `/api/appointments/${id}/cancel`, {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Otomatik test temizliği' }),
        }).catch(() => {});
      }
    } finally {
      await context.close();
    }
  });
});
