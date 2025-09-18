// Utilities to manage countries and their administrative divisions or cities
// Sources: local data files under src/data and remote fallback APIs (encapsulated here)

import countriesEurope from '../data/countriesEurope';
// countryCities: { [countryName]: string[] }
import countryCities from '../data/countryCities';
import countryCodes from '../data/countryCodes';
import adminDivisions from '../data/adminDivisions';
import { Country as CSCCountry, State as CSCState, City as CSCCity } from 'country-state-city';

// Cache versioning to invalidate older small city lists
const CITY_CACHE_VERSION = 'v4';
const MIN_CITY_THRESHOLD = 30;

// Ülke bazlı şehir sayısı limiti (isteğe göre azaltma)
const COUNTRY_CITY_LIMITS = {
  Canada: 30,
  Denmark: 30,
};

function applyCityLimit(country, list) {
  const lim = COUNTRY_CITY_LIMITS[country];
  if (!lim || !Array.isArray(list)) return list;
  if (list.length <= lim) return list;
  const sorted = Array.from(new Set(list)).sort((a,b) => a.localeCompare(b));
  return sorted.slice(0, lim);
}

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
  'United Kingdom',
  'Canada',
  'Denmark',
]);

// Ada ülkeleri (genişletilebilir). Kullanıcı isteğine göre hariç bırakılabilir.
const ISLAND_COUNTRIES = new Set([
  // Europe
  'Iceland','Ireland','United Kingdom','Malta','Cyprus','Isle of Man','Jersey','Guernsey','Faroe Islands','Greenland','Åland Islands','Aland Islands',
  // Asia
  'Bahrain','Singapore','Japan','Indonesia','Philippines','Sri Lanka','Taiwan','Maldives','Timor-Leste',
  // Africa & Indian Ocean
  'Madagascar','Seychelles','Mauritius','Comoros','Cape Verde','Cabo Verde','Mayotte','Réunion','Reunion',
  // Oceania (tümü ada ya da adalar devleti)
  'Australia','New Zealand','Fiji','Papua New Guinea','Samoa','Tonga','Kiribati','Micronesia','Marshall Islands','Solomon Islands','Vanuatu','Palau','Nauru','Tuvalu','Cook Islands','Niue','Tokelau','Wallis and Futuna','New Caledonia','French Polynesia',
  // Americas / Caribbean
  'Antigua and Barbuda','Bahamas','Barbados','Cuba','Dominica','Dominican Republic','Grenada','Haiti','Jamaica','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Trinidad and Tobago','Aruba','Curaçao','Curacao','Bonaire','Cayman Islands','Bermuda','Turks and Caicos Islands','British Virgin Islands','U.S. Virgin Islands','Puerto Rico','Montserrat','Anguilla','Guadeloupe','Martinique','Saint Barthélemy','Saint Martin','Saint Martin (French part)','Sint Maarten (Dutch part)'
]);

// Ada/adanın yanı sıra ada bölgeleri/özel idari bölgeler (ülke listesinde görülebilenler)
const ISLAND_TERRITORIES = new Set([
  'Hong Kong','Hong Kong SAR China','Macao','Macao SAR China','Macau','Guam','American Samoa','Northern Mariana Islands','Saint Pierre and Miquelon',
  'British Indian Ocean Territory',
]);

// Ada/ada benzeri isimleri yakalamak için sezgisel filtre
function isLikelyIsland(name = '') {
  const n = String(name);
  if (ISLAND_COUNTRIES.has(n) || ISLAND_TERRITORIES.has(n)) return true;
  const islandishKeywords = [
    ' Island', ' Islands', 'Isle', 'Âland', 'Åland', 'Cayman', 'Bermuda', 'Greenland',
    'Faroe', 'Falkland', 'Guadeloupe', 'Martinique', 'Réunion', 'Reunion', 'Mayotte',
    'New Caledonia', 'French Polynesia', 'Wallis and Futuna', 'Curacao', 'Curaçao',
    'Aruba', 'Guam', 'Puerto Rico', 'American Samoa', 'Northern Mariana', 'Tokelau',
    'Niue', 'Cook Islands', 'Montserrat', 'Anguilla', 'Antilles', 'Bonaire',
    'Turks and Caicos', 'Saint Pierre and Miquelon'
  ];
  return islandishKeywords.some((kw) => n.includes(kw));
}

