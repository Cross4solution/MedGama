// Data layer for programmatic SEO landing pages (/tedaviler/[specialty]/[city]).
//
// IMPORTANT — backend reality (verified against live API + controllers):
//  - GET /api/doctors supports specialty_id + city_id filters, BUT seeded
//    doctors have city_id = null. City info lives in the embedded
//    clinic.address free-text string ("Levent, İstanbul, Türkiye").
//  - GET /api/clinics index only supports a `name` filter — NO specialty/city
//    filter, and the brief list has no specialty field. City is only in the
//    `address` string.
// => We fetch the full lists once (resilient, cached) and filter in-app:
//      * specialty match via doctor.doctor_profile.specialty_id
//      * city match via clinic.address containing the city name (+aliases)
//    This is robust to the missing/partial backend filters.

import { fetchJson } from './seo-server.js';
import { slugify, trName } from './slug.js';
import { aramaAnahtari } from '../utils/searchNormalize.js';

const REVALIDATE = 3600;

/** Laravel paginator → array. Resilient: never throws. */
function asList(json, key) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data; // paginator
  if (key && Array.isArray(json?.[key])) return json[key]; // {specialties:[]}
  return [];
}

export async function getSpecialties() {
  const json = await fetchJson('/api/catalog/specialties', REVALIDATE);
  return asList(json, 'specialties');
}

export async function getCities() {
  const json = await fetchJson('/api/catalog/cities', REVALIDATE);
  return asList(json, 'cities');
}

export async function getAllDoctors() {
  const json = await fetchJson('/api/doctors?per_page=1000', REVALIDATE);
  return asList(json);
}

export async function getAllClinics() {
  const json = await fetchJson('/api/clinics?per_page=1000', REVALIDATE);
  return asList(json);
}

/**
 * City-name aliases used to match against free-text clinic addresses.
 *
 * `aramaAnahtari` ile normalleştiriliyor. Sebebi ölçüldü: adresler serbest
 * metin ve bir kısmı aksansız yazılıyor ("Levent, Istanbul"). Ham
 * `toLowerCase()` ile "İstanbul" ile "Istanbul" EŞLEŞMİYORDU — o klinikler
 * kendi şehirlerinin sayfasında hiç görünmüyordu.
 */
function cityNeedles(city) {
  const names = new Set();
  const push = (v) => {
    const s = aramaAnahtari(String(v || '').trim());
    if (s) names.add(s);
  };
  push(trName(city));
  push(city?.name);
  push(city?.name_translations?.en);
  return [...names];
}

/** Regex için kaçış. */
function kacir(metin) {
  return metin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Does a free-text address mention this city?
 *
 * Eşleşme KELİME SINIRINDA. Ham alt dize araması yanlış sonuç veriyordu ve
 * bu ölçüldü:
 *
 *   şehir "Van"  ← "Divan Yolu Cad., Fatih, İstanbul"
 *   şehir "Bolu" ← "Bolulu Mah., Düzce"
 *
 * Yani İstanbul'daki bir hekim, Van'ın tedavi sayfasında listeleniyordu.
 * Bu sayfalar hasta çekmek için var; yanlış şehirde çıkan hekim hem hastayı
 * yanıltıyor hem sayfanın güvenilirliğini düşürüyor.
 */
function addressInCity(address, needles) {
  const a = aramaAnahtari(String(address || ''));
  if (!a) return false;

  return needles.some((n) => {
    if (!n) return false;
    return new RegExp(`(^|[^a-z0-9])${kacir(n)}([^a-z0-9]|$)`).test(a);
  });
}

/**
 * Build the provider set for a specialty + city.
 *
 * City resolution: doctors have city_id = null and the /api/doctors brief
 * response's embedded clinic has NO address. So a doctor's city is resolved by
 * joining its clinic.id to the full /api/clinics list (which HAS `address`),
 * then matching the city name against that address.
 *
 * Clinics are surfaced ONLY when they have a matching doctor — the brief clinic
 * list carries no specialty field, so address-only clinic matching would
 * wrongly list e.g. a dental clinic under "Kardiyoloji".
 *
 * @returns {{doctors: Array, clinics: Array}}
 */
export function filterProviders({ specialty, city, doctors, clinics }) {
  const specId = specialty?.id;
  const needles = cityNeedles(city);

  // Lookup: clinic id → full clinic object (has address + codename).
  const clinicById = new Map(
    (clinics || []).filter((c) => c?.id).map((c) => [c.id, c]),
  );

  // Doctors: must match specialty_id; city resolved via own city_id, the
  // (rarely populated) embedded clinic address, OR the joined full clinic.
  const matchedDoctors = (doctors || []).filter((d) => {
    const profSpecId = d?.doctor_profile?.specialty_id;
    if (!specId || profSpecId !== specId) return false;
    const fullClinic = clinicById.get(d?.clinic?.id);
    const address = d?.clinic?.address || fullClinic?.address;
    return d?.city_id === city?.id || addressInCity(address, needles);
  });

  // Surface the clinics those matched doctors belong to (specialty-correct).
  const clinicMap = new Map();
  for (const d of matchedDoctors) {
    const id = d?.clinic?.id;
    if (!id || clinicMap.has(id)) continue;
    // Prefer the full clinic (has address); fall back to embedded (has codename).
    const full = clinicById.get(id);
    clinicMap.set(id, {
      id,
      name: full?.name || d.clinic?.name,
      fullname: full?.fullname || d.clinic?.fullname,
      codename: full?.codename || d.clinic?.codename,
      address: full?.address || d.clinic?.address,
    });
  }

  return { doctors: matchedDoctors, clinics: [...clinicMap.values()] };
}

/**
 * Derive specialty→cities combinations that actually have providers.
 * Used by the sitemap. Returns [{ specialtySlug, citySlug }, ...].
 * Resilient: returns [] on any API failure.
 */
export async function getProviderCombinations(limit = 500) {
  const [specialties, cities, doctors, clinics] = await Promise.all([
    getSpecialties(),
    getCities(),
    getAllDoctors(),
    getAllClinics(),
  ]);

  const combos = [];
  for (const sp of specialties) {
    for (const ct of cities) {
      const { doctors: dd, clinics: cc } = filterProviders({
        specialty: sp,
        city: ct,
        doctors,
        clinics,
      });
      if (dd.length + cc.length > 0) {
        combos.push({
          specialtySlug: slugify(trName(sp)),
          citySlug: slugify(trName(ct)),
        });
      }
      if (combos.length >= limit) return combos;
    }
  }
  return combos;
}
