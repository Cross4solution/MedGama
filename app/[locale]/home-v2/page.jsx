import HomeV2 from '@/screens/HomeV2';
import {
  buildWebSiteSchema,
  buildOrganizationSchema,
  jsonLdString,
  buildMetadata,
} from '@/lib/seo-server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: '/home-v2',
    title: {
      tr: 'MedaGama — Dijital Sağlık ve Randevu Platformu',
      en: 'MedaGama — Digital Health & Appointment Platform',
    },
    description: {
      tr: 'Uzman doktorlar, güvenli telehealth ve modern tedavi yöntemleri tek bir platformda. Randevu al, doktor yorumlarını oku, sağlık turizmini planla.',
      en: 'Expert doctors, secure telehealth and modern treatments in one platform. Book appointments, read doctor reviews and plan medical travel.',
    },
  });
}

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
