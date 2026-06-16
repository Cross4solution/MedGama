// Slug helpers for programmatic SEO (tedaviler/[specialty]/[city]).
// Turkish-aware slugify + reverse matching against catalog entries.

/**
 * Turkish-aware slugify: lowercases, transliterates TR chars, strips
 * diacritics, collapses non-alphanumerics to single hyphens.
 * @param {string} s
 * @returns {string}
 */
export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolve the Turkish display name for a catalog item (specialty/city).
 * Falls back to the plain `name` then English.
 */
export function trName(item) {
  if (!item) return '';
  return (
    item?.name_translations?.tr ||
    item?.name ||
    item?.name_translations?.en ||
    ''
  );
}

/**
 * Find a catalog entry whose Turkish name slugifies to the given slug.
 * @param {Array} list catalog list (specialties or cities)
 * @param {string} slug
 * @returns {object|null}
 */
export function matchBySlug(list, slug) {
  if (!Array.isArray(list) || !slug) return null;
  const target = slugify(slug);
  return (
    list.find((item) => slugify(trName(item)) === target) ||
    // fallback: also try matching the English name / code
    list.find(
      (item) =>
        slugify(item?.name_translations?.en) === target ||
        slugify(item?.code) === target,
    ) ||
    null
  );
}
