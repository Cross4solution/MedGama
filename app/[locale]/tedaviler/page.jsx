// /tedaviler — hub page listing all specialties (internal-linking entry point).
// Server component.

import Link from 'next/link';
import { altLanguages, buildBreadcrumbSchema, jsonLdString } from '@/lib/seo-server';
import { slugify, trName } from '@/lib/slug';
import { getSpecialties } from '@/lib/tedaviler-data';

export const revalidate = 3600;

export const metadata = {
  title: 'Tedaviler ve Uzmanlık Alanları | MedaGama',
  description:
    'MedaGama üzerindeki tüm uzmanlık alanlarını keşfedin. Şehrinizdeki uzman doktor ve klinikleri bulun, online randevu alın.',
  alternates: altLanguages('/tedaviler'),
  openGraph: {
    title: 'Tedaviler ve Uzmanlık Alanları | MedaGama',
    description:
      'Tüm uzmanlık alanlarını keşfedin, şehrinizdeki uzman doktor ve klinikleri bulun.',
    url: '/tedaviler',
    type: 'website',
  },
};

export default async function Page() {
  const specialties = await getSpecialties();

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Ana Sayfa', path: '/' },
    { name: 'Tedaviler', path: '/tedaviler' },
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Tedaviler ve Uzmanlık Alanları
      </h1>
      <p className="text-gray-600 leading-relaxed mb-8 max-w-3xl">
        Aşağıdaki uzmanlık alanlarından birini seçerek şehrinizdeki uzman
        doktorları ve klinikleri keşfedin, MedaGama üzerinden online randevu alın.
      </p>

      {specialties.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {specialties.map((sp) => {
            const name = trName(sp);
            const slug = slugify(name);
            if (!slug) return null;
            return (
              <li key={sp.id}>
                <Link
                  href={`/tedaviler/${slug}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 font-medium text-[#1C6A83] hover:shadow-md transition-shadow"
                >
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500">Uzmanlık listesi şu anda yüklenemedi.</p>
      )}
    </main>
  );
}
