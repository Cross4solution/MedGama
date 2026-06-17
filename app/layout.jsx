import '@/assets/index.css';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import Providers from './providers';
import Analytics from './Analytics';
import { DEFAULT_LOCALE, isLocale, isRtl } from '@/lib/locales';

// Self-hosted Inter with font-display: swap (Core Web Vitals: no render-block,
// no FOIT). variable exposes --font-inter; className applies Inter to <body>.
// Existing Tailwind/CSS Inter references stay valid — same family, now swap.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://medagama.com';

// Root metadata (sayfa bazlı generateMetadata bunları override eder)
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MedaGama — Dijital Sağlık ve Randevu Platformu',
    template: '%s | MedaGama',
  },
  description:
    'Uzman doktorlar, güvenli telehealth ve modern tedavi yöntemleri tek bir platformda. Randevu al, yorumları oku, sağlık turizmi planla.',
  applicationName: 'MedaGama',
  authors: [{ name: 'MedaGama' }],
  robots: { index: true, follow: true },
  // Search Console doğrulaması — env set edilince <meta name="google-site-verification">
  // otomatik eklenir; env yoksa hiçbir meta eklenmez.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
};

// <html lang>/dir locale'e göre. Locale'i middleware'in set ettiği 'x-locale'
// header'ından okuyoruz (root layout [locale] segmentine erişemez).
// SiteChrome artık app/[locale]/layout.jsx içinde — burada sadece global kabuk.
export default async function RootLayout({ children }) {
  const h = await headers();
  const hdr = h.get('x-locale');
  const locale = isLocale(hdr) ? hdr : DEFAULT_LOCALE;
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={inter.variable}>
      <body className={inter.className}>
        <Providers>
          {children}
          {/* GA4 — consent-aware. CookieConsentProvider altında ki izni okuyabilsin.
              Suspense: useSearchParams CSR bailout gerektirir. */}
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
