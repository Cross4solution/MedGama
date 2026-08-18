import ExploreTimeline from '@/screens/ExploreTimeline';
import { buildMetadata } from '@/lib/seo-server';

// MedStream public akış — misafirler göz atabilir (paylaşım kutusu içeride yetkiye bağlı).
// Herkese açık olduğu için arama motorlarına açık (indexable).
export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    ...buildMetadata({
      locale,
      path: '/medstream',
      title: { tr: 'Medstream', en: 'Medstream' },
      description: {
        tr: 'Medagama sağlık akışı — doktor ve klinik paylaşımları.',
        en: 'Medagama health feed — posts from doctors and clinics.',
      },
    }),
    robots: { index: true, follow: true },
  };
}

export default function Page() {
  return <ExploreTimeline />;
}
