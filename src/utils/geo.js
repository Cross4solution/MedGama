// Utilities to manage countries and their administrative divisions or cities
// Sources: local data files under src/data and remote fallback APIs (encapsulated here)

import countriesEurope from '../data/countriesEurope';
import { loadCities } from '../data/cityLoader';
import countryCodes from '../data/countryCodes';
import countryDialCodes from '../data/countryDialCodes';
import adminDivisions from '../data/adminDivisions';
// country-state-city removed for bundle size optimization (was 8.4 MB chunk)
// All data now comes from local sources: cityLoader, countryCodes, adminDivisions, countryDialCodes

function sanitizeCityNames(country, list) {
  if (!Array.isArray(list)) return list;
  const n = (s) => String(s || '').toLowerCase();
  // Country-specific filters
  if (['United States', 'United States of America', 'USA'].some((v)=> getCountryVariants(country).includes(v))) {
    const badWords = [' county', ' parish', ' census area', ' borough', ' township', ' village', ' town of'];
    return list.filter((name) => {
      const ln = n(name);
      return !badWords.some((bw) => ln.includes(bw));
    });
  }
  // Generic filters
  const genericBad = [' ilçesi', ' district', ' province'];
  return list.filter((name) => {
    const ln = n(name);
    return !genericBad.some((bw) => ln.includes(bw));
  });
}

// Türkiye için kesin 81 il listesi (ilçe/semt yok)
const PROVINCES_TURKEY = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin',
  'Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur',
  'Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan',
  'Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkâri','Hatay','Iğdır','Isparta','İstanbul',
  'İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kırıkkale','Kırklareli','Kırşehir',
  'Kilis','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
  'Şanlıurfa','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat',
  'Zonguldak',
];

export function listTurkeyProvinces() {
  return PROVINCES_TURKEY.slice();
}


// Cache versioning to invalidate older small city lists
const CITY_CACHE_VERSION = 'v9';
const MIN_CITY_THRESHOLD = 30;

// Ülke bazlı özel limitler (boş bırakıyoruz). Varsayılan: 100.
const COUNTRY_CITY_LIMITS = {};

const POPULAR_CITIES = {
  'United States': [
    'New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose',
    'Austin','Jacksonville','San Francisco','Columbus','Fort Worth','Indianapolis','Charlotte','Seattle','Denver','Washington',
    'Boston','Detroit','Nashville','Portland','Memphis','Oklahoma City','Las Vegas','Louisville','Baltimore','Milwaukee',
    'Albuquerque','Tucson','Fresno','Sacramento','Kansas City','Atlanta','Miami','Orlando','Tampa','Pittsburgh',
    'Cleveland','Cincinnati','Raleigh','Salt Lake City','San Antonio','San Diego','St. Louis'
  ],
  Canada: [
    'Toronto','Montreal','Vancouver','Calgary','Edmonton','Ottawa','Quebec City','Winnipeg','Hamilton','Kitchener',
    'London','Halifax','Victoria','Saskatoon','Regina','St. John\'s','Windsor','Sherbrooke','Oshawa','Barrie'
  ],
  Denmark: [
    'Copenhagen','Aarhus','Odense','Aalborg','Esbjerg','Randers','Kolding','Horsens','Vejle','Roskilde'
  ],
  // Italy – show only major/popular cities
  Italy: [
    'Rome','Milano','Milan','Napoli','Naples','Torino','Turin','Palermo','Genova','Genoa','Bologna','Firenze','Florence','Bari','Catania','Venezia','Venice','Verona','Messina','Padova','Padua','Trieste','Taranto','Brescia','Prato','Reggio Calabria','Parma','Modena','Reggio Emilia','Perugia','Livorno','Ravenna','Cagliari','Foggia','Rimini','Salerno','Ferrara','Sassari','Siracusa','Syracuse','Pescara','Monza','Latina','Bergamo','Forlì','Forli','Trento','Vicenza','Terni','Novara','Bolzano','Bozen','Piacenza','Ancona','Arezzo','Andria','Udine','Cesena','La Spezia','Lecce','Pesaro','Alessandria','Barletta','Catanzaro','Pistoia','Brindisi','Pisa','Torre del Greco','Como','Lucca','Pozzuoli','Treviso','Busto Arsizio','Varese'
  ],
  // Italian name variant
  Italia: [
    'Roma','Milano','Napoli','Torino','Palermo','Genova','Bologna','Firenze','Bari','Catania','Venezia','Verona','Messina','Padova','Trieste','Taranto','Brescia','Prato','Reggio Calabria','Parma','Modena','Reggio Emilia','Perugia','Livorno','Ravenna','Cagliari','Foggia','Rimini','Salerno','Ferrara','Sassari','Siracusa','Pescara','Monza','Latina','Bergamo','Forlì','Trento','Vicenza','Terni','Novara','Bolzano','Piacenza','Ancona','Arezzo','Andria','Udine','Cesena','La Spezia','Lecce','Pesaro','Alessandria','Barletta','Catanzaro','Pistoia','Brindisi','Pisa','Torre del Greco','Como','Lucca','Pozzuoli','Treviso','Busto Arsizio','Varese'
  ],
};

