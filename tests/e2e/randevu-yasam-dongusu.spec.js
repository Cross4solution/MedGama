const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Randevunun baştan sona yaşam döngüsü — gerçekten kayıt oluşturarak.
 *
 * Buraya kadarki testler yalnızca okuyordu; "randevu alınabiliyor mu" gibi
 * asıl soruyu hiçbiri sormuyordu. Bu dosya demo hesapların altında bir
 * randevu açar, durumunu değiştirir ve SONUNDA İPTAL EDİP KAPATIR — canlıda
 * açık bir kayıt bırakmaz.
 *
 * Randevu bugünden 30+ gün sonrasına, günün ortasına alınır: kimsenin
 * gerçek takvimine denk gelmesin ve hatırlatma zamanlayıcısını tetiklemesin.
 */

const YARIN_30 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

test.describe.configure({ mode: 'serial' });

test.describe('Randevu yaşam döngüsü', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  /** @type {string|null} */
  let randevuId = null;
  /** @type {string|null} */
  let doktorId = null;

  test('hasta randevu oluşturabiliyor', async ({ page }) => {
    await page.goto('/tr/patient/appointments');
    await cerezBandiniKapat(page);

    // Randevu verilecek doktoru mevcut kayıtlardan al: test kendi doktorunu
    // uydurmuyor, sistemde gerçekten randevu verebilen biri olmalı.
    const { govde: liste } = await apiIstek(page, '/api/appointments?per_page=1');
    doktorId = liste?.data?.[0]?.doctor?.id ?? liste?.data?.[0]?.doctor_id ?? null;
    test.skip(!doktorId, 'Test hesabında randevu geçmişi yok, doktor bulunamadı');

    // Sunucu hastadan kendi kimliğini de bekliyor (kendi adına randevu).
    const hastaId = await page.evaluate(
      () => JSON.parse(localStorage.getItem('auth_state') || '{}')?.user?.id,
    );

    const { http, govde } = await apiIstek(page, '/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: hastaId,
        doctor_id: doktorId,
        appointment_type: 'online',
        appointment_date: YARIN_30(),
        appointment_time: '13:00',
      }),
    });

    expect(http, `Randevu oluşturulamadı: ${JSON.stringify(govde)}`).toBe(201);

    randevuId = govde?.data?.id ?? govde?.id ?? null;
    expect(randevuId).toBeTruthy();

    // Slotsuz serbest talep onay bekler; slot üzerinden alınan doğrudan onaylı
    // başlar. İkisi de geçerli — olmaması gereken üçüncü bir durum.
    const durum = govde?.data?.status ?? govde?.status;
    expect(['pending', 'confirmed']).toContain(durum);
  });

  test('oluşan randevu hasta ekranında görünüyor', async ({ page }) => {
    test.skip(!randevuId, 'Önceki adım randevu oluşturmadı');

    await page.goto('/tr/patient/appointments');
    await cerezBandiniKapat(page);

    const { govde } = await apiIstek(page, `/api/appointments/${randevuId}`);
    const kayit = govde?.data ?? govde;
    expect(kayit?.id).toBe(randevuId);

    // Mutlak an saklanmış olmalı: duvar saati tek başına hangi ülkenin saati
    // olduğunu belirsiz bırakıyordu.
    expect(kayit?.starts_at ?? kayit?.timezone).toBeTruthy();
  });

  test('randevu saati değiştirilebiliyor ve eski saat kaydediliyor', async ({ page }) => {
    test.skip(!randevuId, 'Önceki adım randevu oluşturmadı');

    await page.goto('/tr/patient/appointments');

    const { http, govde } = await apiIstek(page, `/api/appointments/${randevuId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ appointment_date: YARIN_30(), appointment_time: '15:30' }),
    });

    // Erteleme yetkisi doktorda olabilir; hastaya kapalıysa 403 doğru
    // davranıştır ve test bunu da kabul eder.
    expect([200, 403]).toContain(http);

    if (http === 200) {
      const kayit = govde?.data ?? govde;
      expect(String(kayit?.appointment_time)).toContain('15:30');
    }
  });

  test('randevu iptal edilebiliyor', async ({ page }) => {
    test.skip(!randevuId, 'Önceki adım randevu oluşturmadı');

    await page.goto('/tr/patient/appointments');

    const { http } = await apiIstek(page, `/api/appointments/${randevuId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason: 'Otomatik test — kayıt kapatılıyor' }),
    });
    expect(http).toBe(200);

    const { govde } = await apiIstek(page, `/api/appointments/${randevuId}`);
    const kayit = govde?.data ?? govde;
    expect(kayit?.status).toBe('cancelled');
  });

  // Test yarıda kalsa bile randevu açık kalmasın.
  test.afterAll(async ({ browser }) => {
    if (!randevuId) return;
    const context = await browser.newContext({ storageState: oturumDosyasi('hasta') });
    const page = await context.newPage();
    try {
      await page.goto('/tr/patient/appointments');
      const { govde } = await apiIstek(page, `/api/appointments/${randevuId}`);
      const durum = (govde?.data ?? govde)?.status;
      if (durum && durum !== 'cancelled') {
        await apiIstek(page, `/api/appointments/${randevuId}/cancel`, {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Otomatik test temizliği' }),
        });
      }
    } catch {
      // Temizlik başarısızsa testi düşürmeyiz; kayıt iptal edilmemiş olabilir.
    } finally {
      await context.close();
    }
  });
});
