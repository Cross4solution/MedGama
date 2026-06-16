import HomeV2 from '@/screens/HomeV2';
import {
  buildWebSiteSchema,
  buildOrganizationSchema,
  jsonLdString,
  altLanguages,
} from '@/lib/seo-server';

export const metadata = {
  title: 'MedaGama — Dijital Sağlık ve Randevu Platformu',
  description:
    'Uzman doktorlar, güvenli telehealth ve modern tedavi yöntemleri tek bir platformda. Randevu al, doktor yorumlarını oku, sağlık turizmini planla.',
  alternates: altLanguages('/home-v2'),
  openGraph: {
    title: 'MedaGama — Dijital Sağlık ve Randevu Platformu',
    description:
      'Uzman doktorlar, güvenli telehealth ve modern tedavi yöntemleri tek bir platformda.',
    url: '/home-v2',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildWebSiteSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(buildOrganizationSchema()),
        }}
      />
      <HomeV2 />
    </>
  );
}
