// Açılır pencereler dar telefonda ULAŞILABİLİR olmalı.
//
// Sayfa taraması pencereleri göremiyor: kapalıyken ağaçta yoklar, açıkken
// sayfayı kaydırmazlar. Yani bir pencere ekranın dışına taşsa bile
// `mobil-yatay-kayma.spec.js` yeşil kalır. Ölçüldüğünde bu boşlukta iki
// gerçek hata çıkmıştı — hasta telefondan belge yükleyemiyor, hekim fatura
// kalemi giremiyordu — ve ikisi de tam olarak bu yüzden görünmüyordu.
//
// Bu ölçüt üç şeyi arıyor:
//   1. Pencere panelinin ekran dışına taşması.
//   2. Ekrandan uzun olup KAYDIRILAMAMASI — alttaki "Kaydet" ulaşılamaz olur.
//   3. Pencere içindeki bir denetimin sağ kenarı geçmesi (kırpılır).
//
// Ölçülen şey her zaman PANEL'dir, arka plan örtüsü değil: örtü
// (`.fixed.inset-0`) her zaman ekran boyundadır ve onu ölçmek her sonucu
// "temiz" gösterir. Bu tuzağa bir kez düşüldü; seçici bu yüzden yalnız
// `[role="dialog"]` üzerinden gidiyor.
const fs = require('node:fs');
const { test, expect, devices } = require('@playwright/test');
const { oturumDosyasi } = require('./yardimcilar');

const TELEFON = devices['iPhone 13 Mini'];

test.beforeAll(() => {
  expect(TELEFON, 'cihaz tanımı bulunamadı; ölçüm masaüstüne düşerdi').toBeTruthy();
  expect(TELEFON.viewport.width).toBeLessThan(400);
});

// Tarama ile ulaşılabilen ve gerçekten açılan pencereler. Tetikleyici metni
// Türkçe arayüzden; yeni bir pencere ölçülebilir hâle gelince buraya eklenir.
const PENCERELER = [
  { yol: '/medical-archive',     oturum: 'hasta',      dugme: 'Yükle' },
  { yol: '/doctor/billing',      oturum: 'doktor',     dugme: 'Yeni Fatura' },
  { yol: '/crm/appointments',    oturum: 'klinik',     dugme: 'Yeni Randevu' },
  { yol: '/crm/billing',         oturum: 'klinik',     dugme: 'Fatura' },
  { yol: '/crm/documents',       oturum: 'klinik',     dugme: 'Döküman Yükle' },
  { yol: '/crm/staff',           oturum: 'klinik',     dugme: 'Yeni Doktor Ekle' },
  { yol: '/crm/messages',        oturum: 'klinik',     dugme: 'Yeni Mesaj' },
  { yol: '/crm/branches',        oturum: 'klinik',     dugme: 'Şube Ekle' },
  { yol: '/crm/leads',           oturum: 'klinik',     dugme: 'Yeni Lead' },
  { yol: '/clinic/team',         oturum: 'klinik',     dugme: 'Doktor Ekle' },
  { yol: '/admin/announcements', oturum: 'yonetici',   dugme: 'Yeni Duyuru' },
];

const GENISLIKLER = [375, 320];

