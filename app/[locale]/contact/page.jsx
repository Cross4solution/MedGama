import ContactPage from '@/screens/ContactPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/contact',
    title: { tr: 'İletişim', en: 'Contact' },
    description: {
      tr: 'MedaGama ekibiyle iletişime geçin. Sorularınız, iş birlikleri ve destek talepleriniz için bize ulaşın.',
      en: 'Get in touch with the MedaGama team for questions, partnerships and support requests.',
    },
  });
}

export default function Page() {
  return <ContactPage />;
}
