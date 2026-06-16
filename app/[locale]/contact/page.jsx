import ContactPage from '@/screens/ContactPage';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'İletişim',
  description:
    'MedaGama ekibiyle iletişime geçin. Sorularınız, iş birlikleri ve destek talepleriniz için bize ulaşın.',
  alternates: altLanguages('/contact'),
  openGraph: {
    title: 'İletişim | MedaGama',
    description: 'Sorularınız ve destek talepleriniz için MedaGama ile iletişime geçin.',
    url: '/contact',
    type: 'website',
  },
};

export default function Page() {
  return <ContactPage />;
}
