import DataPrivacyRightsPage from '@/screens/DataPrivacyRightsPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/data-rights',
    title: { tr: 'Veri Sahibi Hakları', en: 'Data Subject Rights' },
    description: {
      tr: 'MedaGama üzerindeki kişisel verilerinize erişme, düzeltme, silme ve veri taşınabilirliği taleplerinizi nasıl iletebileceğinizi öğrenin.',
      en: 'Learn how to exercise your rights to access, rectify, erase and port your personal data on MedaGama.',
    },
  });
}

export default function Page() {
  return <DataPrivacyRightsPage />;
}