for (const { yol, oturum, dugme } of PENCERELER) {
  for (const genislikPx of GENISLIKLER) {
    test.describe(`${yol} · "${dugme}" @${genislikPx}px`, () => {
      test.use({
        viewport: { width: genislikPx, height: TELEFON.viewport.height },
        userAgent: TELEFON.userAgent,
        deviceScaleFactor: TELEFON.deviceScaleFactor,
        isMobile: TELEFON.isMobile,
        hasTouch: TELEFON.hasTouch,
        storageState: oturum ? oturumDosyasi(oturum) : undefined,
      });

      test('pencere ekrana sığıyor ve denetimlerine ulaşılıyor', async ({ page }) => {
        test.setTimeout(300_000);

        if (oturum === 'yonetici' && !process.env.E2E_ADMIN_EMAIL) {
          test.skip(true, 'E2E_ADMIN_EMAIL tanımlı değil; yönetici oturumu güvenilir değil.');
        }
        if (oturum && !fs.existsSync(oturumDosyasi(oturum))) {
          test.skip(true, `Oturum yok: ${oturum}`);
        }

        await page.goto(yol, { waitUntil: 'domcontentloaded' });
        await page.locator('button, a[href]').first().waitFor({ timeout: 90000 });
        await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {});
        await page.waitForTimeout(1500);

        // Oturum düşerse giriş sayfası açılır, tetikleyici bulunmaz ve test
        // "atlandı" gibi görünür. Ölçtüğümüz sayfayı doğruluyoruz.
        expect(
          new URL(page.url()).pathname,
          `${yol} yerine ${page.url()} açıldı — oturum düşmüş olabilir.`,
        ).toContain(yol);

        const tetikleyici = page.locator('button, [role="button"]')
          .filter({ hasText: dugme }).first();

        // Düğme yoksa ölçüm yapılmamıştır; sessizce geçmesin.
        await expect(
          tetikleyici,
          `"${dugme}" tetikleyicisi bulunamadı — pencere hiç açılmadı, `
          + 'ölçüm bir şey kanıtlamaz.',
        ).toBeVisible({ timeout: 30000 });

        await tetikleyici.click();
        await page.waitForTimeout(900);

        const olcum = await page.evaluate(() => {
          const genislik = document.documentElement.clientWidth;
          const yukseklik = document.documentElement.clientHeight;

          const gorunur = (e) => {
            const s = getComputedStyle(e);
            if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
            const b = e.getBoundingClientRect();
            return b.width >= 80 && b.height >= 60;
          };

          // YALNIZ panel. Arka plan örtüsü her zaman ekran boyundadır ve
          // ölçülürse sonuç kaçınılmaz olarak "temiz" çıkar.
          const adaylar = [...document.querySelectorAll('[role="dialog"]')].filter(gorunur);
          if (!adaylar.length) return { yok: true };

          const pencere = adaylar.sort((a, b) => {
            const ab = a.getBoundingClientRect(); const bb = b.getBoundingClientRect();
            return (bb.width * bb.height) - (ab.width * ab.height);
          })[0];

          const r = pencere.getBoundingClientRect();
          const sorunlar = [];

          if (r.right > genislik + 2) sorunlar.push(`panel ${Math.round(r.right - genislik)}px sağa taşıyor`);
          if (r.left < -2) sorunlar.push(`panel ${Math.round(-r.left)}px sola taşıyor`);

          // Ekrandan uzun bir pencere kaydırılamıyorsa alt kısmına — yani
          // genelde "Kaydet" düğmesine — hiçbir şekilde ulaşılamaz.
          if (r.height > yukseklik + 2) {
            const icerik = pencere.querySelector('[class*="overflow-y"]') || pencere;
            const o = getComputedStyle(icerik).overflowY;
            if (o !== 'auto' && o !== 'scroll') {
              sorunlar.push(`ekrandan ${Math.round(r.height - yukseklik)}px uzun ve kaydırılamıyor`);
            }
          }

          for (const e of pencere.querySelectorAll('button, a[href], input, select, textarea')) {
            const er = e.getBoundingClientRect();
            const s = getComputedStyle(e);
            if (!er.width || s.display === 'none' || s.visibility === 'hidden') continue;
            if (er.left >= genislik || er.right <= genislik + 2) continue;
            const ad = (e.textContent || e.getAttribute('aria-label') || e.type || '').trim().slice(0, 24);
            sorunlar.push(`"${ad}" sağ kenarı ${Math.round(er.right)} (ekran ${genislik})`);
          }

          return { olcu: `${Math.round(r.width)}×${Math.round(r.height)}`, sorunlar };
        });

        expect(olcum.yok, `"${dugme}" tıklandı ama pencere açılmadı.`).toBeFalsy();
        expect(
          olcum.sorunlar,
          `${yol} penceresi (${olcum.olcu}) ${genislikPx}px ekranda kullanılamıyor.`,
        ).toEqual([]);
      });
    });
  }
}
