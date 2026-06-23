import SearchResults from '@/screens/SearchResults';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/search',
    title: { tr: 'Doktor ve Klinik Ara', en: 'Find Doctors & Clinics' },
    description: {
      tr: 'Uzmanlık, şehir ve dile göre doktor ve klinik arayın. Yorumları okuyun, uygunluğu görün ve hemen randevu alın.',
      en: 'Search doctors and clinics by specialty, city and language. Read reviews, check availability and book instantly.',
    },
  });
}

export default function Page() {
  return <SearchResults />;
}
