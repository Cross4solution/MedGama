import AboutPage from '@/screens/AboutPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/about',
    title: { tr: 'Hakkımızda', en: 'About Us' },
    description: {
      tr: 'MedaGama; uzman doktorları, klinikleri ve hastaları güvenli ve modern bir dijital sağlık platformunda buluşturur. Misyonumuzu ve değerlerimizi keşfedin.',
      en: 'MedaGama connects expert doctors, clinics and patients on a secure, modern digital health platform. Discover our mission and values.',
    },
  });
}

export default function Page() {
  return <AboutPage />;
}
