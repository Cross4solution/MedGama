import ForPatientsPage from '@/screens/ForPatientsPage';

export const metadata = {
  title: 'Hastalar İçin',
  description:
    'MedaGama ile uzman doktor bulun, online randevu alın, telehealth görüşmesi yapın ve sağlık yolculuğunuzu tek bir yerden yönetin.',
  alternates: { canonical: '/for-patients' },
  openGraph: {
    title: 'Hastalar İçin | MedaGama',
    description:
      'Uzman doktor bulun, online randevu alın ve telehealth görüşmesi yapın.',
    url: '/for-patients',
    type: 'website',
  },
};

export default function Page() {
  return <ForPatientsPage />;
}
