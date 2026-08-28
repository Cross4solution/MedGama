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

// Listedeki her sayfa bir zamanlar KIRIKTI ve ölçülüp düzeltildi. Kalan 64
// rota ayrıca tarandı ve temiz çıktı; onlar buraya alınmadı, çünkü hiç
// kırılmamış bir sayfayı sürekli sınamak koşu süresini uzatır ve karşılığında
// bir şey öğretmez. Yeni bir taşma bulunursa sayfası buraya eklenir.
const SAYFALAR = [
  { yol: '/admin/reviews',    oturum: 'yonetici' },   // süzgeç satırı, 310px
  { yol: '/admin/users',      oturum: 'yonetici' },   // sekme satırı, 113px
  { yol: '/admin/catalog',    oturum: 'yonetici' },   // sekme satırı, 5px
  { yol: '/admin/moderation', oturum: 'yonetici' },   // süzgeç satırı, 160px
  { yol: '/admin/verification', oturum: 'yonetici' }, // süzgeç satırı, 320px'te 5px
  { yol: '/admin/audit-logs', oturum: 'yonetici' },   // tarih aralığı, 320px'te 8px
  { yol: '/crm/billing',      oturum: 'klinik' },     // durum süzgeci kırpılıyordu
  { yol: '/crm/appointments', oturum: 'klinik' },     // takvim araç çubuğu, 320px'te 3px
  { yol: '/crm/revenue',      oturum: 'klinik' },     // dönem seçici, 320px'te 54px
  { yol: '/doctor/appointments', oturum: 'demoDoktor' }, // eylem sütunu ekran dışıydı
  { yol: '/doctor/billing',   oturum: 'doktor' },     // başlık ve süzgeç çubuğu
  { yol: '/settings',         oturum: 'hasta' },      // takvim bağlantısı + "Kopyala"
  { yol: '/medstream',        oturum: null },
  { yol: '/login',            oturum: null },
];

// 375 px yaygın telefon; 320 px hem eski küçük telefonlar hem de WCAG
// 1.4.10'un istediği yeniden akma genişliği (metni büyüten kullanıcı
// efektif olarak buraya iner).
const GENISLIKLER = [375, 320];

for (const { yol, oturum } of SAYFALAR) {
  for (const genislikPx of GENISLIKLER) {
  test.describe(`${yol}${oturum ? ` (${oturum})` : ''} @${genislikPx}px`, () => {
    // Cihaz tanımının tamamı yayılamıyor: içindeki `defaultBrowserType`
    // describe içinde yeni bir işçi zorluyor ve Playwright reddediyor.
    // Ölçüm için gereken alanlar bunlar.
    test.use({
      viewport: { width: genislikPx, height: TELEFON.viewport.height },
      userAgent: TELEFON.userAgent,
      deviceScaleFactor: TELEFON.deviceScaleFactor,
      isMobile: TELEFON.isMobile,
      hasTouch: TELEFON.hasTouch,
      storageState: oturum ? oturumDosyasi(oturum) : undefined,
    });

    test('telefonda yana kaymıyor', async ({ page }) => {
      // Geliştirme sunucusu bir rotayı ilk kez derlerken dakikalar
      // alabiliyor ve varsayılan 90 sn'lik sınır ölçüm yapılmadan doluyor —
      // düzen hatası olmadığı hâlde test kırmızıya dönüyordu.
      test.setTimeout(300_000);

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
        // Yatay kaydırılabilir şerit (sekme/süzgeç kaydırması) İÇİNDEKİ
        // düğme ekranı aşabilir — kullanıcı şeridi kaydırıp ulaşır. Kırpan
        // (`hidden`) kapsayıcı ise ulaşılamaz kılar, o yüzden sayılır.
        const kaydirilabilirIcinde = (e) => {
          for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
            const o = getComputedStyle(a).overflowX;
            if (o === 'auto' || o === 'scroll') return true;
          }
          return false;
        };

        const ulasilamayan = [];
        for (const e of document.querySelectorAll('button, a[href], [role="button"]')) {
          const r = e.getBoundingClientRect();
          const bicem = getComputedStyle(e);
          if (r.width === 0 || bicem.display === 'none' || bicem.visibility === 'hidden') continue;
          if (r.left >= genislik || r.right <= genislik + 2) continue;
          if (kaydirilabilirIcinde(e)) continue;
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
}
