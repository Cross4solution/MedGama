/**
 * Dynamic city loader — loads city data per-country on demand.
 * This avoids bundling the entire 1.9MB countryCities.js into the main bundle.
 * 
 * Usage:
 *   import { getCountryNames, loadCities } from '../data/cityLoader';
 *   const countries = getCountryNames();          // sync, ~2KB
 *   const cities = await loadCities('Turkey');     // async, loads only Turkey's cities
 */
import countryIndex from './countryIndex.json';

// Cache loaded cities in memory so we don't re-fetch
const cache = {};

/**
 * Get all country names (sync, lightweight — just the index keys)
 */
export function getCountryNames() {
  return Object.keys(countryIndex);
}

/**
 * Load cities for a given country name (async, dynamic import)
 * Returns string[] of city names, or [] if country not found.
 */
export async function loadCities(countryName) {
  if (!countryName) return [];
  
  // Check cache first
  if (cache[countryName]) return cache[countryName];
  
  const slug = countryIndex[countryName];
  if (!slug) return [];
  
  try {
    // Webpack will split each JSON into its own chunk
    const mod = await import(`./cities/${slug}.json`);
    const cities = mod.default || mod;
    cache[countryName] = Array.isArray(cities) ? cities : [];
    return cache[countryName];
  } catch (e) {
    console.warn(`Failed to load cities for "${countryName}":`, e);
    return [];
  }
}

/**
 * Preload cities for a country (fire-and-forget, useful for prefetching)
 */
export function preloadCities(countryName) {
  loadCities(countryName).catch(() => {});
}

/**
 * Get cached cities synchronously (returns [] if not yet loaded)
 */
export function getCachedCities(countryName) {
  return cache[countryName] || [];
}
