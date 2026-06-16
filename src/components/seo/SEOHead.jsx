import { Helmet } from 'react-helmet-async';
import i18n from '../../i18n';

const SITE_NAME = 'MedaGama';
// Single source of truth for the canonical domain. Override per-environment via
// REACT_APP_SITE_URL (set in Vercel / hosting env). Update the fallback once the
// production domain is finalized.
const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://medagama.com').replace(/\/$/, '');
const DEFAULT_IMAGE = '/images/og-default.jpg';
const DEFAULT_DESC = 'Find trusted doctors, clinics and healthcare services. Book appointments, read reviews, and access telehealth — all in one platform.';

// Supported UI languages for hreflang alternates (matches i18n config: TR + EN).
const SUPPORTED_LANGS = ['tr', 'en'];

/** Map an i18n language code to an Open Graph locale string. */
function ogLocale(lang) {
  return lang === 'tr' ? 'tr_TR' : 'en_US';
}

/**
 * Reusable SEO head component for dynamic meta tags + canonical + Open Graph + JSON-LD.
 *
 * @param {string} title - Page title (will be appended with " | MedaGama")
 * @param {string} description - Meta description (max ~160 chars)
 * @param {string} canonical - Canonical URL path (e.g. "/doctors/dr-ahmet")
 * @param {string} image - Open Graph image URL
 * @param {string} type - og:type (default "website")
 * @param {object|array} jsonLd - JSON-LD structured data object(s)
 * @param {object} extra - Extra meta tags { name: content } pairs
 * @param {boolean} noIndex - Set to true to add noindex
 * @param {boolean} alternates - Set to true to emit hreflang TR/EN/x-default alternates for `canonical`
 */
export default function SEOHead({
  title,
  description,
  canonical,
  image,
  type = 'website',
  jsonLd,
  extra = {},
  noIndex = false,
  alternates = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
  const ogImage = image || DEFAULT_IMAGE;
  const currentLang = (i18n?.language || 'tr').split('-')[0];

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* hreflang alternates (TR / EN / x-default) — same path across languages */}
      {alternates && canonicalUrl && SUPPORTED_LANGS.map((lang) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={canonicalUrl} />
      ))}
      {alternates && canonicalUrl && (
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={ogLocale(currentLang)} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots — always emitted so a later <SEOHead> (e.g. a page rendered inside a
          noindex private layout) can override an inherited noindex with index,follow. */}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />

      {/* Extra meta */}
      {Object.entries(extra).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

/**
 * Build Schema.org Physician JSON-LD
 */
export function buildPhysicianSchema({ name, image, description, specialty, rating, reviewCount, address, languages, url }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name,
    ...(image && { image }),
    ...(description && { description: description.slice(0, 300) }),
    ...(specialty && { medicalSpecialty: specialty }),
    ...(url && { url }),
    ...(rating && reviewCount && {
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
  return schema;
}

/**
 * Build Schema.org MedicalBusiness JSON-LD (for clinics)
 */
export function buildMedicalBusinessSchema({ name, image, description, address, rating, reviewCount, url, telephone, specialties }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name,
    ...(image && { image }),
    ...(description && { description: description.slice(0, 300) }),
    ...(url && { url }),
    ...(telephone && { telephone }),
    ...(specialties?.length > 0 && { medicalSpecialty: specialties }),
    ...(rating && reviewCount && {
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
  return schema;
}

/**
 * Build Schema.org WebSite JSON-LD (for homepage)
 */
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

/**
 * Build Schema.org MedicalClinic JSON-LD (clinics + hospitals).
 * Alias of the business schema but with the more specific @type.
 */
export function buildMedicalClinicSchema({ name, image, description, address, rating, reviewCount, url, telephone, specialties }) {
  return {
    ...buildMedicalBusinessSchema({ name, image, description, address, rating, reviewCount, url, telephone, specialties }),
    '@type': 'MedicalClinic',
  };
}

/**
 * Build Schema.org Organization JSON-LD
 */
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

/**
 * Build Schema.org BreadcrumbList JSON-LD.
 * @param {Array<{name: string, path: string}>} items - ordered crumbs (path = canonical path)
 */
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

/**
 * Build Schema.org FAQPage JSON-LD.
 * @param {Array<{question: string, answer: string}>} faqs
 */
export function buildFaqSchema(faqs = []) {
  const valid = faqs.filter((f) => f && f.question && f.answer);
  if (valid.length === 0) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
