// Server-side SEO helpers for Next.js App Router (Faz 3).
// NO dependency on react-helmet-async — safe to import in server components.
// Schema builders mirror the logic in src/components/seo/SEOHead.jsx but are
// framework-agnostic so generateMetadata + server JSON-LD can use them.

export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || 'https://medagama-backend.onrender.com';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://medagama.com';
export const SITE_NAME = 'MedaGama';

/** Trim a string to a safe meta-description length. */
export function clamp(str, max = 160) {
  if (!str) return str;
  const s = String(str).replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
}

/* ------------------------------------------------------------------ *
 * Schema.org builders (server-safe copies of SEOHead helpers)
 * ------------------------------------------------------------------ */

export function buildPhysicianSchema({
  name,
  image,
  description,
  specialty,
  rating,
  reviewCount,
  address,
  languages,
  url,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name,
    ...(image && { image }),
    ...(description && { description: String(description).slice(0, 300) }),
    ...(specialty && { medicalSpecialty: specialty }),
    ...(url && { url }),
    ...(rating &&
      reviewCount && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rating,
          reviewCount,
          bestRating: 5,
        },
      }),
    ...(address && {
      address: { '@type': 'PostalAddress', streetAddress: address },
    }),
    ...(languages?.length > 0 && { knowsLanguage: languages }),
  };
}

export function buildMedicalClinicSchema({
  name,
  image,
  description,
  address,
  rating,
  reviewCount,
  url,
  telephone,
  specialties,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name,
    ...(image && { image }),
    ...(description && { description: String(description).slice(0, 300) }),
    ...(url && { url }),
    ...(telephone && { telephone }),
    ...(specialties?.length > 0 && { medicalSpecialty: specialties }),
    ...(rating &&
      reviewCount && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rating,
          reviewCount,
          bestRating: 5,
        },
      }),
    ...(address && {
      address: { '@type': 'PostalAddress', streetAddress: address },
    }),
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo/logo.svg`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@medagama.com',
      contactType: 'customer service',
    },
  };
}

export function buildBreadcrumbSchema(items = []) {
  const valid = items.filter((i) => i && i.name);
  if (valid.length === 0) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: valid.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      ...(item.path && { item: `${SITE_URL}${item.path}` }),
    })),
  };
}

/** Render a JSON-LD object as a string safe for dangerouslySetInnerHTML. */
export function jsonLdString(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

/* ------------------------------------------------------------------ *
 * Resilient fetch — never throws, returns null on any failure.
 * ------------------------------------------------------------------ */
export async function fetchJson(path, revalidate = 300) {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
