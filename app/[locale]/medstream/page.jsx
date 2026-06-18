import ExploreTimeline from '@/screens/ExploreTimeline';
import { altLanguages } from '@/lib/seo-server';

// MedStream public akış — misafirler göz atabilir (paylaşım kutusu içeride yetkiye bağlı).
// Herkese açık olduğu için arama motorlarına açık (indexable).
export const metadata = {
  title: 'MedStream',
  description: 'MedaGama sağlık akışı — doktor ve klinik paylaşımları.',
  alternates: altLanguages('/medstream'),
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ExploreTimeline />;
}
