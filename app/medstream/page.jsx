import PrivateRoute from '@/components/auth/PrivateRoute';
import ExploreTimeline from '@/screens/ExploreTimeline';

// MedStream kimlik doğrulaması gerektirir (PrivateRoute) → arama motorlarına kapalı.
export const metadata = {
  title: 'MedStream',
  description: 'MedaGama sağlık akışı — doktor ve klinik paylaşımları.',
  alternates: { canonical: '/medstream' },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PrivateRoute>
      <ExploreTimeline />
    </PrivateRoute>
  );
}
