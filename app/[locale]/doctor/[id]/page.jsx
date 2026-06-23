import { notFound } from 'next/navigation';
import DoctorProfile from '@/screens/DoctorProfile';
import {
  fetchJson,
  clamp,
  absoluteUrl,
  altLanguages,
  buildPhysicianSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  jsonLdString,
} from '@/lib/seo-server';

// Backend: GET /api/doctors/{id} → { doctor, review_stats: { average_rating, review_count } }
async function getDoctorData(id) {
  const data = await fetchJson(`/api/doctors/${id}`, 300);
  if (!data) return null;
  const d = data.doctor || data.data?.doctor || data.data || data;
  if (!d || (!d.fullname && !d.name)) return null;
  return { doctor: d, stats: data.review_stats || {} };
}

// Backend: GET /api/doctors/{id}/faqs → { data: [{ question, answer }] } (public, active only)
async function getDoctorFaqs(id) {
  const data = await fetchJson(`/api/doctors/${id}/faqs`, 300);
  const list = data?.data || data?.faqs || (Array.isArray(data) ? data : null);
  return Array.isArray(list) ? list : [];
}

export async function generateMetadata({ params }) {
  const { id, locale } = await params; // Next 15: params async
  const res = await getDoctorData(id);
  if (!res)
    return { title: 'Bulunamadı | MedaGama', robots: { index: false } };

  const { doctor: d } = res;
  const name = d.fullname || d.name || 'Doktor';
  const profile = d.doctor_profile || d.doctorProfile || {};
  const spec =
    profile.specialty || profile.specialtyRelation?.name || '';
  const title = `${name}${spec ? ' — ' + spec : ''}`;
  const description = clamp(
    profile.bio || `${name} ile MedaGama üzerinden online randevu alın.`,
  );
  const image = absoluteUrl(d.avatar);

  return {
    title,
    description,
    alternates: altLanguages(`/doctor/${id}`, locale),
    openGraph: {
      title: `${title} | MedaGama`,
      description,
      url: `/doctor/${id}`,
      type: 'profile',
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: name }],
      }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} | MedaGama`,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const [res, faqs] = await Promise.all([
    getDoctorData(id),
    getDoctorFaqs(id),
  ]);

  // Soft-404 fix: unknown doctor → real HTTP 404 via not-found boundary.
  if (!res) notFound();

  let schema = null;
  let breadcrumb = null;
  if (res) {
    const { doctor: d, stats } = res;
    const profile = d.doctor_profile || d.doctorProfile || {};
    const name = d.fullname || d.name;
    schema = buildPhysicianSchema({
      name,
      image: absoluteUrl(d.avatar),
      description: profile.bio || undefined,
      specialty: profile.specialty || profile.specialtyRelation?.name || undefined,
      rating: stats.average_rating || profile.avg_rating || undefined,
      reviewCount: stats.review_count || profile.review_count || undefined,
      languages: Array.isArray(profile.languages) ? profile.languages : undefined,
      url: `/doctor/${id}`,
    });
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Doktorlar', path: '/doctors-departments' },
      { name, path: `/doctor/${id}` },
    ]);
  }

  const faqSchema = buildFaqSchema(faqs);

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }}
        />
      )}
      {breadcrumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }}
        />
      )}
      <DoctorProfile initialDoctor={res || undefined} />
    </>
  );
}
