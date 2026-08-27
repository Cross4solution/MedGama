// Dar telefonda hiçbir sayfa YANA KAYMAMALI.
//
// Ölçüldüğünde üç yönetici ekranı kayıyordu: /admin/reviews 310 px,
// /admin/users 113 px, /admin/catalog 5 px. Sebep hepsinde aynıydı —
// sekme/süzgeç düğmeleri tek satırda duruyor, sarmalanmıyor, kaydırma
// kutusunda da değil.
//
// Yana kayan sayfanın iki bedeli var ve ikincisi daha sinsi:
//
//   1. Kullanıcı içeriği görmek için yatay sürüklemek zorunda kalıyor.
//   2. `position: fixed` öğeler ARTIK GENİŞ olan düzen alanına göre
//      konumlanıyor. /admin/users'ta sağ alttaki eylem düğmesi 464 px'e
//      düşüyordu — 375 px'lik ekranın tümüyle dışına.
//
// İkincisi kaymayı kendi başına görünmez kılıyor: düğme yok, ama sayfa
// "çalışıyor" gibi duruyor.
//
// Ölçüt taşan öğeyi de yazdırıyor; kırmızıya döndüğünde hangi satırın
// taşırdığı raporda duruyor, aramaya gerek kalmıyor.
const fs = require('node:fs');
const { test, expect, devices } = require('@playwright/test');
const { oturumDosyasi } = require('./yardimcilar');

const TELEFON = devices['iPhone 13 Mini'];

// Playwright tanımadığı cihaz adı için `undefined` döndürüyor ve context
// sessizce 1280 px masaüstüne düşüyor — ölçüm o hâlde her sayfayı temiz
// gösterir. Ad yanlış yazılırsa burada patlasın.
test.beforeAll(() => {
  expect(TELEFON, 'cihaz tanımı bulunamadı; ölçüm masaüstüne düşerdi').toBeTruthy();
  expect(TELEFON.viewport.width).toBeLessThan(400);
});

const SAYFALAR = [
  { yol: '/admin/reviews',  oturum: 'yonetici' },
  { yol: '/admin/users',    oturum: 'yonetici' },
  { yol: '/admin/catalog',  oturum: 'yonetici' },
  { yol: '/crm/billing',    oturum: 'klinik' },
  { yol: '/crm/appointments', oturum: 'klinik' },
  { yol: '/doctor/appointments', oturum: 'demoDoktor' },
  { yol: '/medstream',      oturum: null },
  { yol: '/login',          oturum: null },
];

