// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Uçtan uca testler — gerçek tarayıcıda, gerçek akışlar.
 *
 * Varsayılan hedef canlı ortam: arayüz Vercel'de, API aynı adres üzerinden
 * backend'e yönleniyor; yani testler kullanıcının gördüğü sistemin aynısını
 * çalıştırır. Yerelde denemek için:  E2E_BASE_URL=http://localhost:3000
 *
 * Testler VERİ ÜRETMEZ: randevu oluşturmaz, görüşmeye katılmaz, kayıt açmaz.
 * Demo hesaplarla giriş yapıp ekranların doğru davrandığını doğrularlar —
 * böylece canlı veriyi kirletmeden her an çalıştırılabilirler.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },

  // Oturumlar bir kez alınır; testler onu paylaşır (giriş hız sınırına takılmasın).
  globalSetup: require.resolve('./tests/e2e/kurulum.js'),

  // Canlıya karşı koşuyoruz: tek işçi hem sunucuyu yormaz hem hız sınırından korur.
  workers: 1,
  fullyParallel: false,
  retries: 1,

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://med-gama.vercel.app',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // Kamera/mikrofon izni burada DEĞİL, chromium projesinde.
    //
    // Firefox `camera` iznini tanımıyor ve genel `use` içinde durduğunda her
    // firefox testi daha bağlam açılırken düşüyor: "Unknown permission: camera".
    // Ölçüldü — beş testin beşi de bu yüzden kırmızıydı, tarayıcı uyumsuzluğu
    // sanılabilirdi.
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Görüşme hazırlık ekranı kamera/mikrofon istiyor; yalnız bu motorda
        // gerekiyor çünkü oturum gerektiren testler burada koşuyor.
        permissions: ['camera', 'microphone'],
        launchOptions: {
          args: [
            // Gerçek donanım yerine sahte kamera/mikrofon: görüşme ekranı
            // test ortamında da açılabilsin.
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
      },
    },

    // Safari ve Firefox: YALNIZ herkese açık sayfalar.
    //
    // Oturum kurulumu (`kurulum.js`) parolayla giriş yapıyor ve her motor için
    // ayrı bir giriş turu, arka ucun hız sınırını tetikliyor — ölçüldü, 429.
    // Bu yüzden bu iki motor `genel-*.spec.js` dosyalarıyla sınırlı; oturum
    // gerektiren her şey chromium'da koşuyor.
    //
    // Kamera/mikrofon bayrağı yok: ikisinde de karşılığı yok, görüşme ekranı
    // zaten oturum arkasında.
    {
      name: 'webkit',
      testMatch: /genel-.*\.spec\.js/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      testMatch: /genel-.*\.spec\.js/,
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
