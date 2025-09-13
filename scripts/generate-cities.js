// Node script: Generate comprehensive country -> cities mapping for Europe, Asia, Middle East (+US)
// Usage: node scripts/generate-cities.js
// Output: overwrites src/data/countryCities.js

const fs = require('fs');
const path = require('path');
const https = require('https');
let CSC = null;
try { CSC = require('country-state-city'); } catch (_) { CSC = null; }

const ROOT = process.cwd();
const dataDir = path.join(ROOT, 'src', 'data');
const worldCitiesPath = path.join(dataDir, 'worldCities.min.json');
const outputPath = path.join(dataDir, 'countryCities.js');

// Load world cities JSON
function loadWorldCities() {
  const raw = fs.readFileSync(worldCitiesPath, 'utf-8');
  const json = JSON.parse(raw);
  if (!Array.isArray(json)) throw new Error('worldCities.min.json not an array');
  return json;
}

// Region country lists (embedded to avoid Node ESM/CJS interop)
const countriesEurope = [
  'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
  'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland',
  'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo',
  'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco',
  'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal',
  'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
  'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'Vatican City'
];
const countriesAsia = [
  'Afghanistan','Armenia','Azerbaijan','Bahrain','Bangladesh','Bhutan','Brunei','Cambodia','China','Cyprus','Georgia','India','Indonesia','Iran','Iraq','Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Laos','Lebanon','Malaysia','Maldives','Mongolia','Myanmar','Nepal','North Korea','Oman','Pakistan','Philippines','Qatar','Saudi Arabia','Singapore','South Korea','Sri Lanka','Syria','Tajikistan','Thailand','Timor-Leste','Turkmenistan','United Arab Emirates','Uzbekistan','Vietnam','Yemen'
];
const countriesMiddleEast = [
  'Bahrain','Cyprus','Egypt','Iran','Iraq','Israel','Jordan','Kuwait','Lebanon','Oman','Palestine','Qatar','Saudi Arabia','Syria','Turkey','United Arab Emirates','Yemen'
];

// Build target country set
function buildTargetCountries() {
  const set = new Set([...countriesEurope, ...countriesAsia, ...countriesMiddleEast, 'United States']);
  return Array.from(set).sort();
}

// Normalize helper
function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Country alias variants (minimal)
function getCountryVariants(name) {
  const aliases = {
    'Czechia': ['Czech Republic'],
    'United Kingdom': ['Great Britain','UK','GB','Britain'],
    'South Korea': ['Republic of Korea'],
    'Türkiye': ['Turkey'],
    "Côte d'Ivoire": ['Ivory Coast'],
    'United States': ['USA','US','U.S.','United States of America'],
  };
  const set = new Set([name, ...(aliases[name] || [])]);
  return Array.from(set);
}

function findLibCountryByName(name) {
  if (!CSC) return null;
  const variants = getCountryVariants(name).map((s) => s.toLowerCase());
  const all = CSC.Country.getAllCountries();
  for (const c of all) {
    const nm = (c.name || '').toLowerCase();
    if (variants.includes(nm)) return c;
  }
  // Try startsWith / contains for tricky names
  for (const c of all) {
    const nm = (c.name || '').toLowerCase();
    if (variants.some((v) => nm.startsWith(v) || nm.includes(v))) return c;
  }
  return null;
}

async function fetchCitiesFromCSC(country) {
  try {
    if (!CSC) return [];
    const libC = findLibCountryByName(country);
    if (!libC || !libC.isoCode) return [];
    const iso = libC.isoCode;
    // Prefer state-wise enumeration (daha kapsamlı)
    let out = new Set();
    const states = CSC.State.getStatesOfCountry(iso) || [];
    if (states.length) {
      for (const st of states) {
        const cities = CSC.City.getCitiesOfState(iso, st.isoCode) || [];
        for (const ct of cities) {
          if (ct && ct.name) out.add(ct.name);
        }
      }
    } else {
      const cities = CSC.City.getCitiesOfCountry(iso) || [];
      for (const ct of cities) { if (ct && ct.name) out.add(ct.name); }
    }
    return Array.from(out);
  } catch (_) { return []; }
}

