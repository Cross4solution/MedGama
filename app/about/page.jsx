import AboutPage from '@/screens/AboutPage';

export const metadata = {
  title: 'Hakkımızda',
  description:
    'MedaGama; uzman doktorları, klinikleri ve hastaları güvenli ve modern bir dijital sağlık platformunda buluşturur. Misyonumuzu ve değerlerimizi keşfedin.',
  alternates: { canonical: '/about' },
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
