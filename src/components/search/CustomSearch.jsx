import React, { useEffect, useMemo, useState } from 'react';
import { listCountriesAll, loadPreferredAdminOrCities, getFlagCode, listTurkeyProvinces } from '../../utils/geo';
import CountryCombobox from '../forms/CountryCombobox.jsx';
import CityCombobox from '../forms/CityCombobox.jsx';
import { catalogAPI } from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function CustomSearch() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [symptom, setSymptom] = useState('');
  const [citiesOptions, setCitiesOptions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [adminType, setAdminType] = useState('city'); // 'state' | 'city'
  const loadRef = React.useRef(0);

  const getCountryVariants = React.useCallback((name) => {
    const aliases = {
      'Czechia': ['Czech Republic'],
      'United States': ['United States of America', 'USA', 'US', 'U.S.'],
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

  // states/eyalet modu kaldırıldı; tüm ülkeler için şehir listesi gösterilir

  const [countries, setCountries] = useState([]);
  useEffect(() => {
    listCountriesAll({ excludeIslands: true, excludeNoCities: true }).then(setCountries);
  }, []);
  // Catalog API'den uzmanlık ve semptom verileri
  const [specialties, setSpecialties] = useState(['ENT', 'Cardiology', 'Orthopedics', 'Dermatology', 'Ophthalmology', 'Plastic Surgery', 'Dentistry', 'Neurology', 'Gastroenterology']);
  const [symptoms, setSymptoms] = useState(['Nasal congestion', 'Headache', 'Low back pain', 'Nausea', 'Toothache', 'Blurred vision', 'Acne', 'Varicose veins', 'Tinnitus']);
  const procedures = ['Rhinoplasty', 'Hip Replacement', 'Hair Transplant', 'Knee Replacement', 'LASIK', 'Dental Implant', 'Root Canal', 'Cataract Surgery'];

  useEffect(() => {
    catalogAPI.specialties().then((res) => {
      const list = res?.specialties || res?.data || [];
      if (list.length) {
        setSpecialties(list.map((s) => s.translations?.[lang] || s.translations?.en || s.code));
      }
    }).catch(() => {});
    catalogAPI.symptoms().then((res) => {
      const list = res?.symptoms || res?.data || [];
      if (list.length) {
        setSymptoms(list.map((s) => s.translations?.[lang] || s.translations?.en || s.symptom));
      }
    }).catch(() => {});
  }, [lang]);

  const canSearch = useMemo(() => !!(country || city || specialty || symptom), [country, city, specialty, symptom]);

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: integrate with search API
  };

  // Dış API ile ülke listesi/flag kodu alma kaldırıldı; veriler utils/geo içinden geliyor.

  // worldCities dinamik importu utils/geo altında yapılıyor; burada gerek yok.

  React.useEffect(() => {
    setCitiesOptions([]);
    setCity('');
    if (!country) return;
    setLoadingCities(true);

    // Ülke değiştiğinde, o ülkeye ait TÜM eski şehir cache anahtarlarını temizle (versiyondan bağımsız)
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('cities_') && k.endsWith(`_${country}`)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}

    // Türkiye özel: doğrudan 81 il listesi (ilçe/sokak yok)
    try {
      const n = String(country || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (['turkey','turkiye','türkiye'].includes(n)) {
        setAdminType('city');
        const sorted = listTurkeyProvinces().slice().sort((a,b)=>a.localeCompare(b, 'tr', { sensitivity: 'base' }));
        setCitiesOptions(sorted);
        setLoadingCities(false);
        return;
      }
    } catch {}

    const runId = ++loadRef.current; // geç gelen yanıtları iptal etmek için sürümleme
    const abortCtrl = new AbortController();

    const withTimeout = (promise, ms = 3000) => {
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
      try {
        const result = await loadPreferredAdminOrCities(country);
        setAdminType(result?.type === 'state' ? 'state' : 'city');
        applyIfFresh(Array.isArray(result?.list) ? result.list : []);
      } catch {
        setLoadingCities(false);
      }
    })();

    return () => {
      abortCtrl.abort();
    };
  }, [country]);

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
    <form onSubmit={onSubmit}>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-[11rem,11rem,1.1fr,auto,1.1fr,auto] items-start">
        {/* 1. Country */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Country</label>
          <CountryCombobox
            options={countries}
            value={country}
            onChange={(val) => { setCountry((val || '').trim()); setCity(''); }}
            placeholder="Select country"
            triggerClassName="w-full h-10 border border-gray-300 rounded-xl px-3 text-sm bg-white text-left hover:border-gray-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
            getFlagUrl={(name) => {
              const code = getFlagCode(name);
              return code ? `https://flagcdn.com/24x18/${code}.png` : null;
            }}
          />
        </div>

        {/* 2. City */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{adminType === 'state' ? 'State/Province' : 'City'}</label>
          <CityCombobox
            options={country ? citiesOptions : []}
            value={city}
            onChange={setCity}
            disabled={!country}
            loading={loadingCities}
            wheelFactor={1}
            placeholder={country ? 'Select...' : 'Choose country first'}
            triggerClassName={`w-full h-10 border border-gray-300 rounded-xl px-3 text-sm bg-white text-left transition-all ${!country ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400'}`}
          />
        </div>

        {/* 3. Symptom */}
        <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Symptom / Procedure</label>
          <div
            className={`border border-gray-300 rounded-xl px-2.5 py-1.5 text-sm flex items-center flex-wrap gap-1.5 min-h-[2.5rem] transition-all ${disableSymptom ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white hover:border-gray-400 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400'}`}
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

        <div className="flex items-center justify-center col-span-1 sm:col-span-2 md:col-span-1 md:pt-6 py-1 md:py-0">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 h-px bg-gray-200 md:hidden"></div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200 md:hidden"></div>
          </div>
        </div>

        {/* 4. Specialty */}
        <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Specialty</label>
          <div
            className={`border border-gray-300 rounded-xl px-2.5 py-1.5 text-sm flex items-center flex-wrap gap-1.5 min-h-[2.5rem] transition-all ${disableSpecialty ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white hover:border-gray-400 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400'}`}
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
        <div className="col-span-1 sm:col-span-2 md:col-span-1 md:pt-6">
          <button
            type="submit"
            disabled={!canSearch}
            className="w-full md:w-auto bg-teal-600 text-white rounded-xl text-sm font-semibold px-5 py-2.5 h-10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 justify-center hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all shadow-sm hover:shadow-md"
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