function postJson(hostname, pathUrl, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload || {});
    const req = https.request({
      hostname,
      path: pathUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body || '{}');
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, json });
        } catch (e) {
          resolve({ status: res.statusCode, ok: false, json: null });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(6000, () => { req.destroy(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function fetchCitiesFromAPI(country) {
  try {
    const variants = getCountryVariants(country);
    for (const v of variants) {
      const res = await postJson('countriesnow.space', '/api/v0.1/countries/cities', { country: v });
      if (res.ok && res.json && Array.isArray(res.json.data)) {
        const arr = res.json.data.filter(Boolean);
        if (arr.length) return arr;
      }
    }
  } catch (_) { /* ignore */ }
  return [];
}

async function fetchCitiesFromStatesAPI(country) {
  try {
    const variants = getCountryVariants(country);
    let states = [];
    // 1) states listesi
    for (const v of variants) {
      const res = await postJson('countriesnow.space', '/api/v0.1/countries/states', { country: v });
      if (res.ok && res.json && Array.isArray(res.json?.data?.states)) {
        states = res.json.data.states.map((x) => x?.name).filter(Boolean);
        if (states.length) break;
      }
    }
    if (!states.length) return [];

    // 2) state -> cities (concurrency: 4)
    const results = new Set();
    const batches = Array.from({ length: Math.ceil(states.length / 4) }, (_, i) => states.slice(i * 4, (i + 1) * 4));
    for (const batch of batches) {
      await Promise.all(batch.map((state) => (async () => {
        try {
          const r = await postJson('countriesnow.space', '/api/v0.1/countries/state/cities', { country, state });
          if (r.ok && Array.isArray(r?.json?.data)) {
            r.json.data.forEach((c) => c && results.add(c));
          }
        } catch (_) { /* ignore */ }
      })()));
      // küçük bir nefes
      await new Promise((r) => setTimeout(r, 120));
    }
    return Array.from(results);
  } catch (_) { return []; }
}

async function generate() {
  const all = loadWorldCities();
  const targets = buildTargetCountries();
  const map = {};

  for (const country of targets) {
    const variants = getCountryVariants(country);
    const cities = new Set();
    // Primary: country-state-city library (en kapsamlı ve güvenilir)
    let list = await fetchCitiesFromCSC(country);
    for (const c of list) cities.add(c);
    for (const v of variants) {
      for (const rec of all) {
        if (rec && rec.country === v && rec.city) cities.add(rec.city);
      }
    }
    list = Array.from(cities).sort((a,b) => a.localeCompare(b));
    // Fallback 1: countries/cities
    if (list.length < 20) {
      const apiList = await fetchCitiesFromAPI(country);
      if (apiList.length > list.length) {
        list = Array.from(new Set([...list, ...apiList])).sort((a,b) => a.localeCompare(b));
      }
    }
    // Fallback 2: states -> state/cities
    if (list.length < 20) {
      const deepList = await fetchCitiesFromStatesAPI(country);
      if (deepList.length > list.length) {
        list = Array.from(new Set([...list, ...deepList])).sort((a,b) => a.localeCompare(b));
      }
    }
    map[country] = list;
    process.stdout.write(`\rProcessed: ${country.padEnd(22)} -> ${String(list.length).padStart(4)} cities   `);
  }

  // Generate JS module
  const header = '// AUTO-GENERATED by scripts/generate-cities.js\n// Comprehensive Country -> Cities mapping for Europe, Asia, Middle East (+US)\n';
  const body = `const countryCities = ${JSON.stringify(map, null, 2)};\n\nexport default countryCities;\n`;
  fs.writeFileSync(outputPath, header + body, 'utf-8');
  console.log(`\nGenerated ${outputPath} with ${Object.keys(map).length} countries.`);
}

generate().catch((e) => { console.error(e); process.exit(1); });
