import React, { useMemo, useState } from 'react';
import countryCities from '../../data/countryCities';
import CountryCombobox from '../forms/CountryCombobox.jsx';
import CityCombobox from '../forms/CityCombobox.jsx';

export default function CustomSearch() {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [symptom, setSymptom] = useState('');
  const [citiesOptions, setCitiesOptions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [allWorldCities, setAllWorldCities] = useState(null);
  const loadRef = React.useRef(0);

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
  const procedures = ['Rhinoplasty', 'Hip Replacement', 'Hair Transplant', 'Knee Replacement', 'LASIK', 'Dental Implant', 'Root Canal', 'Cataract Surgery'];
  const symptoms = ['Nasal congestion', 'Headache', 'Low back pain', 'Nausea', 'Toothache', 'Blurred vision', 'Acne', 'Varicose veins', 'Tinnitus'];

  const canSearch = useMemo(() => !!(country || city || specialty || symptom), [country, city, specialty, symptom]);

  const onSubmit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log('Custom search:', { country, city, specialty, symptom });
  };

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // @ts-ignore: dynamic JSON import in JS file (no resolveJsonModule)
        const mod = await import('../../data/worldCities.min.json');
        if (!cancelled) setAllWorldCities(mod.default || mod);
      } catch (e) {
        console.warn('worldCities yüklenemedi, local countryCities ile devam');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    setCitiesOptions([]);
    setCity('');
    if (!country) return;
    setLoadingCities(true);

    const runId = ++loadRef.current; // geç gelen yanıtları iptal etmek için sürümleme
    const abortCtrl = new AbortController();

    const withTimeout = (promise, ms = 800) => {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), ms);
        promise.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
      });
    };

    const applyIfFresh = (arr) => {
      if (loadRef.current !== runId) return false;
      if (Array.isArray(arr) && arr.length) {
        setCitiesOptions(Array.from(new Set(arr.filter(Boolean))).sort());
        setLoadingCities(false);
        return true;
      }
      return false;
    };

    (async () => {
      // 1) Uzak API: ülke isim varyantlarını paralel dene, kısa timeout ile
      try {
        const variants = getCountryVariants(country);
        const requests = variants.map((candidate) => withTimeout(
          fetch('https://countriesnow.space/api/v0.1/countries/cities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: candidate }),
            signal: abortCtrl.signal,
          }).then(async (res) => {
            if (!res.ok) throw new Error('bad response');
            const json = await res.json();
            return (json?.data || []).filter(Boolean);
          })
        , 900));

        const settled = await Promise.allSettled(requests);
        for (const s of settled) {
          if (s.status === 'fulfilled' && applyIfFresh(s.value)) return;
        }
      } catch (_) { /* ignore */ }

      // 2) Public dosya: ülkeye özel JSON
      try {
        const res = await withTimeout(fetch(`/data/world-cities/${encodeURIComponent(country)}.json`, { cache: 'force-cache', signal: abortCtrl.signal }), 800);
        if (res.ok) {
          const data = await res.json();
          const arr = (Array.isArray(data) ? data : []).map((x) => (typeof x === 'string' ? x : x.city));
          if (applyIfFresh(arr)) return;
        }
      } catch (_) { /* ignore */ }

      // 3) allWorldCities memory
      if (allWorldCities && Array.isArray(allWorldCities)) {
        const filtered = allWorldCities.filter((c) => c.country === country).map((c) => c.city);
        if (applyIfFresh(filtered)) return;
      }

      // 4) Son çare: local dataset
      const fallback = countryCities[country] || [];
      applyIfFresh(fallback);
    })();

    return () => {
      abortCtrl.abort();
    };
  }, [country, allWorldCities, getCountryVariants]);

  const normalize = (s) => s?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filterOptions = (list, q) => {
    const n = normalize(q || '');
    if (!n) return [];
    return list.filter((x) => normalize(x).includes(n)).slice(0, 8);
  };

  const disableSymptom = specialty.trim().length > 0;
  const disableSpecialty = symptom.trim().length > 0;

  const [symptomQuery, setSymptomQuery] = useState('');
  const [specialtyQuery, setSpecialtyQuery] = useState('');
  const [symptomActiveIndex, setSymptomActiveIndex] = useState(-1);
  const [specialtyActiveIndex, setSpecialtyActiveIndex] = useState(-1);

  const getLastToken = React.useCallback((s) => {
    if (!s) return '';
    const parts = s.split(',');
    return (parts[parts.length - 1] || '').trim();
  }, []);
  const replaceLastToken = React.useCallback((s, token, keepTrailingComma = true) => {
    const parts = (s || '').split(',');
    parts[parts.length - 1] = ` ${token}`;
    let out = parts.join(',').replace(/^\s+/, '');
    if (keepTrailingComma) {
      if (!out.trim().endsWith(',')) out = out.replace(/\s*$/, '') + ', ';
    } else {
      out = out.replace(/\s+$/, '');
    }
    return out;
  }, []);
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
        <div className="grid gap-4 md:grid-cols-[12rem,12rem,1.1fr,auto,1.1fr,auto]">
        {/* 1. Country */}
        <div className="max-w-48">
          <CountryCombobox
            options={countries}
            value={country}
            onChange={(val) => { setCountry(val); setCity(''); }}
            placeholder="Country"
          />
        </div>

        {/* 2. City */}
        <div className="max-w-48">
          <CityCombobox
            options={country ? citiesOptions : []}
            value={city}
            onChange={setCity}
            disabled={!country}
            loading={loadingCities}
            wheelFactor={0.6}
            placeholder="City"
          />
        </div>

        {/* 3. Symptom */}
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
                if ((e.key === 'Enter' || e.key === ',') && symptom.trim().length > 0) {
                  e.preventDefault();
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

        <div className="flex items-center justify-center text-gray-500">or</div>

        {/* 4. Specialty */}
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

        {/* 5. Search button */}
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
