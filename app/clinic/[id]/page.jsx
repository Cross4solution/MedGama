import ClinicDetailPage from '@/screens/ClinicDetailPage';
import {
  fetchJson,
  clamp,
  buildMedicalClinicSchema,
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
  const { id } = await params;
  const c = await getClinicData(id);
  if (!c) return { title: 'Klinik', alternates: { canonical: `/clinic/${id}` } };

  const name = c.fullname || c.name || 'Klinik';
  const description = clamp(
    c.description || c.bio || `${name} — MedaGama üzerinden randevu alın ve uzman ekibi inceleyin.`,
  );
  const image = c.avatar || undefined;

  return {
    title: name,
    description,
    alternates: { canonical: `/clinic/${id}` },
    openGraph: {
      title: `${name} | MedaGama`,
      description,
      url: `/clinic/${id}`,
      type: 'website',
      ...(image && { images: [image] }),
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const c = await getClinicData(id);

  let schema = null;
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
      image: c.avatar || undefined,
      description: c.description || c.bio || undefined,
      address: c.address || undefined,
      telephone: c.phone || c.telephone || undefined,
      specialties: specialties?.length ? specialties : undefined,
      url: `/clinic/${id}`,
    });
  }

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }}
        />
      )}
      <ClinicDetailPage />
    </>
  );
}
