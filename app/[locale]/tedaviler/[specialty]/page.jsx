// /tedaviler/[specialty] — city picker for a specialty. Lists only cities that
// actually have providers for this specialty (internal-linking + thin-content safe).
// Server component.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  altLanguages,
  buildBreadcrumbSchema,
  jsonLdString,
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

async function resolve(specialtySlug) {
  const [specialties, cities, doctors, clinics] = await Promise.all([
    getSpecialties(),
    getCities(),
    getAllDoctors(),
    getAllClinics(),
  ]);
  const specialty = matchBySlug(specialties, specialtySlug);
  if (!specialty) return { specialty: null, cities: [] };
  const withProviders = cities.filter((city) => {
    const { doctors: dd, clinics: cc } = filterProviders({
      specialty,
      city,
      doctors,
      clinics,
    });
    return dd.length + cc.length > 0;
  });
  return { specialty, cities: withProviders };
}

export async function generateMetadata({ params }) {
  const { specialty, locale } = await params;
  const { specialty: sp } = await resolve(specialty);
  if (!sp) return { title: 'Bulunamadı | MedaGama', robots: { index: false } };
  const name = trName(sp);
  const path = `/tedaviler/${specialty}`;
  const title = `${name} Doktorları ve Klinikleri | MedaGama`;
  const description = `${name} alanında uzman doktorları ve klinikleri şehrinize göre keşfedin. MedaGama üzerinden online randevu alın.`;
  return {
    title,
    description,
    alternates: altLanguages(path, locale),
    openGraph: { title, description, url: path, type: 'website' },
  };
}

export default async function Page({ params }) {
  const { specialty: specialtySlug } = await params;
  const { specialty, cities } = await resolve(specialtySlug);
  if (!specialty) notFound();

  const name = trName(specialty);
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Ana Sayfa', path: '/' },
    { name: 'Tedaviler', path: '/tedaviler' },
    { name, path: `/tedaviler/${specialtySlug}` },
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
        <Link href="/" className="hover:underline">Ana Sayfa</Link>
        {' / '}
        <Link href="/tedaviler" className="hover:underline">Tedaviler</Link>
        {' / '}
        <span className="text-gray-700">{name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {name} Doktorları ve Klinikleri
      </h1>
      <p className="text-gray-600 leading-relaxed mb-8 max-w-3xl">
        {name} alanında hizmet veren uzmanları şehrinize göre keşfedin. Bir şehir
        seçerek o bölgedeki doktor ve klinikleri görüntüleyin.
      </p>

      {cities.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cities.map((city) => {
            const cityName = trName(city);
            const citySlug = slugify(cityName);
            return (
              <li key={city.id}>
                <Link
                  href={`/tedaviler/${specialtySlug}/${citySlug}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 font-medium text-[#1C6A83] hover:shadow-md transition-shadow"
                >
                  {cityName} {name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500">
          Bu uzmanlık alanında henüz listelenmiş sağlayıcı bulunmuyor.
        </p>
      )}
    </main>
  );
}
