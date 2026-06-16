import AboutPage from '@/screens/AboutPage';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'Hakkımızda',
  description:
    'MedaGama; uzman doktorları, klinikleri ve hastaları güvenli ve modern bir dijital sağlık platformunda buluşturur. Misyonumuzu ve değerlerimizi keşfedin.',
  alternates: altLanguages('/about'),
  openGraph: {
    title: 'Hakkımızda | MedaGama',
    description:
      'MedaGama; uzman doktorları, klinikleri ve hastaları güvenli ve modern bir dijital sağlık platformunda buluşturur.',
    url: '/about',
    type: 'website',
  },
};

export default function Page() {
  return <AboutPage />;
}
