import PrivacyPolicyPage from '@/screens/PrivacyPolicyPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/privacy-policy',
    title: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
    description: {
      tr: 'MedaGama gizlilik politikası: kişisel verilerinizi nasıl topladığımız, işlediğimiz ve koruduğumuz hakkında bilgi edinin.',
      en: 'MedaGama privacy policy: learn how we collect, process and protect your personal data.',
    },
  });
}

export default function Page() {
  return <PrivacyPolicyPage />;
}
