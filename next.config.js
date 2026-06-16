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

const nextConfig = {
  reactStrictMode: true,
  env: CRA_ENV,
  // CRA ile aynı backend'e proxy: /api ve /storage Render backend'e gider
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/storage/:path*', destination: `${BACKEND}/storage/:path*` },
      // CRA'daki /500 rotası App Router'da rezerve isim (pages/500.html ile çakışıyor).
      // Aynı sayfayı /server-error altından servis et, /500 URL'i korunur.
      { source: '/500', destination: '/server-error' },
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
};

module.exports = nextConfig;
