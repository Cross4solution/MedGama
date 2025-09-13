// Utilities to manage countries and their administrative divisions or cities
// Sources: local data files under src/data and remote fallback APIs (encapsulated here)

import countriesEurope from '../data/countriesEurope';
// countryCities: { [countryName]: string[] }
import countryCities from '../data/countryCities';
import countryCodes from '../data/countryCodes';
import adminDivisions from '../data/adminDivisions';
import { Country as CSCCountry, State as CSCState, City as CSCCity } from 'country-state-city';

// Minimal Asia and Middle East lists (can be expanded as needed)
export const countriesAsia = [
  'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China',
  'Cyprus', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea',
  'Oman', 'Pakistan', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria',
  'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkmenistan', 'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'
];

export const countriesMiddleEast = [
  'Bahrain', 'Cyprus', 'Egypt', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman', 'Palestine',
  'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'United Arab Emirates', 'Yemen'
];

// Ülkelerden bazıları için (örn. United Kingdom) "eyalet" yerine doğrudan şehir listesi tercih edilir
const COUNTRIES_FORCE_CITIES = new Set([
  'United Kingdom'
]);

export function listCountries(regions = ['Europe', 'Asia', 'MiddleEast']) {
  // Bölge listeleri ile CSC ülke adlarını kesiştirerek döndür
  const targetSets = [];
  if (regions.includes('Europe')) targetSets.push(countriesEurope);
  if (regions.includes('Asia')) targetSets.push(countriesAsia);
  if (regions.includes('MiddleEast')) targetSets.push(countriesMiddleEast);
  const targets = new Set(targetSets.flat());
  const alwaysInclude = ['United States'];
  const out = new Set(alwaysInclude);
  try {
    const all = CSCCountry.getAllCountries() || [];
    for (const c of all) {
      const name = c?.name;
      if (!name) continue;
      if (targets.has(name)) out.add(name);
    }
  } catch {
    // CSC yoksa statik listeleri döndür
    targets.forEach((t) => out.add(t));
  }
  return Array.from(out).sort();
}

export function getFlagCode(countryName) {
  // countryCodes: { name -> iso2 lower }
  if (!countryName) return null;
  const stripParen = (s) => s?.toString().replace(/\s*\([^)]*\)\s*/g, '').trim();
  const direct = countryCodes[countryName] || countryCodes[countryName?.toLowerCase()] || countryCodes[stripParen(countryName)] || countryCodes[stripParen(countryName)?.toLowerCase()];
  if (direct) return direct;
  const variants = getCountryVariants(countryName);
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const code = countryCodes[v] || countryCodes[v?.toLowerCase()] || countryCodes[stripParen(v)] || countryCodes[stripParen(v)?.toLowerCase()];
    if (code) return code;
  }
  return null;
}

