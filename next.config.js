/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_ORIGIN || 'https://medagama-backend.onrender.com';

// CRA env uyumluluğu: kod hâlâ process.env.REACT_APP_* kullanıyor. Next bunları
// client'a vermez (sadece NEXT_PUBLIC_*). Aşağıdaki env bloğu bu değişkenleri
// build anında bundle'a inler → mevcut kod değişmeden çalışır. Vercel'de aynı
// REACT_APP_* isimleriyle set edilmeli.
const CRA_ENV = [
  'REACT_APP_API_BASE',
  'REACT_APP_API_LOGIN_GOOGLE',
  'REACT_APP_API_ME',
  'REACT_APP_API_SEND_OTP',
  'REACT_APP_API_VERIFY_OTP',
  'REACT_APP_GOOGLE_CLIENT_ID',
  'REACT_APP_MAPBOX_ACCESS_TOKEN',
  'REACT_APP_PUSHER_APP_KEY',
  'REACT_APP_PUSHER_CLUSTER',
  'REACT_APP_REVERB_APP_KEY',
  'REACT_APP_REVERB_HOST',
  'REACT_APP_REVERB_PORT',
  'REACT_APP_SITE_URL',
].reduce((acc, k) => { acc[k] = process.env[k] || ''; return acc; }, {});

// NOT: NEXT_PUBLIC_GA_ID ve NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
// NEXT_PUBLIC_ prefix'i sayesinde Next tarafından otomatik client'a inlenir.
// CRA_ENV listesine eklemeye GEREK YOK (yalnızca REACT_APP_* için gerekiyor).
const nextConfig = {
  reactStrictMode: true,
  env: CRA_ENV,
  // Hangi teknolojiyi kullandığımızı yanıt başlığında ilan etmeye gerek yok.
  // Sürüme özgü açıkları arayan otomatik taramaların işini kolaylaştırıyor.
  poweredByHeader: false,
  // CRA ile aynı backend'e proxy: /api ve /storage Render backend'e gider
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/storage/:path*', destination: `${BACKEND}/storage/:path*` },
      // Kanal yetkilendirmesi. API_BASE "/api" olduğu için Echo authEndpoint'i
      // "/broadcasting/auth" olarak çözüyor; burada kural yoktu, istek Next'e düşüp
      // 404 dönüyordu. Kanala girilemediği için görüntülü görüşme sinyali hiç akmıyordu.
      { source: '/broadcasting/:path*', destination: `${BACKEND}/broadcasting/:path*` },
      // CRA'daki /500 rotası App Router'da rezerve isim (pages/500.html ile çakışıyor).
      // Aynı sayfayı /server-error altından servis et, /500 URL'i korunur.
      { source: '/500', destination: '/tr/server-error' },
    ];
  },
  // Mevcut görseller public/ altında — Next Image optimizasyonu opsiyonel, şimdilik unoptimized
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  eslint: {
    // Build sırasında lint hatası deploy'u kırmasın (CRA CI=false davranışı)
    ignoreDuringBuilds: true,
  },

  // İçerik Güvenlik Politikası — ÖNCE YALNIZCA İZLEME.
  //
  // CSP, tarayıcıya "kod ve içerik yalnızca şu kaynaklardan gelebilir" der ve
  // XSS'e karşı en güçlü katmandır: saldırgan sayfaya betik enjekte etse bile
  // tarayıcı çalıştırmaz.
  //
  // Ama yanlış yazılmış bir politika meşru şeyleri de keser — harita, video,
  // analitik, canlı bildirim. Bu yüzden `Report-Only` başlığıyla açılıyor:
  // tarayıcı HİÇBİR ŞEYİ engellemez, yalnızca "bu politika olsaydı şunu
  // keserdim" diye rapor gönderir. Raporlar birkaç gün izlenip politika
  // gerçek trafiğe göre düzeltildikten sonra engelleyici moda alınacak.
  async headers() {
    const politika = [
      "default-src 'self'",
      // Next.js kendi betiklerini satır içi yerleştiriyor; nonce'a geçilene
      // kadar unsafe-inline gerekli. Raporlar bunun ne kadar daraltılabileceğini
      // gösterecek.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://api.mapbox.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      // Görseller çok kaynaklı (klinik/doktor avatarları, bayraklar, yer
      // tutucular, arka uç depolama) — https geneli bilinçli.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Canlı bildirim ve görüntülü görüşme sinyali için soket bağlantısı.
      "connect-src 'self' https://www.google-analytics.com https://api.mapbox.com https://events.mapbox.com https://medagama-backend.onrender.com wss://57-128-27-244.sslip.io",
      // MedStream'de YouTube gömülü videolar var.
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      // Eklenti/nesne gömme tamamen kapalı — kullanılmıyor, saldırı yüzeyi.
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // upgrade-insecure-requests BİLEREK yok: izleme modunda tarayıcı onu
      // zaten yok sayıyor ve her sayfada konsola uyarı basıyor. Engelleyici
      // moda geçerken eklenecek.
      // İhlaller arka uçta toplanıyor (hız sınırlı, kırpılmış).
      'report-uri /api/csp-report',
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy-Report-Only', value: politika }],
      },
    ];
  },
};

module.exports = nextConfig;
