import CookiePolicyPage from '@/screens/CookiePolicyPage';

export const metadata = {
  title: 'Çerez Politikası',
  description:
    'MedaGama çerez politikası: web sitemizde hangi çerezleri kullandığımız ve tercihlerinizi nasıl yönetebileceğiniz.',
  alternates: { canonical: '/cookie-policy' },
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
