import React, { useMemo, useState } from 'react';
import countryCities from '../data/countryCities';
import CountryCombobox from './CountryCombobox';
import CityCombobox from './CityCombobox';
// SelectCombobox kaldırıldı; semptom ve uzmanlık text input + autocomplete olarak düzenlendi

export default function CustomSearch() {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [symptom, setSymptom] = useState('');
  const [citiesOptions, setCitiesOptions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [allWorldCities, setAllWorldCities] = useState(null);

  // Bazı ülkeler için API eş-isimleri (alias) – daha geniş kapsama yardımcı olur
  const getCountryVariants = React.useCallback((name) => {
    const aliases = {
      'Czechia': ['Czech Republic'],
      'United States': ['United States of America', 'USA', 'US'],
      'United Kingdom': ['Great Britain', 'UK', 'GB', 'Britain'],
      'Russia': ['Russian Federation'],
      'Vatican City': ['Holy See'],
      'South Korea': ['Republic of Korea'],
      'North Macedonia': ['Macedonia'],
      'Kosovo': ['Republic of Kosovo'],
    };
    const set = new Set([name, ...(aliases[name] || [])]);
    return Array.from(set);
  }, []);

  const countries = useMemo(() => {
    const base = Object.keys(countryCities || {});
    const extra = (allWorldCities && Array.isArray(allWorldCities)) ? Array.from(new Set(allWorldCities.map((c) => c.country))) : [];
    return Array.from(new Set([...base, ...extra])).sort();
  }, [allWorldCities]);
  const specialties = ['ENT', 'Cardiology', 'Orthopedics', 'Dermatology', 'Ophthalmology', 'Plastic Surgery', 'Dentistry', 'Neurology', 'Gastroenterology'];
  // Procedure list (EN) to surface alongside specialties in autocomplete
  const procedures = ['Rhinoplasty', 'Hip Replacement', 'Hair Transplant', 'Knee Replacement', 'LASIK', 'Dental Implant', 'Root Canal', 'Cataract Surgery'];
  const symptoms = ['Nasal congestion', 'Headache', 'Low back pain', 'Nausea', 'Toothache', 'Blurred vision', 'Acne', 'Varicose veins', 'Tinnitus'];

  const canSearch = useMemo(() => !!(country || city || specialty || symptom), [country, city, specialty, symptom]);

  const onSubmit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log('Custom search:', { country, city, specialty, symptom });
  };

  // Dünya şehirleri datasını lazy-load et (tek sefer)
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const mod = await import('../data/worldCities.min.json');
        if (!cancelled) setAllWorldCities(mod.default || mod);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('worldCities yüklenemedi, local countryCities ile devam');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Şehirleri yükle: 1) Ücretsiz API (countriesnow) ile ülkenin TÜM şehirleri, 2) public ülke JSON, 3) worldCities (tamamı), 4) countryCities fallback
  React.useEffect(() => {
    setCitiesOptions([]);
    setCity('');
    if (!country) return;
    setLoadingCities(true);
    const next = () => setLoadingCities(false);
    try {
      (async () => {
        // 0) CountriesNow API: https://countriesnow.space/api/v0.1/countries/cities
        try {
          const variants = getCountryVariants(country);
          for (const candidate of variants) {
            const res = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ country: candidate }),
            });
            if (res.ok) {
              const json = await res.json();
              const arr = Array.from(new Set((json?.data || []).filter(Boolean))).sort();
              if (arr.length) {
                setCitiesOptions(arr);
                next();
                return;
              }
            }
          }
        } catch (_) { /* ignore and fallback */ }

        // 1) Public ülke bazlı JSON: /cities/<Country>.json (isteğe bağlı - varsa yüklenir)
        try {
          const res = await fetch(`/data/world-cities/${encodeURIComponent(country)}.json`, { cache: 'force-cache' });
          if (res.ok) {
            const data = await res.json();
            const arr = Array.from(new Set((Array.isArray(data) ? data : []).map((x) => (typeof x === 'string' ? x : x.city)).filter(Boolean))).sort();
            if (arr.length) {
              setCitiesOptions(arr);
              next();
              return;
            }
          }
        } catch (_) { /* ignore and fallback */ }

        // 2) worldCities (tamamı)
        if (allWorldCities && Array.isArray(allWorldCities)) {
          const filtered = allWorldCities
            .filter((c) => c.country === country)
            .map((c) => c.city);
          if (filtered.length > 0) {
            setCitiesOptions(Array.from(new Set(filtered)).sort());
            next();
            return;
          }
        }

        // 3) countryCities fallback
        const fallback = countryCities[country] || [];
        setCitiesOptions([...fallback].sort());
        next();
      })();
    } finally {
      // next() async blok içinde çağrılıyor
    }
  }, [country, allWorldCities]);

  // Yardımcı: normalize (accent-insensitive) ve basit filtreleyici
  const normalize = (s) => s?.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const filterOptions = (list, q) => {
    const n = normalize(q || '');
    if (!n) return [];
    return list.filter((x) => normalize(x).includes(n)).slice(0, 8);
  };

  // OR mantığı: biri doluyken diğeri disable
  const disableSymptom = specialty.trim().length > 0;
  const disableSpecialty = symptom.trim().length > 0;

  // Debounce edilmiş arama sorguları ve klavye navigasyonu state'leri
  const [symptomQuery, setSymptomQuery] = useState('');
  const [specialtyQuery, setSpecialtyQuery] = useState('');
  const [symptomActiveIndex, setSymptomActiveIndex] = useState(-1);
  const [specialtyActiveIndex, setSpecialtyActiveIndex] = useState(-1);

  // Son token'ı çıkaran yardımcılar (comma-separated input desteği)
  const getLastToken = React.useCallback((s) => {
    if (!s) return '';
    const parts = s.split(',');
    return (parts[parts.length - 1] || '').trim();
  }, []);
  const replaceLastToken = React.useCallback((s, token, keepTrailingComma = true) => {
    const parts = (s || '').split(',');
    parts[parts.length - 1] = ` ${token}`; // boşlukla başlat, trim görüntüsünü korur
    let out = parts.join(',').replace(/^\s+/, '');
    if (keepTrailingComma) {
      if (!out.trim().endsWith(',')) out = out.replace(/\s*$/, '') + ', ';
    } else {
      out = out.replace(/\s+$/, '');
    }
    return out;
  }, []);
  // Token yardımcıları: listele ve sil
  const listTokens = React.useCallback((s) => (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0), []);
  const removeToken = React.useCallback((s, tokenToRemove) => {
    const tokens = listTokens(s).filter((t) => t !== tokenToRemove);
    return tokens.length ? tokens.join(', ') + ', ' : '';
  }, [listTokens]);

  React.useEffect(() => {
    const t = setTimeout(() => setSymptomQuery(getLastToken(symptom)), 200);
    return () => clearTimeout(t);
  }, [symptom, getLastToken]);
  React.useEffect(() => {
    const t = setTimeout(() => setSpecialtyQuery(getLastToken(specialty)), 200);
    return () => clearTimeout(t);
  }, [specialty, getLastToken]);

  const symptomMatches = useMemo(() => {
    const merged = [...symptoms, ...procedures];
    return filterOptions(merged, symptomQuery);
  }, [symptoms, procedures, symptomQuery]);
  const specialtyMatches = useMemo(() => {
    const merged = [...specialties, ...procedures];
    return filterOptions(merged, specialtyQuery);
  }, [specialties, procedures, specialtyQuery]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-white/95 backdrop-blur border border-gray-100 rounded-xl p-3 md:p-3 shadow-[0_6px_20px_-5px_rgba(28,106,131,0.18),0_2px_6px_-2px_rgba(2,6,23,0.12)] hover:shadow-[0_10px_30px_-10px_rgba(28,106,131,0.22),0_4px_12px_-3px_rgba(2,6,23,0.16)] focus-within:shadow-[0_12px_36px_-12px_rgba(28,106,131,0.28),0_6px_16px_-4px_rgba(2,6,23,0.2)] transition-shadow">
        <div className="grid gap-4 md:grid-cols-[10rem,10rem,1fr,auto,1fr,auto]">
        {/* 1. Country (küçük) */}
        <div className="max-w-40">
          <CountryCombobox
            options={countries}
            value={country}
            onChange={(val) => { setCountry(val); setCity(''); }}
            placeholder="Country"
          />
        </div>

        {/* 2. City (dependent combobox) */}
        <div className="max-w-40">
          <CityCombobox
            options={country ? citiesOptions : []}
            value={city}
            onChange={setCity}
            disabled={!country}
            loading={loadingCities}
            placeholder="City"
          />
        </div>

        {/* 3. Semptom (text + autocomplete) - Chip'leri bar içinde göster */}
        <div className="relative">
          <div
            className={`border border-gray-300 rounded-lg px-2 py-1 text-base md:text-sm flex items-center flex-wrap gap-2 ${disableSymptom ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          >
            {listTokens(symptom).map((tok) => (
              <span key={tok} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-800 border border-teal-200">
                {tok}
                <button
                  type="button"
                  className="ml-0.5 text-teal-700 hover:text-teal-900"
                  onClick={() => setSymptom((s) => removeToken(s, tok))}
                  aria-label={`Remove ${tok}`}
                  disabled={disableSymptom}
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              type="text"
              value={getLastToken(symptom)}
              onChange={(e) => { setSymptom((s) => replaceLastToken(s, e.target.value, false)); setSymptomActiveIndex(-1); }}
              disabled={disableSymptom}
              placeholder={listTokens(symptom).length > 0 ? '' : "Symptom or Procedure (e.g., nasal congestion)"}
              className={`flex-1 min-w-[8ch] border-0 outline-none px-1 py-1 text-base md:text-sm bg-transparent ${disableSymptom ? 'placeholder:text-gray-400' : ''}`}
              onKeyDown={(e) => {
                if (disableSymptom) return;
                // Add comma-separated tokens with Enter or comma
                if ((e.key === 'Enter' || e.key === ',') && symptom.trim().length > 0) {
                  e.preventDefault();
                  // Öneri seçiliyse onu uygula, değilse sadece virgül ekle
                  if (symptomActiveIndex >= 0 && symptomActiveIndex < symptomMatches.length) {
                    setSymptom((s) => replaceLastToken(s, symptomMatches[symptomActiveIndex], true));
                  } else {
                    setSymptom((s) => (s || '').replace(/\s*,?\s*$/, '') + ', ');
                  }
                  setSymptomActiveIndex(-1);
                  return;
                }
                if (e.key === 'Tab') {
                  if (symptomActiveIndex >= 0 && symptomActiveIndex < symptomMatches.length) {
                    e.preventDefault();
                    setSymptom((s) => replaceLastToken(s, symptomMatches[symptomActiveIndex], true));
                    setSymptomActiveIndex(-1);
                  }
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSymptomActiveIndex((i) => Math.min(i + 1, Math.max(symptomMatches.length - 1, 0)));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSymptomActiveIndex((i) => Math.max(i - 1, -1));
                } else if (e.key === 'Enter') {
                  if (symptomActiveIndex >= 0 && symptomActiveIndex < symptomMatches.length) {
                    setSymptom((s) => replaceLastToken(s, symptomMatches[symptomActiveIndex], true));
                    setSymptomActiveIndex(-1);
                  }
                } else if (e.key === 'Escape') {
                  setSymptomActiveIndex(-1);
                }
              }}
            />
            {symptom && (
              <button type="button" onClick={() => setSymptom('')} className="ml-auto text-gray-400 hover:text-gray-600" disabled={disableSymptom}>
                ✕
              </button>
            )}
          </div>
          {/* Autocomplete dropdown */}
          {symptom && !disableSymptom && symptomQuery.trim().length > 0 && symptomMatches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto text-sm">
              {symptomMatches.map((s, idx) => (
                <li key={s}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${idx === symptomActiveIndex ? 'bg-teal-50 text-teal-800' : 'hover:bg-teal-50 hover:text-teal-800'}`}
                    onClick={() => setSymptom((prev) => replaceLastToken(prev, s, true))}
                  >
                    {s}
                    <span className="ml-2 text-xs text-gray-500">{procedures.includes(s) ? '(procedure)' : '(symptom)'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* OR label */}
        <div className="flex items-center justify-center text-gray-500">or</div>

        {/* 4. Speciality (text + autocomplete) - Chip'leri bar içinde göster */}
        <div className="relative">
          <div
            className={`border border-gray-300 rounded-lg px-2 py-1 text-base md:text-sm flex items-center flex-wrap gap-2 ${disableSpecialty ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          >
            {listTokens(specialty).map((tok) => (
              <span key={tok} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-800 border border-teal-200">
                {tok}
                <button
                  type="button"
                  className="ml-0.5 text-teal-700 hover:text-teal-900"
                  onClick={() => setSpecialty((s) => removeToken(s, tok))}
                  aria-label={`Remove ${tok}`}
                  disabled={disableSpecialty}
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              type="text"
              value={getLastToken(specialty)}
              onChange={(e) => { setSpecialty((s) => replaceLastToken(s, e.target.value, false)); setSpecialtyActiveIndex(-1); }}
              disabled={disableSpecialty}
              placeholder={listTokens(specialty).length > 0 ? '' : "Type a specialty (e.g., ENT)"}
              className={`flex-1 min-w-[8ch] border-0 outline-none px-1 py-1 text-base md:text-sm bg-transparent ${disableSpecialty ? 'placeholder:text-gray-400' : ''}`}
              onKeyDown={(e) => {
                if (disableSpecialty) return;
                // Add comma-separated tokens with Enter or comma
                if ((e.key === 'Enter' || e.key === ',') && specialty.trim().length > 0) {
                  e.preventDefault();
                  if (specialtyActiveIndex >= 0 && specialtyActiveIndex < specialtyMatches.length) {
                    setSpecialty((s) => replaceLastToken(s, specialtyMatches[specialtyActiveIndex], true));
                  } else {
                    setSpecialty((s) => (s || '').replace(/\s*,?\s*$/, '') + ', ');
                  }
                  setSpecialtyActiveIndex(-1);
                  return;
                }
                if (e.key === 'Tab') {
                  if (specialtyActiveIndex >= 0 && specialtyActiveIndex < specialtyMatches.length) {
                    e.preventDefault();
                    setSpecialty((s) => replaceLastToken(s, specialtyMatches[specialtyActiveIndex], true));
                    setSpecialtyActiveIndex(-1);
                  }
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSpecialtyActiveIndex((i) => Math.min(i + 1, Math.max(specialtyMatches.length - 1, 0)));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSpecialtyActiveIndex((i) => Math.max(i - 1, -1));
                } else if (e.key === 'Enter') {
                  if (specialtyActiveIndex >= 0 && specialtyActiveIndex < specialtyMatches.length) {
                    setSpecialty((s) => replaceLastToken(s, specialtyMatches[specialtyActiveIndex], true));
                    setSpecialtyActiveIndex(-1);
                  }
                } else if (e.key === 'Escape') {
                  setSpecialtyActiveIndex(-1);
                }
              }}
            />
            {specialty && (
              <button type="button" onClick={() => setSpecialty('')} className="ml-auto text-gray-400 hover:text-gray-600" disabled={disableSpecialty}>
                ✕
              </button>
            )}
          </div>
          {/* Autocomplete dropdown */}
          {specialty && !disableSpecialty && specialtyQuery.trim().length > 0 && specialtyMatches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto text-sm">
              {specialtyMatches.map((s, idx) => (
                <li key={s}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${idx === specialtyActiveIndex ? 'bg-teal-50 text-teal-800' : 'hover:bg-teal-50 hover:text-teal-800'}`}
                    onClick={() => setSpecialty((prev) => replaceLastToken(prev, s, true))}
                  >
                    {s}
                    <span className="ml-2 text-xs text-gray-500">{procedures.includes(s) ? '(procedure)' : '(specialty)'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 5. Search button (inline, sağda) */}
        <div className="flex md:block">
          <button
            type="submit"
            disabled={!canSearch}
            className="ml-auto md:ml-0 bg-gray-900 text-white rounded-lg text-base px-5 py-3 md:text-sm md:px-4 md:h-10 disabled:opacity-50 flex items-center gap-2 md:justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search</span>
          </button>
        </div>
      </div>
      </div>
      
    </form>
  );
}
