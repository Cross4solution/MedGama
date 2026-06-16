// Programmatic SEO landing: /tedaviler/[specialty]/[city]
// Server component. Renders real SSR HTML (h1 + provider links + FAQ) and
// emits BreadcrumbList + FAQPage + ItemList JSON-LD.
// Thin-content guard: notFound() when specialty/city unknown OR no providers.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  altLanguages,
  buildBreadcrumbSchema,
  buildFaqSchema,
  jsonLdString,
  SITE_URL,
} from '@/lib/seo-server';
import { slugify, matchBySlug, trName } from '@/lib/slug';
import {
  getSpecialties,
  getCities,
  getAllDoctors,
  getAllClinics,
  filterProviders,
} from '@/lib/tedaviler-data';

export const revalidate = 3600;

/** Resolve slugs → catalog objects + filtered providers (shared by metadata+page). */
async function resolve(specialtySlug, citySlug) {
  const [specialties, cities, doctors, clinics] = await Promise.all([
    getSpecialties(),
    getCities(),
    getAllDoctors(),
    getAllClinics(),
  ]);
  const specialty = matchBySlug(specialties, specialtySlug);
  const city = matchBySlug(cities, citySlug);
  if (!specialty || !city) return { specialty, city, providers: null };
  const providers = filterProviders({ specialty, city, doctors, clinics });
  return { specialty, city, providers };
}

export async function generateMetadata({ params }) {
  const { specialty, city } = await params;
  const r = await resolve(specialty, city);
  if (!r.specialty || !r.city || !r.providers) {
    return { title: 'Bulunamadı | MedaGama', robots: { index: false } };
  }
  const specialtyName = trName(r.specialty);
  const cityName = trName(r.city);
  const path = `/tedaviler/${specialty}/${city}`;
  const title = `${specialtyName} — ${cityName} | MedaGama`;
  const description = `${cityName} şehrinde ${specialtyName} alanında uzman doktor ve klinikler. Randevu al, yorumları oku.`;
  return {
    title,
    description,
    alternates: altLanguages(path),
    openGraph: { title, description, url: path, type: 'website' },
  };
}

function DoctorCard({ d }) {
  const prof = d?.doctor_profile || {};
  const spec = trName(prof?.specialty_relation) || prof?.specialty || '';
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
      <Link href={`/doctor/${d.id}`} className="block">
        <span className="block font-semibold text-[#1C6A83]">
          {d.fullname}
        </span>
        {spec ? <span className="block text-sm text-gray-600">{spec}</span> : null}
        {d?.clinic?.fullname || d?.clinic?.name ? (
          <span className="block text-xs text-gray-500 mt-1">
            {d.clinic.fullname || d.clinic.name}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function ClinicCard({ c }) {
  const slug = c?.codename || c?.id;
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
      <Link href={`/clinic/${slug}`} className="block">
        <span className="block font-semibold text-[#1C6A83]">
          {c.fullname || c.name}
        </span>
        {c?.address ? (
          <span className="block text-xs text-gray-500 mt-1">{c.address}</span>
        ) : null}
      </Link>
    </li>
  );
}

export default async function Page({ params }) {
  const { specialty: specialtySlug, city: citySlug } = await params;
  const { specialty, city, providers } = await resolve(specialtySlug, citySlug);

  // Thin-content / invalid guard.
  if (!specialty || !city || !providers) notFound();
  const { doctors, clinics } = providers;
  if (doctors.length + clinics.length === 0) notFound();

  const specialtyName = trName(specialty);
  const cityName = trName(city);
  const path = `/tedaviler/${specialtySlug}/${citySlug}`;

  const faqs = [
    {
      question: `${cityName} şehrinde ${specialtyName} randevusu nasıl alınır?`,
      answer: `MedaGama üzerinden ${cityName} şehrindeki ${specialtyName} doktorlarını ve kliniklerini inceleyebilir, profillerinden uygun saati seçerek online randevu oluşturabilirsiniz.`,
    },
    {
      question: `${cityName}'de ${specialtyName} alanında kaç uzman var?`,
      answer: `Şu anda MedaGama'da ${cityName} şehrinde ${specialtyName} alanında ${doctors.length} doktor ve ${clinics.length} klinik listelenmektedir.`,
    },
    {
      question: `${specialtyName} doktorlarının yorumlarını görebilir miyim?`,
      answer: `Evet. Her doktor ve klinik profilinde hasta yorumlarını ve değerlendirme puanlarını inceleyebilirsiniz.`,
    },
  ];

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Ana Sayfa', path: '/' },
    { name: 'Tedaviler', path: '/tedaviler' },
    { name: specialtyName, path: `/tedaviler/${specialtySlug}` },
    { name: cityName, path },
  ]);
  const faqSchema = buildFaqSchema(faqs);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${cityName} ${specialtyName} Doktorları ve Klinikleri`,
    itemListElement: [
      ...doctors.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/doctor/${d.id}`,
        name: d.fullname,
      })),
      ...clinics.map((c, i) => ({
        '@type': 'ListItem',
        position: doctors.length + i + 1,
        url: `${SITE_URL}/clinic/${c.codename || c.id}`,
        name: c.fullname || c.name,
      })),
    ],
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(itemListSchema) }}
      />

      <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
        <Link href="/" className="hover:underline">Ana Sayfa</Link>
        {' / '}
        <Link href="/tedaviler" className="hover:underline">Tedaviler</Link>
        {' / '}
        <span className="text-gray-700">{specialtyName}</span>
        {' / '}
        <span className="text-gray-700">{cityName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {cityName} {specialtyName} Doktorları ve Klinikleri
      </h1>

      <p className="text-gray-600 leading-relaxed mb-8 max-w-3xl">
        {cityName} şehrinde {specialtyName} alanında hizmet veren uzman doktorları
        ve klinikleri keşfedin. Profilleri inceleyin, hasta yorumlarını okuyun ve
        MedaGama üzerinden kolayca online randevu alın.
      </p>

      {doctors.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {cityName} {specialtyName} Doktorları ({doctors.length})
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((d) => (
              <DoctorCard key={d.id} d={d} />
            ))}
          </ul>
        </section>
      ) : null}

      {clinics.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {cityName} {specialtyName} Klinikleri ({clinics.length})
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinics.map((c) => (
              <ClinicCard key={c.id} c={c} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Sıkça Sorulan Sorular
        </h2>
        <dl className="space-y-4">
          {faqs.map((f) => (
            <div key={f.question} className="border-b border-gray-100 pb-4">
              <dt className="font-medium text-gray-900">{f.question}</dt>
              <dd className="text-gray-600 mt-1">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
