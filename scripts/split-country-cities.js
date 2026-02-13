#!/usr/bin/env node
/**
 * Split countryCities.js into per-country JSON files for dynamic import.
 * Also generates a lightweight country index (name + code) for static use.
 */
const fs = require('fs');
const path = require('path');

// Read the source file
const srcPath = path.join(__dirname, '..', 'src', 'data', 'countryCities.js');
const raw = fs.readFileSync(srcPath, 'utf-8');

// Extract the object by evaluating (safe since it's our own generated file)
// Remove export default and const declaration to get pure object
let cleaned = raw
  .replace(/^\/\/.*$/gm, '') // remove comments
  .replace(/const\s+countryCities\s*=\s*/, '')
  .replace(/export\s+default\s+countryCities;\s*$/, '')
  .trim();

// Remove trailing semicolon if present
if (cleaned.endsWith(';')) cleaned = cleaned.slice(0, -1);

let countryCities;
try {
  countryCities = JSON.parse(cleaned);
} catch (e) {
  // If JSON.parse fails, try eval (the file uses JS object syntax)
  try {
    countryCities = eval('(' + cleaned + ')');
  } catch (e2) {
    console.error('Failed to parse countryCities.js:', e2.message);
    process.exit(1);
  }
}

const outDir = path.join(__dirname, '..', 'src', 'data', 'cities');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const countryNames = Object.keys(countryCities);
console.log(`Found ${countryNames.length} countries`);

// Sanitize country name to safe filename
function toFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate per-country JSON files
const index = {};
let totalCities = 0;

for (const country of countryNames) {
  const cities = countryCities[country];
  const fileName = toFileName(country);
  const filePath = path.join(outDir, `${fileName}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(cities), 'utf-8');
  index[country] = fileName;
  totalCities += cities.length;
}

// Generate country index file (country name -> file slug mapping)
const indexPath = path.join(__dirname, '..', 'src', 'data', 'countryIndex.json');
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');

console.log(`Generated ${countryNames.length} city files in src/data/cities/`);
console.log(`Generated country index at src/data/countryIndex.json`);
console.log(`Total cities: ${totalCities}`);
console.log(`Index file size: ${(fs.statSync(indexPath).size / 1024).toFixed(1)} KB`);
