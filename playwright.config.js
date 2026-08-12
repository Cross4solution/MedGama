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
    // Kamera/mikrofon izni: görüşme hazırlık ekranı bunu istiyor.
    permissions: ['camera', 'microphone'],
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
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
  ],
});
