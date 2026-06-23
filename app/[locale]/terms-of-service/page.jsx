import TermsOfServicePage from '@/screens/TermsOfServicePage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/terms-of-service',
    title: { tr: 'Kullanım Koşulları', en: 'Terms of Service' },
    description: {
      tr: 'MedaGama kullanım koşulları: platformu kullanırken geçerli olan hak ve yükümlülükleri inceleyin.',
      en: 'MedaGama terms of service: review the rights and obligations that apply when using the platform.',
    },
  });
}

export default function Page() {
  return <TermsOfServicePage />;
}
