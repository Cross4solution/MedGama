import DoctorsDepartments from '@/screens/DoctorsDepartments';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/doctors-departments',
    title: { tr: 'Doktorlar ve Bölümler', en: 'Doctors & Departments' },
    description: {
      tr: 'MedaGama’daki tüm tıbbi bölümleri ve uzman doktorları keşfedin. Kardiyoloji, göz, diş, ortopedi ve daha fazlası.',
      en: 'Explore all medical departments and expert doctors on MedaGama — cardiology, ophthalmology, dentistry, orthopedics and more.',
    },
  });
}

export default function Page() {
  return <DoctorsDepartments />;
}
