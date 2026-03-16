import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'MedaGama';
const SITE_URL = 'https://medagama.com';
const DEFAULT_IMAGE = '/images/og-default.jpg';
const DEFAULT_DESC = 'Find trusted doctors, clinics and healthcare services. Book appointments, read reviews, and access telehealth — all in one platform.';

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
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* No-index */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

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
