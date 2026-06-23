import VascoAIPage from '@/screens/VascoAIPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/vasco-ai',
    title: { tr: 'Vasco AI — Yapay Zeka Sağlık Asistanı', en: 'Vasco AI — AI Health Assistant' },
    description: {
      tr: 'Vasco AI ile semptomlarınızı anlayın, doğru uzmanlığa yönlendirilin ve sağlık sorularınıza hızlı yanıtlar alın.',
      en: 'Understand your symptoms, get directed to the right specialty and receive fast answers to your health questions with Vasco AI.',
    },
  });
}

export default function Page() {
  return <VascoAIPage />;
}
