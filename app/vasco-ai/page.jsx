import VascoAIPage from '@/screens/VascoAIPage';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'Vasco AI — Yapay Zeka Sağlık Asistanı',
  description:
    'Vasco AI ile semptomlarınızı anlayın, doğru uzmanlığa yönlendirilin ve sağlık sorularınıza hızlı yanıtlar alın.',
  alternates: altLanguages('/vasco-ai'),
  openGraph: {
    title: 'Vasco AI — Yapay Zeka Sağlık Asistanı | MedaGama',
    description:
      'Semptomlarınızı anlayın, doğru uzmanlığa yönlendirilin ve hızlı yanıtlar alın.',
    url: '/vasco-ai',
    type: 'website',
  },
};

export default function Page() {
  return <VascoAIPage />;
}
