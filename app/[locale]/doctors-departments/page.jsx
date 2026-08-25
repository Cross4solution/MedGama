import DoctorsDepartments from '@/screens/DoctorsDepartments';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/doctors-departments',
    title: { tr: 'Doktorlar ve Bölümler', en: 'Doctors & Departments' },
    description: {
      tr: 'Medagama’daki tüm tıbbi bölümleri ve uzman doktorları keşfedin. Kardiyoloji, göz, diş, ortopedi ve daha fazlası.',
      en: 'Explore all medical departments and expert doctors on Medagama — cardiology, ophthalmology, dentistry, orthopedics and more.',
    },
    // Ekran hiçbir API'ye bağlanmıyor: gösterdiği doktorlar, puanlar (4.8 / 210
    // yorum) ve fiyatlar (800₺, 1200₺) uydurma. Üstveri ise sayfayı gerçek bir
    // dizin gibi tanıtıyor. Gerçek veriye bağlanana kadar arama motorlarına
    // sunulmuyor; site haritasından da çıkarıldı.
    robots: { index: false, follow: true },
  });
}

export default function Page() {
  return <DoctorsDepartments />;
}
