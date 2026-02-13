#!/usr/bin/env node
/**
 * Generate city JSON files for ALL 250 countries using country-state-city package.
 * Merges with existing countryCities.js data where available.
 * Updates countryIndex.json with complete country list.
 */
const fs = require('fs');
const path = require('path');
const { Country, State, City } = require('country-state-city');

const citiesDir = path.join(__dirname, '..', 'src', 'data', 'cities');
const indexPath = path.join(__dirname, '..', 'src', 'data', 'countryIndex.json');

// Load existing index
let existingIndex = {};
try { existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8')); } catch {}

// Load existing city files (from countryCities.js split)
function loadExistingCities(slug) {
  try {
    const fp = path.join(citiesDir, `${slug}.json`);
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch { return []; }
}

function toFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

if (!fs.existsSync(citiesDir)) fs.mkdirSync(citiesDir, { recursive: true });

const allCountries = Country.getAllCountries();
console.log(`Processing ${allCountries.length} countries from country-state-city...`);

const newIndex = {};
let created = 0;
let updated = 0;
let skipped = 0;

for (const country of allCountries) {
  const name = country.name;
  const slug = toFileName(name);
  const iso = country.isoCode;

  // Get cities from CSC
  const states = State.getStatesOfCountry(iso) || [];
  const cscCities = new Set();
  
  if (states.length) {
    for (const st of states) {
      const cities = City.getCitiesOfState(iso, st.isoCode) || [];
      cities.forEach(c => c?.name && cscCities.add(c.name));
    }
  } else {
    const cities = City.getCitiesOfCountry(iso) || [];
    cities.forEach(c => c?.name && cscCities.add(c.name));
  }

  // Merge with existing data
  const existing = loadExistingCities(slug);
  const merged = new Set([...existing, ...cscCities]);
  const finalCities = Array.from(merged).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const filePath = path.join(citiesDir, `${slug}.json`);
  
  if (existingIndex[name]) {
    // Update existing
    if (finalCities.length > existing.length) {
      fs.writeFileSync(filePath, JSON.stringify(finalCities), 'utf-8');
      updated++;
    } else {
      skipped++;
    }
  } else {
    // New country
    fs.writeFileSync(filePath, JSON.stringify(finalCities), 'utf-8');
    created++;
  }

  newIndex[name] = slug;
}

// Write updated index
const sortedIndex = {};
Object.keys(newIndex).sort().forEach(k => { sortedIndex[k] = newIndex[k]; });
fs.writeFileSync(indexPath, JSON.stringify(sortedIndex, null, 2), 'utf-8');

console.log(`\nResults:`);
console.log(`  Total countries: ${Object.keys(sortedIndex).length}`);
console.log(`  New: ${created}`);
console.log(`  Updated: ${updated}`);
console.log(`  Unchanged: ${skipped}`);
console.log(`  Index size: ${(fs.statSync(indexPath).size / 1024).toFixed(1)} KB`);