for (const { yol, oturum } of SAYFALAR) {
  test.describe(`${yol}${oturum ? ` (${oturum})` : ''}`, () => {
    // Cihaz tanımının tamamı yayılamıyor: içindeki `defaultBrowserType`
    // describe içinde yeni bir işçi zorluyor ve Playwright reddediyor.
    // Ölçüm için gereken alanlar bunlar.
    test.use({
      viewport: TELEFON.viewport,
      userAgent: TELEFON.userAgent,
      deviceScaleFactor: TELEFON.deviceScaleFactor,
      isMobile: TELEFON.isMobile,
      hasTouch: TELEFON.hasTouch,
      storageState: oturum ? oturumDosyasi(oturum) : undefined,
    });

    test('telefonda yana kaymıyor', async ({ page }) => {
      // Yönetici oturumu ortam değişkeni gerektiriyor; verilmediğinde
      // paketin geri kalanı gibi bu da atlanır (bkz. genis-tarama.spec.js).
      //
      // Dosyanın VARLIĞINA bakmak yetmiyor: önceki koşulardan kalan eski bir
      // oturum dosyası duruyor olabilir. O dosyayla sayfa girişe yönleniyor,
      // giriş formu dar ekranda zaten temiz ve ölçüt SAHTE YEŞİL veriyor —
      // ölçüldü, üç yönetici ekranı böyle "geçiyordu".
      if (oturum === 'yonetici' && !process.env.E2E_ADMIN_EMAIL) {
        test.skip(true, 'E2E_ADMIN_EMAIL tanımlı değil; yönetici oturumu güvenilir değil.');
      }
      if (oturum && !fs.existsSync(oturumDosyasi(oturum))) {
        test.skip(true, `Oturum yok: ${oturum}`);
      }

      await page.goto(yol, { waitUntil: 'domcontentloaded' });

      // Sabit bekleme yetmiyor: geliştirme sunucusu bir rotayı ilk kez
      // derlerken 30 sn'yi aşabiliyor ve ölçüm boş iskelet üzerinde
      // yapılıyor — sayfa o hâlde her zaman "temiz" görünür. Ölçümü
      // içeriğin gerçekten çizilmesine bağlıyoruz.
      await page.locator('button, a[href]').first().waitFor({ timeout: 90000 });
      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(800);

      // Oturum düşerse sayfa girişe yönleniyor ve giriş formu dar ekranda
      // zaten temiz — ölçüt SAHTE YEŞİL verir. Ölçtüğümüz şeyin istediğimiz
      // sayfa olduğunu doğruluyoruz.
      expect(
        new URL(page.url()).pathname,
        `${yol} yerine ${page.url()} açıldı — oturum düşmüş olabilir; `
        + 'bu hâlde ölçüm bir şey kanıtlamaz.',
      ).toContain(yol);

      const olcum = await page.evaluate(() => {
        const genislik = document.documentElement.clientWidth;
        const kayma = document.documentElement.scrollWidth - genislik;

        // Taşıran öğe: sağ kenarı ekranı geçen ama ATASI geçmeyen — yani
        // zincirin en dışındaki suçlu. Yatay kaydırma kutusu içindekiler
        // (tablo, vitrin) tasarım gereği geniştir, sayılmaz.
        const kaydirmaliIcinde = (e) => {
          for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
            const o = getComputedStyle(a).overflowX;
            if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
          }
          return false;
        };

        const suclular = [];
        for (const e of document.querySelectorAll('body *')) {
          const r = e.getBoundingClientRect();
          if (r.width === 0 || r.right <= genislik + 2 || kaydirmaliIcinde(e)) continue;
          const ata = e.parentElement;
          if (ata && ata !== document.body && ata.getBoundingClientRect().right > genislik + 2) continue;
          suclular.push(`<${e.tagName.toLowerCase()}> +${Math.round(r.right - genislik)}px `
            + `.${(e.className || '').toString().slice(0, 80)} `
            + `"${(e.textContent || '').trim().slice(0, 40)}"`);
        }

        // Sayfa kaymasının YAKALAYAMADIĞI durum: gövdede `overflow-x: hidden`
        // varken taşan içerik kırpılıyor. Kayma 0 çıkıyor, ama düğme ekranın
        // dışında ve tıklanamaz durumda. Hekim randevu ekranında tam olarak
        // bu oluyordu: "Takvime Ekle" 435 px'te, ekran 375 px.
        const ulasilamayan = [];
        for (const e of document.querySelectorAll('button, a[href], [role="button"]')) {
          const r = e.getBoundingClientRect();
          const bicem = getComputedStyle(e);
          if (r.width === 0 || bicem.display === 'none' || bicem.visibility === 'hidden') continue;
          if (r.left >= genislik || r.right <= genislik + 2) continue;
          ulasilamayan.push(`"${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}" sağ=${Math.round(r.right)}`);
        }

        return { kayma, suclular: suclular.slice(0, 3), ulasilamayan: ulasilamayan.slice(0, 5), genislik };
      });

      expect(
        olcum.kayma,
        `Sayfa ${olcum.kayma}px yana kayıyor. Taşıran öğeler:\n  `
        + (olcum.suclular.join('\n  ') || '(bulunamadı — sabit genişlik ya da negatif kenar boşluğu olabilir)')
        + '\n\nÇoğu durumda çözüm, tek satırda duran düğme/sekme grubuna '
        + '`flex-wrap` vermek ya da geniş içeriği `overflow-x-auto` bir '
        + 'kutuya almak.',
      ).toBeLessThanOrEqual(2);

      expect(
        olcum.ulasilamayan,
        `Bu düğmeler ${olcum.genislik}px ekranın sağ kenarını aşıyor. Gövde `
        + 'taşmayı kırptığı için sayfa yana kaymıyor — yani hiçbir görsel '
        + 'işaret yok, düğme yalnızca ulaşılamıyor:\n  '
        + olcum.ulasilamayan.join('\n  '),
      ).toEqual([]);
    });
  });
}
