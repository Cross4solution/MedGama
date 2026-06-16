import PrivacyPolicyPage from '@/screens/PrivacyPolicyPage';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'Gizlilik Politikası',
  description:
    'MedaGama gizlilik politikası: kişisel verilerinizi nasıl topladığımız, işlediğimiz ve koruduğumuz hakkında bilgi edinin.',
  alternates: altLanguages('/privacy-policy'),
  openGraph: {
    title: 'Gizlilik Politikası | MedaGama',
    description: 'Kişisel verilerinizi nasıl koruduğumuz hakkında bilgi edinin.',
    url: '/privacy-policy',
    type: 'website',
  },
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
