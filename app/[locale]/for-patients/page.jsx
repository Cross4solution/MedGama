import ForPatientsPage from '@/screens/ForPatientsPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/for-patients',
    title: { tr: 'Hastalar İçin', en: 'For Patients' },
    description: {
      tr: 'MedaGama ile uzman doktor bulun, online randevu alın, telehealth görüşmesi yapın ve sağlık yolculuğunuzu tek bir yerden yönetin.',
      en: 'Find expert doctors, book appointments online, have telehealth consultations and manage your health journey in one place with MedaGama.',
    },
  });
}

export default function Page() {
  return <ForPatientsPage />;
}
