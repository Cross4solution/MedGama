import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCountriesAll, loadPreferredAdminOrCities, getFlagCode, listTurkeyProvinces } from '../../utils/geo';
import CountryCombobox from '../forms/CountryCombobox.jsx';
import CityCombobox from '../forms/CityCombobox.jsx';
import { catalogAPI } from '../../lib/api';
import GlobalSuggest from '../forms/GlobalSuggest';
import { useTranslation } from 'react-i18next';

export default function CustomSearch() {
  const navigate = useNavigate();
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
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (city) params.set('city', city);
    if (specialty) params.set('specialty', specialty.replace(/,\s*$/, '').trim());
    if (symptom) params.set('symptom', symptom.replace(/,\s*$/, '').trim());
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : '/search');
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

  const disableSymptom = specialty.trim().length > 0;
  const disableSpecialty = symptom.trim().length > 0;

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
          <GlobalSuggest
            type="symptom"
            value={symptom}
            onChange={setSymptom}
            disabled={disableSymptom}
            placeholder="Symptom or Procedure (e.g., nasal congestion)"
            allowCustom={true}
          />
        </div>

        <div className="flex items-center justify-center col-span-1 sm:col-span-2 md:col-span-1 md:pt-8 py-1 md:py-0">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 h-px bg-gray-200 md:hidden"></div>
            <span className="text-xs font-medium text-gray-400 tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200 md:hidden"></div>
          </div>
        </div>

        {/* 4. Specialty */}
        <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Specialty / Disease</label>
          <GlobalSuggest
            type="specialty"
            value={specialty}
            onChange={setSpecialty}
            disabled={disableSpecialty}
            placeholder="Type a specialty (e.g., ENT)"
            allowCustom={true}
          />
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
