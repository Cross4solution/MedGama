// Server-side SEO helpers for Next.js App Router (Faz 3).
// NO dependency on react-helmet-async — safe to import in server components.
// Schema builders mirror the logic in src/components/seo/SEOHead.jsx but are
// framework-agnostic so generateMetadata + server JSON-LD can use them.

import { LOCALES, DEFAULT_LOCALE } from './locales';

export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || 'https://medagama-backend.onrender.com';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://medagama.com';
export const SITE_NAME = 'MedaGama';

/**
 * Build an `alternates` block with real per-locale hreflang URLs.
 * `path` is the LOCALE-LESS canonical path (e.g. '/about' or '/doctor/123').
 * Produces `${SITE_URL}/tr/about`, `${SITE_URL}/en/about`, … plus x-default=tr.
 * Canonical points to the default-locale (tr) URL.
 * @param {string} path locale-less canonical path, e.g. '/about'
 */
export function altLanguages(path, locale = DEFAULT_LOCALE) {
  const clean = !path || path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);
  const loc = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const languages = {};
  for (const l of LOCALES) {
    languages[l] = `${SITE_URL}/${l}${clean}`;
  }
  languages['x-default'] = `${SITE_URL}/${DEFAULT_LOCALE}${clean}`;
  return {
    // Canonical = the page's OWN locale URL (not always the default locale).
    canonical: `${SITE_URL}/${loc}${clean}`,
    languages,
  };
}

/**
 * Locale-aware Metadata builder for App Router generateMetadata().
 * title/description accept a string OR a per-locale map ({ tr, en, ... }),
 * resolved by `locale` with en→tr→first fallback. Produces correct per-locale
 * canonical + hreflang + OpenGraph/Twitter.
 * @param {{locale:string, path:string, title:(string|object), description:(string|object), image?:string}} opts
 */
export function buildMetadata({ locale, path, title, description, image }) {
  const loc = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const pick = (v) =>
    typeof v === 'string' || v == null
      ? (v || '')
      : (v[loc] || v.en || v.tr || Object.values(v)[0] || '');
  const t = pick(title);
  const d = clamp(pick(description));
  const clean = !path || path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);
  const url = `${SITE_URL}/${loc}${clean}`;
  const ogTitle = t ? `${t} | ${SITE_NAME}` : SITE_NAME;
  const img = image ? absoluteUrl(image) : undefined;
  return {
    title: t || undefined,
    description: d || undefined,
    alternates: altLanguages(path, loc),
    openGraph: {
      title: ogTitle,
      description: d || undefined,
      url,
      type: 'website',
      ...(img && { images: [img] }),
    },
    twitter: {
      card: 'summary',
      title: ogTitle,
      description: d || undefined,
    },
  };
}

/**
 * Resolve a possibly-relative image/storage path to an absolute URL.
 * - Already absolute (http/https) → returned as-is.
 * - Storage path (e.g. '/storage/...') → prefixed with API_ORIGIN.
 * - Other site-relative path → prefixed with SITE_URL.
 */
export function absoluteUrl(path) {
  if (!path || typeof path !== 'string') return undefined;
  const p = path.trim();
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p;
  const rel = p.startsWith('/') ? p : `/${p}`;
  // Backend-served media (uploads) live under API_ORIGIN; static site assets
  // under SITE_URL. Storage/media paths get the API origin.
  if (/^\/(storage|media|uploads|avatars?)\b/i.test(rel)) return `${API_ORIGIN}${rel}`;
  return `${SITE_URL}${rel}`;
}

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
    description:
      'Uzman doktorlar, klinikler ve güvenli telehealth tek bir dijital sağlık platformunda.',
    // Sosyal medya hesapları bağlandığında bu diziye eklenecek (örn. LinkedIn, X, Instagram).
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@medagama.com',
      contactType: 'customer service',
    },
  };
}

export function buildFaqSchema(faqs = []) {
  const valid = (Array.isArray(faqs) ? faqs : [])
    .map((f) => ({
      question: f?.question || f?.q || f?.title,
      answer: f?.answer || f?.a || f?.content,
    }))
    .filter((f) => f.question && f.answer);
  if (valid.length === 0) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: String(f.answer),
      },
    })),
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