// Şehir listesi bulunmayan/simge mikro-ülkeler veya araştırma bölgeleri
const NO_CITY_COUNTRIES = new Set([
  'Antarctica',
  'Heard Island and McDonald Islands',
  'Bouvet Island',
  'French Southern Territories',
  'South Georgia and the South Sandwich Islands',
  'Svalbard and Jan Mayen',
  'Vatican City','Vatican City State','Holy See',
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

// Tüm dünyadaki ülkeleri döndürür. CSC erişimi varsa tamamını, yoksa mevcut statik listelerin birleşimini kullanır.
export function listCountriesAll(options = {}) {
  const { excludeIslands = false, excludeNoCities = false } = options;
  try {
    const all = CSCCountry.getAllCountries() || [];
    let names = Array.from(new Set(all.map((c) => c?.name).filter(Boolean)));
    if (excludeIslands) names = names.filter((n) => !isLikelyIsland(n));
    if (excludeNoCities) names = names.filter((n) => !NO_CITY_COUNTRIES.has(n));
    return names.sort();
  } catch {
    // Fallback: Avrupa + Asya + Orta Doğu + "United States" birleşimi
    const merged = new Set([
      ...countriesEurope,
      ...countriesAsia,
      ...countriesMiddleEast,
      'United States',
    ]);
    let out = Array.from(merged);
    if (excludeIslands) out = out.filter((n) => !isLikelyIsland(n));
    if (excludeNoCities) out = out.filter((n) => !NO_CITY_COUNTRIES.has(n));
    return out.sort();
  }
}

export function getFlagCode(countryName) {
  // Önce CSC üzerinden ISO2 çözümlemeye çalış (tüm dünya kapsaması için en sağlam yol)
  if (!countryName) return null;
  const stripParen = (s) => s?.toString().replace(/\s*\([^)]*\)\s*/g, '').trim();
  try {
    const all = CSCCountry.getAllCountries() || [];
    const variants = [countryName, ...getCountryVariants(countryName)].map(stripParen);
    for (const v of variants) {
      const hit = all.find((c) => c?.name === v);
      if (hit?.isoCode) return String(hit.isoCode).toLowerCase();
    }
  } catch {}

  // Fallback: yerel map
  const direct = countryCodes[countryName]
    || countryCodes[countryName?.toLowerCase()]
    || countryCodes[stripParen(countryName)]
    || countryCodes[stripParen(countryName)?.toLowerCase()];
  if (direct) return direct;
  // Özel: Côte d’Ivoire / Ivory Coast için geniş algılama
  try {
    const nRaw = normalize(countryName || '');
    const n = nRaw.replace(/[-_]+/g, ' ');
    if (n.includes('ivory') || n.includes('cote d ivoire') || n.includes('cote dvoire') || n.includes('cote divoire')) {
      return 'ci';
    }
    // Özel: Saint Martin (French part) ve Sint Maarten (Dutch part)
    if (n.includes('saint martin') && n.includes('french')) {
      return 'mf';
    }
    if (n.includes('sint maarten') || (n.includes('saint martin') && n.includes('dutch'))) {
      return 'sx';
    }
  } catch {}
  const variants = getCountryVariants(countryName);
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const code = countryCodes[v]
      || countryCodes[v?.toLowerCase()]
      || countryCodes[stripParen(v)]
      || countryCodes[stripParen(v)?.toLowerCase()];
    if (code) return code;
  }
  return null;
}

