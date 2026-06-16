import '@/assets/index.css';
import Providers from './providers';

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

// TR ana pazar — locale routing Faz 3'te eklenince dinamikleşecek
export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
