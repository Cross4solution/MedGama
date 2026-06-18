// Locale configuration — çok dilli URL routing (Faz "locale routing").
// tr = varsayılan (prefix yine de var: /tr/...). Diğerleri ek diller.
// Sağlık turizmi odaklı 9 dil: tr/en/de/ar/ru/fr/es/it/az.
export const LOCALES = ['tr', 'en', 'de', 'ar', 'ru', 'fr', 'es', 'it', 'az'];
export const DEFAULT_LOCALE = 'tr';
export const RTL_LOCALES = ['ar'];

export function isLocale(x) {
  return LOCALES.includes(x);
}

export function isRtl(locale) {
  return RTL_LOCALES.includes(locale);
}

/**
 * Bir pathname'in ilk segmentinden locale'i çıkarır.
 * '/tr/about' -> 'tr', '/about' -> DEFAULT_LOCALE
 */
export function getLocaleFromPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return DEFAULT_LOCALE;
  const seg = pathname.split('/').filter(Boolean)[0];
  return isLocale(seg) ? seg : DEFAULT_LOCALE;
}

/**
 * Locale prefix'ini pathname'den soyar (yoksa olduğu gibi döner).
 * '/tr/about' -> '/about', '/tr' -> '/', '/about' -> '/about'
 */
export function stripLocale(pathname) {
  if (!pathname || typeof pathname !== 'string') return '/';
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && isLocale(parts[0])) parts.shift();
  return '/' + parts.join('/');
}

/**
 * Locale-siz bir path'e locale prefix ekler.
 * ('tr', '/about') -> '/tr/about', ('tr', '/') -> '/tr'
 */
export function withLocale(locale, path) {
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const clean = !path || path === '/' ? '' : (path.startsWith('/') ? path : `/${path}`);
  return `/${loc}${clean}`;
}
