import { API_ORIGIN, SITE_URL } from '@/lib/seo-server';
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

  const staticUrls = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));

  let dynamicUrls = [];
  try {
    const [docs, clinics] = await Promise.all([
      safeList('/api/doctors?per_page=1000'),
      safeList('/api/clinics?per_page=1000'),
    ]);

    const doctorUrls = docs
      .filter((d) => d && d.id)
      .map((d) => ({
        url: `${SITE_URL}/doctor/${d.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    const clinicUrls = clinics
      .filter((c) => c && (c.codename || c.id))
      .map((c) => ({
        url: `${SITE_URL}/clinic/${c.codename || c.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    dynamicUrls = [...doctorUrls, ...clinicUrls];
  } catch {
    dynamicUrls = [];
  }

  // Programmatic SEO: /tedaviler/[specialty]/[city] for combinations that
  // actually have providers. Capped at 500 to keep the sitemap reasonable.
  let tedaviUrls = [];
  try {
    const combos = await getProviderCombinations(500);
    tedaviUrls = combos.map(({ specialtySlug, citySlug }) => ({
      url: `${SITE_URL}/tedaviler/${specialtySlug}/${citySlug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {
    tedaviUrls = [];
  }

  return [...staticUrls, ...dynamicUrls, ...tedaviUrls];
}
