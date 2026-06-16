import '@/assets/index.css';
import { headers } from 'next/headers';
import Providers from './providers';
import { DEFAULT_LOCALE, isLocale, isRtl } from '@/lib/locales';

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
    <html lang={locale} dir={dir}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
