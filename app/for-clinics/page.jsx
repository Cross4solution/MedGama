import ForClinicsPage from '@/screens/ForClinicsPage';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'Klinikler İçin',
  description:
    'Kliniğinizi MedaGama ile büyütün: hasta yönetimi, randevu takvimi, CRM ve dijital tanıtım araçları tek bir platformda.',
  alternates: altLanguages('/for-clinics'),
  openGraph: {
    title: 'Klinikler İçin | MedaGama',
    description:
      'Hasta yönetimi, randevu takvimi ve CRM araçlarıyla kliniğinizi büyütün.',
    url: '/for-clinics',
    type: 'website',
  },
};

export default function Page() {
  return <ForClinicsPage />;
}
