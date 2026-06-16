import DoctorsDepartments from '@/screens/DoctorsDepartments';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'Doktorlar ve Bölümler',
  description:
    'MedaGama’daki tüm tıbbi bölümleri ve uzman doktorları keşfedin. Kardiyoloji, göz, diş, ortopedi ve daha fazlası.',
  alternates: altLanguages('/doctors-departments'),
  openGraph: {
    title: 'Doktorlar ve Bölümler | MedaGama',
    description: 'Tüm tıbbi bölümleri ve uzman doktorları keşfedin.',
    url: '/doctors-departments',
    type: 'website',
  },
};

export default function Page() {
  return <DoctorsDepartments />;
}