function normalize(s) {
  return s?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getCountryVariants(name) {
  const base = String(name || '');
  const n = normalize(base);
  const out = new Set([base]);
  // Basit eşanlamlılar
  const aliases = {
    'United States': ['USA','U.S.A','US','America','United States of America','ABD','Amerika'],
    'United Kingdom': ['UK','U.K','Britain','England','Great Britain'],
    'Côte d’Ivoire': ['Ivory Coast','Cote d Ivoire','Cote d\'Ivoire','Cote D Ivoire','Cote D\'Ivoire','Cote dIvoire','Cote DIvoire','Cote Divoire','Cote-d\'Ivoire','Côte d\'Ivoire','Cote Dlvoire','Cote Dlvoreie','Cote de Ivoire','Cote dIvore'],
  };
  Object.entries(aliases).forEach(([k, arr]) => {
    if (normalize(k) === n) arr.forEach((a)=>out.add(a));
    if (arr.some((a)=> normalize(a) === n)) out.add(k);
  });
  return Array.from(out);
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
      let arr = Array.from(out);
      if (arr.length) {
        // Eğer CSC az sayıda döndürdüyse diğer kaynaklarla birleştir
        const FORCE_MERGE_COUNTRIES = new Set(['Canada','United States','India','China','Brazil','Russia']);
        if (arr.length < 150 || FORCE_MERGE_COUNTRIES.has(country)) {
          const quick = countryCities[country] || [];
          try {
            // @ts-ignore - dynamic JSON import in JS file
            const mod = await import('../data/worldCities.min.json');
            const all = mod?.default || mod;
            if (Array.isArray(all)) {
              const variants = getCountryVariants(country);
              const extra = new Set(arr);
              for (const v of variants) {
                for (const rec of all) {
                  if (rec?.country === v && rec?.city) extra.add(rec.city);
                }
              }
              arr = Array.from(extra);
            }
          } catch {}
          if (Array.isArray(quick) && quick.length) {
            const merged = new Set(arr);
            quick.forEach((c)=> merged.add(c));
            arr = Array.from(merged);
          }
        }
        return applyCityLimit(country, arr);
      }
    }
  } catch {}

  // 2) countryCities quick list
  const quick = countryCities[country] || [];
  if (Array.isArray(quick) && quick.length) return applyCityLimit(country, quick);

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
      if (arr.length) return applyCityLimit(country, arr);
    }
  } catch (_) { /* ignore */ }

  // 4) last resort
  return applyCityLimit(country, quick);
}

export async function loadPreferredAdminOrCities(country) {
  // Global tercih: şehirler. Şehirler yeterli değilse eyalet/il.
  // Özel durum: FORCE_CITIES → her zaman şehir.
  if (COUNTRIES_FORCE_CITIES.has(country)) {
    try {
      const ck = `cities_${CITY_CACHE_VERSION}_${country}`;
      const raw = localStorage.getItem(ck);
      if (raw) {
        const cached = JSON.parse(raw);
        const TTL = 30 * 24 * 60 * 60 * 1000;
        const fresh = cached?.ts && (Date.now() - cached.ts < TTL);
        const okSize = Array.isArray(cached?.data) && cached.data.length >= MIN_CITY_THRESHOLD;
        const lim = COUNTRY_CITY_LIMITS[country];
        const exceedsLimit = lim && Array.isArray(cached?.data) && cached.data.length > lim;
        if (fresh && okSize && !exceedsLimit) return { type: 'city', list: applyCityLimit(country, cached.data) };
      }
    } catch {}
    const cities = await loadCitiesOnly(country);
    const list = Array.isArray(cities) ? cities : [];
    try { localStorage.setItem(`cities_${CITY_CACHE_VERSION}_${country}`, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
    return { type: 'city', list };
  }

  // 1) Önce şehir cache'ini dene
  try {
    const cKey = `cities_${CITY_CACHE_VERSION}_${country}`;
    const cRaw = localStorage.getItem(cKey);
    if (cRaw) {
      const cached = JSON.parse(cRaw);
      const TTL = 7 * 24 * 60 * 60 * 1000;
      const fresh = cached?.ts && (Date.now() - cached.ts < TTL);
      const okSize = Array.isArray(cached?.data) && cached.data.length >= MIN_CITY_THRESHOLD;
      const lim = COUNTRY_CITY_LIMITS[country];
      const exceedsLimit = lim && Array.isArray(cached?.data) && cached.data.length > lim;
      if (fresh && okSize && !exceedsLimit) return { type: 'city', list: cached.data };
    }
  } catch {}

  // 2) Şehirleri yükle, yeterliyse dön ve cache'le
  {
    const cities = await loadCitiesOnly(country);
    if (Array.isArray(cities) && cities.length >= MIN_CITY_THRESHOLD) {
      try { localStorage.setItem(`cities_${CITY_CACHE_VERSION}_${country}`, JSON.stringify({ data: cities, ts: Date.now() })); } catch {}
      return { type: 'city', list: cities };
    }
  }

  // 3) Eyalet/il cache
  try {
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

  // 4) Eyalet/il yükle; yoksa son kez şehirleri dön (az da olsa)
  const states = await loadStatesOnly(country);
  if (Array.isArray(states) && states.length) {
    try { localStorage.setItem(`states_v2_${country}`, JSON.stringify({ data: states, ts: Date.now() })); } catch {}
    return { type: 'state', list: states };
  }

  const citiesFallback = await loadCitiesOnly(country);
  const list = Array.isArray(citiesFallback) ? citiesFallback : [];
  try { localStorage.setItem(`cities_${CITY_CACHE_VERSION}_${country}`, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
  return { type: 'city', list };
}
