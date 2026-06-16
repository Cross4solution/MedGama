/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_ORIGIN || 'https://medagama-backend.onrender.com';

const nextConfig = {
  reactStrictMode: true,
  // CRA ile aynı backend'e proxy: /api ve /storage Render backend'e gider
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/storage/:path*', destination: `${BACKEND}/storage/:path*` },
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
