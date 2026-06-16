import TermsOfServicePage from '@/screens/TermsOfServicePage';

export const metadata = {
  title: 'Kullanım Koşulları',
  description:
    'MedaGama kullanım koşulları: platformu kullanırken geçerli olan hak ve yükümlülükleri inceleyin.',
  alternates: { canonical: '/terms-of-service' },
  openGraph: {
    title: 'Kullanım Koşulları | MedaGama',
    description: 'Platformu kullanırken geçerli olan hak ve yükümlülükler.',
    url: '/terms-of-service',
    type: 'website',
  },
};

export default function Page() {
  return <TermsOfServicePage />;
}
