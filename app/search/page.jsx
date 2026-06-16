import SearchResults from '@/screens/SearchResults';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'Doktor ve Klinik Ara',
  description:
    'Uzmanlık, şehir ve dile göre doktor ve klinik arayın. Yorumları okuyun, uygunluğu görün ve hemen randevu alın.',
  alternates: altLanguages('/search'),
  openGraph: {
    title: 'Doktor ve Klinik Ara | MedaGama',
    description: 'Uzmanlık, şehir ve dile göre doktor ve klinik arayın.',
    url: '/search',
    type: 'website',
  },
};

export default function Page() {
  return <SearchResults />;
}
