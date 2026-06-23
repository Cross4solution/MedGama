import KVKKPage from '@/screens/KVKKPage';
import { buildMetadata } from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/kvkk',
    title: { tr: 'KVKK Aydınlatma Metni', en: 'KVKK Disclosure (PDPL)' },
    description: {
      tr: 'MedaGama KVKK aydınlatma metni: 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında haklarınız ve veri işleme esasları.',
      en: 'MedaGama disclosure under Türkiye’s Personal Data Protection Law (No. 6698): your rights and data processing principles.',
    },
  });
}

export default function Page() {
  return <KVKKPage />;
}
