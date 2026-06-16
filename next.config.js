/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_ORIGIN || 'https://medagama-backend.onrender.com';

const nextConfig = {
  reactStrictMode: true,
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
