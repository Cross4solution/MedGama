import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@/compat/router';
import { listCountriesAll, loadPreferredAdminOrCities, getFlagCode, listTurkeyProvinces } from '../../utils/geo';
import CountryCombobox from '../forms/CountryCombobox.jsx';
import CityCombobox from '../forms/CityCombobox.jsx';
import { catalogAPI } from '../../lib/api';
import GlobalSuggest from '../forms/GlobalSuggest';
import { useTranslation } from 'react-i18next';

export default function CustomSearch() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
      'Turkey': ['Türkiye', 'Turkiye'],
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

  // "Use my location": konumdan ülke+şehri çöz, kutuları otomatik doldur.
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);
  // Ülke set edilince şehir-yükleme effect'i city'yi resetler; konumdan gelen şehir
  // burada bekler, şehir listesi yüklenince listedeki yazımla eşlenip uygulanır.
  const pendingCityRef = React.useRef('');
  // Koordinat → ülke/şehir: önce BigDataCloud, olmazsa Nominatim (OSM) yedeği.
  const reverseGeo = async (lat, lon) => {
    try {
      const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const j = await r.json();
      if (j?.countryName) return { country: j.countryName, city: j.city || j.locality || '' };
    } catch (e) { console.warn('[UseMyLocation] BigDataCloud failed, trying Nominatim:', e); }
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`);
      const j = await r.json();
      const a = j?.address || {};
      if (a.country) return { country: a.country, city: a.city || a.town || a.province || a.state || '' };
    } catch (e) { console.warn('[UseMyLocation] Nominatim failed:', e); }
    return null;
  };

  const useMyLocation = () => {
    if (geoLoading) return;
    if (!navigator?.geolocation) { setGeoError('failed'); return; }
    setGeoLoading(true); setGeoError(false);

    const onPosition = async (pos) => {
      const geo = await reverseGeo(pos.coords.latitude, pos.coords.longitude);
      if (geo?.country) {
        // Ülke listesindeki tam adla eşle (alias'lar dahil: "Turkiye" → "Turkey")
        const match = countries.find((c) => getCountryVariants(c).some((v) => v.toLowerCase() === geo.country.toLowerCase()))
          || countries.find((c) => c.toLowerCase() === geo.country.toLowerCase());
        pendingCityRef.current = geo.city || '';
        setCountry(match || geo.country);
      } else {
        setGeoError('failed');
      }
      setGeoLoading(false);
    };

    // İlk deneme başarısızsa (izin hariç) bir kez yüksek hassasiyetle otomatik yeniden dene —
    // masaüstü Chrome'da Wi-Fi tabanlı konum ilk seferde sık başarısız olur (code 2/3).
    navigator.geolocation.getCurrentPosition(
      onPosition,
      (err) => {
        console.warn('[UseMyLocation] geolocation error (1st try):', err?.code, err?.message);
        if (err?.code === 1) { setGeoError('permission'); setGeoLoading(false); return; }
        navigator.geolocation.getCurrentPosition(
          onPosition,
          (err2) => {
            console.warn('[UseMyLocation] geolocation error (2nd try):', err2?.code, err2?.message);
            setGeoError(err2?.code === 1 ? 'permission' : 'failed');
            setGeoLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  };

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

  // Konumdan gelen bekleyen şehri, yüklenen listedeki yazımla eşleyip uygula
  const applyPendingCity = React.useCallback((list) => {
    const p = pendingCityRef.current;
    if (!p) return;
    pendingCityRef.current = '';
    const norm = (s) => (s || '').toLocaleLowerCase('en').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
    const m = (list || []).find((n) => norm(n) === norm(p));
    setCity(m || p);
  }, []);

  React.useEffect(() => {
    setCitiesOptions([]);
    if (!pendingCityRef.current) setCity('');
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
        applyPendingCity(sorted);
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
        const clean = Array.from(new Set(arr.filter(Boolean))).sort();
        setCitiesOptions(clean);
        applyPendingCity(clean);
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
        {/* 1. Country — "Use my location" kutunun altında, hata durumunda metniyle belli */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('search.country')}</label>
          <CountryCombobox
            options={countries}
            value={country}
            onChange={(val) => { setCountry((val || '').trim()); setCity(''); }}
            placeholder={t('search.selectCountry')}
            triggerClassName="w-full h-10 border border-gray-300 rounded-xl px-3 text-sm bg-white text-left hover:border-gray-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
            getFlagUrl={(name) => {
              const code = getFlagCode(name);
              return code ? `https://flagcdn.com/24x18/${code}.png` : null;
            }}
          />
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoLoading}
            className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${geoError ? 'text-red-500 hover:text-red-600' : 'text-teal-600 hover:text-teal-700'} ${geoLoading ? 'opacity-60 cursor-wait' : ''}`}
            title={geoError ? t('medstream.locationDenied', 'Location unavailable') : t('medstream.useMyLocation', 'Use my location')}
          >
            {geoLoading ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            )}
            {geoLoading
              ? t('medstream.locating', 'Locating…')
              : geoError === 'permission'
                ? t('medstream.locationPermission', 'Location permission blocked — allow it in your browser')
                : geoError
                  ? `${t('medstream.locationDenied', 'Location unavailable')} — ${t('common.retry', 'retry')}`
                  : t('medstream.useMyLocation', 'Use my location')}
          </button>
        </div>

        {/* 2. City */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{adminType === 'state' ? t('search.stateProvince') : t('search.city')}</label>
          <CityCombobox
            options={country ? citiesOptions : []}
            value={city}
            onChange={setCity}
            disabled={!country}
            loading={loadingCities}
            wheelFactor={1}
            placeholder={country ? t('search.selectPlaceholder') : t('search.chooseCountryFirst')}
            triggerClassName={`w-full h-10 border border-gray-300 rounded-xl px-3 text-sm bg-white text-left transition-all ${!country ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400'}`}
          />
        </div>

        {/* 3. Symptom — çoklu girilebilir (etikette "(s)"), örnek metin kutunun altında */}
        <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('search.symptomProcedure')}</label>
          <GlobalSuggest
            type="symptom"
            value={symptom}
            onChange={setSymptom}
            disabled={disableSymptom}
            placeholder={t('search.symptomPlaceholder')}
            allowCustom={true}
            lowercase={true}
          />
          <p className="mt-1.5 text-[11px] text-gray-400 leading-snug">{t('search.symptomHint', 'e.g., nasal congestion, headache')}</p>
        </div>

        <div className="flex items-center justify-center col-span-1 sm:col-span-2 md:col-span-1 md:pt-[44px] py-1 md:py-0">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 h-px bg-gray-200 md:hidden"></div>
            <span className="text-xs font-medium text-gray-400 tracking-wider">{t('search.or')}</span>
            <div className="flex-1 h-px bg-gray-200 md:hidden"></div>
          </div>
        </div>

        {/* 4. Specialty — TEK seçim (kişi iki uzmanlık aynı anda aramaz), örnek metin altta */}
        <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('search.specialtyDisease')}</label>
          <GlobalSuggest
            type="specialty"
            value={specialty}
            onChange={setSpecialty}
            disabled={disableSpecialty}
            placeholder={t('search.specialtyPlaceholder')}
            allowCustom={true}
            multi={false}
          />
          <p className="mt-1.5 text-[11px] text-gray-400 leading-snug">{t('search.specialtyHint', "e.g., ENT or Crohn's")}</p>
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
            <span>{t('search.searchButton')}</span>
          </button>
        </div>
      </div>
    </div>
    </form>
  );
}
