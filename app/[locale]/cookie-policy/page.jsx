import CookiePolicyPage from '@/screens/CookiePolicyPage';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'Çerez Politikası',
  description:
    'MedaGama çerez politikası: web sitemizde hangi çerezleri kullandığımız ve tercihlerinizi nasıl yönetebileceğiniz.',
  alternates: altLanguages('/cookie-policy'),
  openGraph: {
    title: 'Çerez Politikası | MedaGama',
    description: 'Hangi çerezleri kullandığımız ve tercihlerinizi nasıl yönetebileceğiniz.',
    url: '/cookie-policy',
    type: 'website',
  },
};

export default function Page() {
  return <CookiePolicyPage />;
}
