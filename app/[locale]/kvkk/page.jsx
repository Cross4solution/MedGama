import KVKKPage from '@/screens/KVKKPage';
import { altLanguages } from '@/lib/seo-server';

export const metadata = {
  title: 'KVKK Aydınlatma Metni',
  description:
    'MedaGama KVKK aydınlatma metni: 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında haklarınız ve veri işleme esasları.',
  alternates: altLanguages('/kvkk'),
  openGraph: {
    title: 'KVKK Aydınlatma Metni | MedaGama',
    description: 'KVKK kapsamında haklarınız ve veri işleme esasları.',
    url: '/kvkk',
    type: 'website',
  },
};

export default function Page() {
  return <KVKKPage />;
}