function normalize(s) {
  return s?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getCountryVariants(name) {
  const aliases = {
    'Czechia': ['Czech Republic'],
    'United Kingdom': ['Great Britain', 'UK', 'GB', 'Britain', 'England'],
    'United States': ['United States of America', 'USA', 'US', 'U.S.'],
    'Russia': ['Russian Federation'],
    'South Korea': ['Republic of Korea'],
    'Türkiye': ['Turkey'],
    'Ivory Coast': ["Côte d'Ivoire"],
  };
  const set = new Set([name, ...(aliases[name] || [])]);
  return Array.from(set);
}

export async function loadStatesOnly(country) {
  // Öncelik CSC: ülke ISO -> eyalet/il isimleri
  try {
    const all = CSCCountry.getAllCountries() || [];
    const found = all.find((c) => (c?.name === country))
      || all.find((c) => getCountryVariants(country).includes(c?.name));
    if (found && found.isoCode) {
      const states = CSCState.getStatesOfCountry(found.isoCode) || [];
      const names = states.map((s) => s?.name).filter(Boolean);
      if (names.length) return names;
    }
  } catch {}
  // Fallback: yerel adminDivisions
  const list = adminDivisions[country] || adminDivisions[country?.trim()] || [];
  return Array.isArray(list) ? list : [];
}

export async function loadCitiesOnly(country) {
  // 1) CSC: ülke ISO -> şehir isimleri (gerekirse state bazında)
  try {
    const all = CSCCountry.getAllCountries() || [];
    const found = all.find((c) => (c?.name === country))
      || all.find((c) => getCountryVariants(country).includes(c?.name));
    if (found && found.isoCode) {
      const states = CSCState.getStatesOfCountry(found.isoCode) || [];
      const out = new Set();
      if (states.length) {
        for (const st of states) {
          const cities = CSCCity.getCitiesOfState(found.isoCode, st.isoCode) || [];
          cities.forEach((ct) => ct?.name && out.add(ct.name));
        }
      } else {
        const cities = CSCCity.getCitiesOfCountry(found.isoCode) || [];
        cities.forEach((ct) => ct?.name && out.add(ct.name));
      }
      const arr = Array.from(out);
      if (arr.length) return arr;
    }
  } catch {}

  // 2) countryCities quick list
  const quick = countryCities[country] || [];
  if (Array.isArray(quick) && quick.length) return quick;

  // 3) worldCities filtered (dynamic import, TS uyarısını bastır)
  try {
    // @ts-ignore - dynamic JSON import in JS file
    const mod = await import('../data/worldCities.min.json');
    const all = mod?.default || mod;
    if (Array.isArray(all)) {
      const variants = getCountryVariants(country);
      const set = new Set();
      for (const v of variants) {
        for (const rec of all) {
          if (rec?.country === v && rec?.city) set.add(rec.city);
        }
      }
      const arr = Array.from(set);
      if (arr.length) return arr;
    }
  } catch (_) { /* ignore */ }

  // 4) last resort
  return quick;
}

export async function loadPreferredAdminOrCities(country) {
  // Prefer administrative divisions (states/provinces) if available, else cities
  // Cache per country for 30 days using states_{country} or cities_{country}
  // Özel durum: FORCE_CITIES
  if (COUNTRIES_FORCE_CITIES.has(country)) {
    // v2 cache anahtarı ile eski küçük listeleri atla
    try {
      const ck = `cities_v2_${country}`;
      const raw = localStorage.getItem(ck);
      if (raw) {
        const cached = JSON.parse(raw);
        const TTL = 30 * 24 * 60 * 60 * 1000;
        const fresh = cached?.ts && (Date.now() - cached.ts < TTL);
        const okSize = Array.isArray(cached?.data) && cached.data.length >= 20;
        if (fresh && okSize) return { type: 'city', list: cached.data };
      }
    } catch {}
    const cities = await loadCitiesOnly(country);
    const list = Array.isArray(cities) ? cities : [];
    try { localStorage.setItem(`cities_v2_${country}`, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
    return { type: 'city', list };
  }

  try {
    // Try states cache first (v2)
    const sKey = `states_v2_${country}`;
    const sRaw = localStorage.getItem(sKey);
    if (sRaw) {
      const cached = JSON.parse(sRaw);
      const TTL = 30 * 24 * 60 * 60 * 1000;
      const fresh = cached?.ts && (Date.now() - cached.ts < TTL);
      const okSize = Array.isArray(cached?.data) && cached.data.length >= 1;
      if (fresh && okSize) {
        return { type: 'state', list: cached.data };
      }
    }
  } catch {}

  const states = await loadStatesOnly(country);
  if (states.length) {
    try { localStorage.setItem(`states_v2_${country}`, JSON.stringify({ data: states, ts: Date.now() })); } catch {}
    return { type: 'state', list: states };
  }

  try {
    const cKey = `cities_v2_${country}`;
    const cRaw = localStorage.getItem(cKey);
    if (cRaw) {
      const cached = JSON.parse(cRaw);
      const TTL = 7 * 24 * 60 * 60 * 1000;
      const fresh = cached?.ts && (Date.now() - cached.ts < TTL);
      const okSize = Array.isArray(cached?.data) && cached.data.length >= 20;
      if (fresh && okSize) return { type: 'city', list: cached.data };
    }
  } catch {}

  const cities = await loadCitiesOnly(country);
  const list = Array.isArray(cities) ? cities : [];
  try { localStorage.setItem(`cities_v2_${country}`, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
  return { type: 'city', list };
}
