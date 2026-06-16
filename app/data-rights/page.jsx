import DataPrivacyRightsPage from '@/screens/DataPrivacyRightsPage';

export const metadata = {
  title: 'Veri Sahibi Hakları',
  description:
    'MedaGama üzerindeki kişisel verilerinize erişme, düzeltme, silme ve veri taşınabilirliği taleplerinizi nasıl iletebileceğinizi öğrenin.',
  alternates: { canonical: '/data-rights' },
  openGraph: {
    title: 'Veri Sahibi Hakları | MedaGama',
    description:
      'Kişisel verilerinize erişme, düzeltme ve silme taleplerinizi nasıl iletebilirsiniz.',
    url: '/data-rights',
    type: 'website',
  },
};

export default function Page() {
  return <DataPrivacyRightsPage />;
}
