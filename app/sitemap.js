import { API_ORIGIN, SITE_URL } from '@/lib/seo-server';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/locales';
import { getProviderCombinations } from '@/lib/tedaviler-data';

async function safeList(path) {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    // Laravel paginator → { data: [...] }
    return Array.isArray(json) ? json : json?.data || [];
  } catch {
    return [];
  }
}

// Locale-siz bir path'i her dil için bir URL'e açar + hreflang alternates ekler.
// `p` '' (kök) veya '/about' gibi locale-siz path.
function localizeEntries(p, { priority = 0.7, changeFrequency = 'weekly', lastModified } = {}) {
  const languages = {};
  for (const loc of LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${p}`;
  }
  return LOCALES.map((loc) => ({
    url: `${SITE_URL}/${loc}${p}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap() {
  const now = new Date();

  const staticPaths = [
    '',
    '/about',
    '/for-patients',
    '/for-clinics',
    '/contact',
    '/vasco-ai',
    '/search',
    '/doctors-departments',
    '/privacy-policy',
    '/terms-of-service',
    '/kvkk',
    '/cookie-policy',
    '/data-rights',
    '/tedaviler',
  ];

  const staticUrls = staticPaths.flatMap((p) =>
    localizeEntries(p, { priority: p === '' ? 1 : 0.7, lastModified: now })
  );

  let dynamicUrls = [];
  try {
    const [docs, clinics] = await Promise.all([
      safeList('/api/doctors?per_page=1000'),
      safeList('/api/clinics?per_page=1000'),
    ]);

    const doctorUrls = docs
      .filter((d) => d && d.id)
      .flatMap((d) => localizeEntries(`/doctor/${d.id}`, { priority: 0.8, lastModified: now }));

    const clinicUrls = clinics
      .filter((c) => c && (c.codename || c.id))
      .flatMap((c) =>
        localizeEntries(`/clinic/${c.codename || c.id}`, { priority: 0.8, lastModified: now })
      );

    dynamicUrls = [...doctorUrls, ...clinicUrls];
  } catch {
    dynamicUrls = [];
  }

  // Programmatic SEO: /tedaviler/[specialty]/[city]. Capped to keep the sitemap
  // reasonable AFTER multiplying by locale count.
  let tedaviUrls = [];
  try {
    const cap = Math.max(50, Math.floor(500 / LOCALES.length));
    const combos = await getProviderCombinations(cap);
    tedaviUrls = combos.flatMap(({ specialtySlug, citySlug }) =>
      localizeEntries(`/tedaviler/${specialtySlug}/${citySlug}`, { priority: 0.7, lastModified: now })
    );
  } catch {
    tedaviUrls = [];
  }

  return [...staticUrls, ...dynamicUrls, ...tedaviUrls];
}
