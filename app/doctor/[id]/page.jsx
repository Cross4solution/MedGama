import DoctorProfile from '@/screens/DoctorProfile';
import {
  fetchJson,
  clamp,
  buildPhysicianSchema,
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

export async function generateMetadata({ params }) {
  const { id } = await params; // Next 15: params async
  const res = await getDoctorData(id);
  if (!res) return { title: 'Doktor', alternates: { canonical: `/doctor/${id}` } };

  const { doctor: d } = res;
  const name = d.fullname || d.name || 'Doktor';
  const profile = d.doctor_profile || d.doctorProfile || {};
  const spec =
    profile.specialty || profile.specialtyRelation?.name || '';
  const title = `${name}${spec ? ' — ' + spec : ''}`;
  const description = clamp(
    profile.bio || `${name} ile MedaGama üzerinden online randevu alın.`,
  );
  const image = d.avatar || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/doctor/${id}` },
    openGraph: {
      title: `${title} | MedaGama`,
      description,
      url: `/doctor/${id}`,
      type: 'profile',
      ...(image && { images: [image] }),
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const res = await getDoctorData(id);

  let schema = null;
  if (res) {
    const { doctor: d, stats } = res;
    const profile = d.doctor_profile || d.doctorProfile || {};
    schema = buildPhysicianSchema({
      name: d.fullname || d.name,
      image: d.avatar || undefined,
      description: profile.bio || undefined,
      specialty: profile.specialty || profile.specialtyRelation?.name || undefined,
      rating: stats.average_rating || profile.avg_rating || undefined,
      reviewCount: stats.review_count || profile.review_count || undefined,
      languages: Array.isArray(profile.languages) ? profile.languages : undefined,
      url: `/doctor/${id}`,
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
      <DoctorProfile />
    </>
  );
}