// Bazı ülkeler için yalnızca popüler/büyük şehirleri döndür (küçük yerleşimler hariç)
const COUNTRIES_POPULAR_ONLY = new Set([
  'United States',
  'United States of America',
  'USA',
  'US',
  'U.S.',
  'America',
  'ABD',
  'Amerika',
  // Italy
  'Italy','Italia',
]);

function getPopularCitiesList(country) {
  try {
    const variants = getCountryVariants(country);
    const key = Object.keys(POPULAR_CITIES).find((k) => variants.includes(k)) || country;
    const list = POPULAR_CITIES[key] || [];
    return Array.isArray(list) ? Array.from(new Set(list)) : [];
  } catch { return []; }
}

function applyCityLimit(country, list) {
  const lim = (COUNTRY_CITY_LIMITS[country] ?? 100); // varsayılan 100
  if (!Array.isArray(list)) return list;
  const unique = Array.from(new Set(list));
  const sorted = unique.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  if (sorted.length <= lim) return sorted;

  // Distribute picks across alphabet buckets (A-Z, others) to avoid only 'A' cities
  const buckets = new Map();
  for (const name of sorted) {
    const ch = String(name).trim().charAt(0).toUpperCase();
    const key = /^[A-Z]$/.test(ch) ? ch : '#';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(name);
  }
  // Pre-seed with popular cities (if present in dataset)
  const selected = [];
  let popular = [];
  try {
    const variants = getCountryVariants(country);
    const key = Object.keys(POPULAR_CITIES).find((k)=> variants.includes(k)) || country;
    popular = POPULAR_CITIES[key] || [];
  } catch {
    popular = POPULAR_CITIES[country] || [];
  }
  for (const p of popular) {
    const hit = sorted.find((n) => {
      const nn = normalize(n);
      const pp = normalize(p);
      return nn === pp || nn.startsWith(pp) || nn.includes(pp);
    });
    if (hit) {
      if (!selected.includes(hit)) selected.push(hit);
    } else {
      // Veri kaynaklarında yoksa bile popüler şehri enjekte et
      if (!selected.includes(p)) selected.push(p);
    }
    if (selected.length >= lim) break;
  }
  // Remove preselected from buckets (avoid iterating Map entries directly for TS downlevel)
  if (selected.length) {
    const entryKeys = Array.from(buckets.keys());
    for (const k of entryKeys) {
      const arr = buckets.get(k) || [];
      buckets.set(k, arr.filter((n) => !selected.includes(n)));
    }
  }
  // Seed selection with 1 from each non-empty bucket (round 1)
  const keys = Array.from(buckets.keys()).sort();
  for (const k of keys) {
    if (selected.length >= lim) break;
    const arr = buckets.get(k);
    if (arr && arr.length) selected.push(arr.shift());
  }
  // Round-robin fill until limit reached
  let added = true;
  while (selected.length < lim && added) {
    added = false;
    for (const k of keys) {
      if (selected.length >= lim) break;
      const arr = buckets.get(k);
      if (arr && arr.length) {
        selected.push(arr.shift());
        added = true;
      }
    }
  }
  // Final alphabetical order
  return Array.from(new Set(selected)).sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).slice(0, lim);
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

