import ForClinicsPage from '@/screens/ForClinicsPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/for-clinics',
    title: { tr: 'Klinikler İçin', en: 'For Clinics' },
    description: {
      tr: 'Kliniğinizi MedaGama ile büyütün: hasta yönetimi, randevu takvimi, CRM ve dijital tanıtım araçları tek bir platformda.',
      en: 'Grow your clinic with MedaGama: patient management, appointment calendar, CRM and digital marketing tools in one platform.',
    },
  });
}

export default function Page() {
  return <ForClinicsPage />;
}
