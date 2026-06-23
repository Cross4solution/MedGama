import { notFound } from 'next/navigation';
import ClinicDetailPage from '@/screens/ClinicDetailPage';
import {
  fetchJson,
  clamp,
  absoluteUrl,
  altLanguages,
  buildMedicalClinicSchema,
  buildBreadcrumbSchema,
  jsonLdString,
} from '@/lib/seo-server';

// Backend: GET /api/clinics/{codename} → { clinic }
// [id] segment carries the clinic codename (frontend links use codename).
async function getClinicData(codename) {
  const data = await fetchJson(`/api/clinics/${codename}`, 300);
  if (!data) return null;
  const c = data.clinic || data.data?.clinic || data.data || data;
  if (!c || (!c.fullname && !c.name)) return null;
  return c;
}

export async function generateMetadata({ params }) {
  const { id, locale } = await params;
  const c = await getClinicData(id);
  if (!c) return { title: 'Bulunamadı | MedaGama', robots: { index: false } };

  const name = c.fullname || c.name || 'Klinik';
  const description = clamp(
    c.description || c.bio || `${name} — MedaGama üzerinden randevu alın ve uzman ekibi inceleyin.`,
  );
  const image = absoluteUrl(c.avatar);

  return {
    title: name,
    description,
    alternates: altLanguages(`/clinic/${id}`, locale),
    openGraph: {
      title: `${name} | MedaGama`,
      description,
      url: `/clinic/${id}`,
      type: 'website',
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: name }],
      }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${name} | MedaGama`,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const c = await getClinicData(id);

  // Soft-404 fix: unknown clinic → real HTTP 404 via not-found boundary.
  if (!c) notFound();

  let schema = null;
  let breadcrumb = null;
  if (c) {
    const name = c.fullname || c.name;
    const specialties = Array.isArray(c.doctors)
      ? [
          ...new Set(
            c.doctors
              .map(
                (d) =>
                  d.doctor_profile?.specialty ||
                  d.doctorProfile?.specialty ||
                  d.doctor_profile?.specialtyRelation?.name,
              )
              .filter(Boolean),
          ),
        ]
      : undefined;
    schema = buildMedicalClinicSchema({
      name,
      image: absoluteUrl(c.avatar),
      description: c.description || c.bio || undefined,
      address: c.address || undefined,
      telephone: c.phone || c.telephone || undefined,
      specialties: specialties?.length ? specialties : undefined,
      url: `/clinic/${id}`,
    });
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Klinikler', path: '/browse/clinics' },
      { name, path: `/clinic/${id}` },
    ]);
  }

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
      <ClinicDetailPage initialClinic={c || undefined} />
    </>
  );
}