// Ülkelerden bazıları için kullanıcı deneyimi gereği doğrudan şehir listesi (eyalet aşaması olmadan)
const COUNTRIES_FORCE_CITIES = new Set([
  'United Kingdom',
  'Canada',
  'Denmark',
  'Turkey', 'Türkiye', 'Turkiye',
  'United States', 'United States of America', 'USA',
]);

// Bazı ülkelerde CSC şehir listesi il/ilçe karışık gelebilir; bu ülkelerde eyalet/il isimlerini şehir olarak kullan
const COUNTRIES_USE_STATES_AS_CITIES = new Set([
  'Turkey', 'Türkiye', 'Turkiye',
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

// Major island nations that should NEVER be excluded (important for health tourism)
const MAJOR_ISLAND_COUNTRIES = new Set([
  'United Kingdom', 'Japan', 'Australia', 'New Zealand', 'Indonesia', 'Philippines',
  'Ireland', 'Iceland', 'Singapore', 'Sri Lanka', 'Taiwan', 'Cuba', 'Cyprus',
  'Dominican Republic', 'Jamaica', 'Madagascar', 'Haiti', 'Trinidad and Tobago',
  'Bahrain', 'Malta', 'Papua New Guinea',
]);

// Ada/ada benzeri isimleri yakalamak için sezgisel filtre
function isLikelyIsland(name = '') {
  const n = String(name);
  // Never exclude major island nations
  if (MAJOR_ISLAND_COUNTRIES.has(n)) return false;
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

export async function listCountries(regions = ['Europe', 'Asia', 'MiddleEast']) {
  const targetSets = [];
  if (regions.includes('Europe')) targetSets.push(countriesEurope);
  if (regions.includes('Asia')) targetSets.push(countriesAsia);
  if (regions.includes('MiddleEast')) targetSets.push(countriesMiddleEast);
  const targets = new Set(targetSets.flat());
  const alwaysInclude = ['United States'];
  const out = new Set(alwaysInclude);
  targets.forEach((t) => out.add(t));
  return Array.from(out).sort();
}

// Tüm dünyadaki ülkeleri döndürür. CSC erişimi varsa tamamını, yoksa mevcut statik listelerin birleşimini kullanır.
export async function listCountriesAll(options = {}) {
  const { excludeIslands = false, excludeNoCities = false } = options;
  const dialNames = Object.keys(countryDialCodes || {});
  const merged = new Set([
    ...dialNames,
    ...countriesEurope,
    ...countriesAsia,
    ...countriesMiddleEast,
    'United States',
  ]);
  let out = Array.from(merged);
  if (excludeIslands) out = out.filter((n) => !isLikelyIsland(n));
  if (excludeNoCities) out = out.filter((n) => !NO_CITY_COUNTRIES.has(n));
  return out.sort((a,b)=> a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function getFlagCode(countryName) {
  if (!countryName) return null;
  const stripParen = (s) => s?.toString().replace(/\s*\([^)]*\)\s*/g, '').trim();
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

// Parantez içi ibareleri kırpmak için yardımcı (örn: "United States (US)")
function stripParen(s) {
  try { return s?.toString().replace(/\s*\([^)]*\)\s*/g, '').trim(); } catch { return s; }
}

function getCountryVariants(name) {
  const base = String(name || '');
  const n = normalize(base);
  const out = new Set([base]);
  // Basit eşanlamlılar
  const aliases = {
    'United States': ['USA','U.S.A','US','America','United States of America','ABD','Amerika'],
    'United Kingdom': ['UK','U.K','Britain','England','Great Britain'],
    'Turkey': ['Türkiye','Turkiye','Republic of Turkey'],
    'Côte d’Ivoire': ['Ivory Coast','Cote d Ivoire','Cote d\'Ivoire','Cote D Ivoire','Cote D\'Ivoire','Cote dIvoire','Cote DIvoire','Cote Divoire','Cote-d\'Ivoire','Côte d\'Ivoire','Cote Dlvoire','Cote Dlvoreie','Cote de Ivoire','Cote dIvore'],
  };
  Object.entries(aliases).forEach(([k, arr]) => {
    if (normalize(k) === n) arr.forEach((a)=>out.add(a));
    if (arr.some((a)=> normalize(a) === n)) out.add(k);
  });
  return Array.from(out);
}

export async function loadStatesOnly(country) {
  // Yerel adminDivisions kullan
  const variants = getCountryVariants(country);
  for (const v of variants) {
    const list = adminDivisions[v] || adminDivisions[v?.trim()];
    if (Array.isArray(list) && list.length) return list;
  }
  const list = adminDivisions[country] || adminDivisions[country?.trim()] || [];
  return Array.isArray(list) ? list : [];
}

export async function loadCitiesOnly(country) {
  // ABD gibi ülkelerde yalnızca popüler/büyük şehirleri dön
  try {
    const raw = (country || '').trim();
    const base = stripParen(raw);
    if (COUNTRIES_POPULAR_ONLY.has(raw) || COUNTRIES_POPULAR_ONLY.has(base) || getCountryVariants(raw).some((v) => COUNTRIES_POPULAR_ONLY.has(v) || COUNTRIES_POPULAR_ONLY.has(stripParen(v)))) {
      const popular = getPopularCitiesList(raw);
      if (popular && popular.length) {
        return applyCityLimit(raw, popular);
      }
    }
  } catch {}
  // 1) Eyalet/il olarak gösterilecek ülkeler için adminDivisions kullan
  try {
    const raw = (country || '').trim();
    if (COUNTRIES_USE_STATES_AS_CITIES.has(raw) || getCountryVariants(raw).some((v)=>COUNTRIES_USE_STATES_AS_CITIES.has(v))) {
      const admin = adminDivisions[raw] || adminDivisions[getCountryVariants(raw).find((v)=>adminDivisions[v])];
      if (Array.isArray(admin) && admin.length) return applyCityLimit(raw, admin);
      if (getCountryVariants(raw).some((v)=>['Turkey','Türkiye','Turkiye'].includes(v))) {
        return PROVINCES_TURKEY;
      }
    }
  } catch {}

  // 2) countryCities quick list (dynamic import)
  const raw2 = (country || '').trim();
  const quick = await loadCities(raw2) || [];
  if (Array.isArray(quick) && quick.length) return applyCityLimit(raw2, sanitizeCityNames(raw2, quick));

  // 3) worldCities filtered (dynamic import, TS uyarısını bastır)
  try {
    // @ts-ignore - dynamic JSON import in JS file
    const mod = await import('../data/worldCities.min.json');
    const all = mod?.default || mod;
    if (Array.isArray(all)) {
      const variants = getCountryVariants(raw2);
      const set = new Set();
      for (const v of variants) {
        for (const rec of all) {
          if (rec?.country === v && rec?.city) set.add(rec.city);
        }
      }
      const arr = Array.from(set);
      if (arr.length) return applyCityLimit(raw2, sanitizeCityNames(raw2, arr));
    }
  } catch (_) { /* ignore */ }

  // 4) last resort
  return applyCityLimit(country, sanitizeCityNames(country, quick));
}

export async function loadPreferredAdminOrCities(country) {
  // Global tercih: şehirler. Şehirler yeterli değilse eyalet/il.
  // Özel durum: FORCE_CITIES → her zaman şehir.
  // Türkiye özel kuralı: daima 81 il döndür
  try {
    const variants = getCountryVariants(country);
    const n = (String(country||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const isTr = variants.some((v)=>['Turkey','Türkiye','Turkiye'].includes(v))
      || n === 'turkey' || n === 'turkiye' || n === 'türkiye';
    if (isTr) {
      try { localStorage.setItem(`cities_${CITY_CACHE_VERSION}_${country}`, JSON.stringify({ data: PROVINCES_TURKEY, ts: Date.now() })); } catch {}
      return { type: 'city', list: PROVINCES_TURKEY };
    }
  } catch {}
  // ABD ve benzeri: yalnızca popüler/büyük şehirler (cache'e de bunu yaz)
  try {
    const base = stripParen(country);
    if (COUNTRIES_POPULAR_ONLY.has(country) || COUNTRIES_POPULAR_ONLY.has(base) || getCountryVariants(country).some((v) => COUNTRIES_POPULAR_ONLY.has(v) || COUNTRIES_POPULAR_ONLY.has(stripParen(v)))) {
      const popular = getPopularCitiesList(country);
      const list = Array.isArray(popular) ? popular : [];
      try { localStorage.setItem(`cities_${CITY_CACHE_VERSION}_${country}`, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
      return { type: 'city', list };
    }
  } catch {}
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
