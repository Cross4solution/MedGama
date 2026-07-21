import CookiePolicyPage from '@/screens/CookiePolicyPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/cookie-policy',
    title: { tr: 'Çerez Politikası', en: 'Cookie Policy' },
    description: {
      tr: 'Medagama çerez politikası: web sitemizde hangi çerezleri kullandığımız ve tercihlerinizi nasıl yönetebileceğiniz.',
      en: 'Medagama cookie policy: which cookies we use on our website and how you can manage your preferences.',
    },
  });
}

export default function Page() {
  return <CookiePolicyPage />;
}
