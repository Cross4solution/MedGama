import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, Star, Video, X, SlidersHorizontal,
  BadgeCheck, ChevronLeft, ChevronRight, Stethoscope, SearchX,
  Lightbulb, TrendingUp, ArrowRight,
} from 'lucide-react';
import { doctorAPI, catalogAPI } from '../lib/api';
import SEOHead from '../components/seo/SEOHead';

/* ═══════════════════════════════════════════
   Skeleton Card (shimmer)
   ═══════════════════════════════════════════ */
function DoctorCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 bg-gray-100 rounded-full w-16" />
        <div className="h-6 bg-gray-100 rounded-full w-20" />
        <div className="h-6 bg-gray-100 rounded-full w-14" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-9 bg-gray-100 rounded-lg flex-1" />
        <div className="h-9 bg-gray-200 rounded-lg flex-1" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Doctor Card
   ═══════════════════════════════════════════ */
function DoctorCard({ doctor, t, navigate }) {
  const p = doctor.doctor_profile || {};
  const langs = Array.isArray(p.languages) ? p.languages : [];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-gray-200 transition-all group">
      <div className="flex gap-4">
        <img
          src={doctor.avatar || '/images/default/default-avatar.svg'}
          alt={doctor.fullname}
          className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {p.title ? `${p.title} ` : ''}{doctor.fullname}
            </h3>
            {doctor.is_verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                <BadgeCheck className="w-3 h-3" /> {t('search.doctorCard.verified')}
              </span>
            )}
            {p.online_consultation && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                <Video className="w-3 h-3" /> {t('search.doctorCard.online')}
              </span>
            )}
          </div>
          {p.specialty && <p className="text-xs text-teal-700 font-medium mt-0.5 truncate">{p.specialty}</p>}
          {p.experience_years != null && (
            <p className="text-[11px] text-gray-500 mt-0.5">{t('search.doctorCard.yearsExp', { count: p.experience_years })}</p>
          )}
        </div>
      </div>

      {langs.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium">{t('search.doctorCard.speaks')}:</span>
          {langs.slice(0, 4).map((l) => (
            <span key={l} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 uppercase">{l}</span>
          ))}
          {langs.length > 4 && <span className="text-[10px] text-gray-400">+{langs.length - 4}</span>}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={() => navigate(`/doctor/${doctor.id}`)} className="flex-1 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors text-center">
          {t('search.doctorCard.viewProfile')}
        </button>
        <button onClick={() => navigate(`/telehealth-appointment?doctor=${doctor.id}`)} className="flex-1 text-xs font-semibold text-white bg-teal-600 rounded-lg py-2 hover:bg-teal-700 transition-colors text-center shadow-sm">
          {t('search.doctorCard.bookAppointment')}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function SearchResults() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  // data
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // catalog
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);

  // filters (synced with URL)
  const [searchText, setSearchText] = useState(sp.get('q') || sp.get('specialty') || sp.get('symptom') || '');
  const [specId, setSpecId] = useState(sp.get('specialty_id') || '');
  const [cityId, setCityId] = useState(sp.get('city_id') || sp.get('city') || '');
  const [lang, setLang] = useState(sp.get('language') || '');
  const [minRating, setMinRating] = useState(sp.get('min_rating') || '');
  const [online, setOnline] = useState(sp.get('online_only') === '1');
  const [verified, setVerified] = useState(sp.get('verified') === '1');
  const [mobileFilter, setMobileFilter] = useState(false);

  // suggestions ("did you mean?")
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // hero bar local
  const [heroQ, setHeroQ] = useState(sp.get('q') || sp.get('specialty') || sp.get('symptom') || '');
  const [heroSpec, setHeroSpec] = useState(sp.get('specialty_id') || '');
  const [heroCity, setHeroCity] = useState(sp.get('city_id') || sp.get('city') || '');

  // load catalogs
  useEffect(() => {
    catalogAPI.specialtiesSearch().then(r => setSpecialties(r?.data?.specialties || r?.specialties || [])).catch(() => {});
    catalogAPI.citiesSearch().then(r => setCities(r?.data?.cities || r?.cities || [])).catch(() => {});
  }, []);

  // fetch doctors
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorAPI.list({
        search_text: searchText || undefined,
        specialty_id: specId || undefined,
        city_id: cityId || undefined,
        language: lang || undefined,
        min_rating: minRating || undefined,
        online_only: online ? '1' : undefined,
        verified: verified ? '1' : undefined,
        page,
        per_page: 20,
      });
      const d = res?.data?.data || res?.data || [];
      const list = Array.isArray(d) ? d : [];
      setDoctors(list);
      setTotal(res?.data?.total || list.length || 0);
      setLastPage(res?.data?.last_page || 1);

      // If no results, fetch suggestions
      if (list.length === 0 && (searchText || specId || cityId)) {
        setLoadingSuggestions(true);
        try {
          const sRes = await doctorAPI.suggestions({ search_text: searchText || undefined, city_id: cityId || undefined });
          setSuggestions(sRes?.data || null);
        } catch { setSuggestions(null); }
        finally { setLoadingSuggestions(false); }
      } else {
        setSuggestions(null);
      }
    } catch {
      setDoctors([]);
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  }, [searchText, specId, cityId, lang, minRating, online, verified, page]);

  useEffect(() => { fetch(); }, [fetch]);

  // sync URL
  const syncUrl = useCallback((overrides = {}) => {
    const p = new URLSearchParams();
    const vals = { q: searchText, specialty_id: specId, city_id: cityId, language: lang, min_rating: minRating, online_only: online ? '1' : '', verified: verified ? '1' : '', ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) p.set(k, v); });
    setSp(p);
  }, [searchText, specId, cityId, lang, minRating, online, verified, setSp]);

  // hero submit
  const heroSubmit = (e) => {
    e?.preventDefault();
    setSearchText(heroQ.trim());
    setSpecId(heroSpec);
    setCityId(heroCity);
    setPage(1);
    syncUrl({ q: heroQ.trim(), specialty_id: heroSpec, city_id: heroCity });
  };

  // sidebar apply
  const applyFilters = () => {
    setPage(1);
    syncUrl();
    setMobileFilter(false);
  };

  const clearFilters = () => {
    setSearchText(''); setSpecId(''); setCityId(''); setLang(''); setMinRating(''); setOnline(false); setVerified(false);
    setHeroQ(''); setHeroSpec(''); setHeroCity('');
    setSp({});
    setPage(1);
  };

  const specName = (id) => specialties.find(s => s.id === id)?.name || '';
  const cityName = (id) => cities.find(c => c.id === id)?.name || '';
  const availLangs = ['en', 'tr', 'ar', 'ru', 'de', 'fr', 'es', 'it', 'az', 'uz'];

  const hasActiveFilters = !!(lang || minRating || online || verified);

  /* ── Filter sidebar JSX ── */
  const filterSidebar = (
    <div className="space-y-5">
      {/* Specialty */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('search.specialtyOrDoctor')}</label>
        <select value={specId} onChange={e => setSpecId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
          <option value="">{t('search.allSpecialties')}</option>
          {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {/* City */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('search.city')}</label>
        <select value={cityId} onChange={e => setCityId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
          <option value="">{t('search.allCities')}</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {/* Language */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('search.language')}</label>
        <select value={lang} onChange={e => setLang(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
          <option value="">{t('search.allLanguages')}</option>
          {availLangs.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
      </div>
      {/* Rating */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('search.rating')}</label>
        <select value={minRating} onChange={e => setMinRating(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
          <option value="">{t('search.anyRating')}</option>
          {[4, 3, 2].map(n => <option key={n} value={n}>{t('search.starsAndAbove', { count: n })}</option>)}
        </select>
      </div>
      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={online} onChange={e => setOnline(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm text-gray-700">{t('search.onlineOnly')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm text-gray-700">{t('search.verifiedOnly')}</span>
        </label>
      </div>
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={applyFilters} className="flex-1 bg-teal-600 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-teal-700 transition-colors shadow-sm">
          {t('search.searchButton')}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="px-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/60">
      <SEOHead
        title={searchText ? `${searchText} — ${t('search.heroTitle', 'Find a Doctor')}` : t('search.heroTitle', 'Find a Doctor')}
        description={t('search.heroSubtitle', 'Search doctors by specialty, location and availability on MedaGama.')}
        canonical={`/search${searchText ? `?q=${encodeURIComponent(searchText)}` : ''}`}
        noIndex={!searchText}
      />
      {/* ═══ Hero Search Bar ═══ */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{t('search.heroTitle')}</h1>
          <p className="text-teal-100 text-sm md:text-base mt-2">{t('search.heroSubtitle')}</p>
        </div>
        <form onSubmit={heroSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-col md:flex-row gap-2">
            {/* Text input */}
            <div className="flex-1 relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={heroQ}
                onChange={e => setHeroQ(e.target.value)}
                placeholder={t('search.specialtyOrDoctorPlaceholder')}
                className="w-full pl-10 pr-3 py-3 rounded-xl text-sm border border-gray-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
              />
            </div>
            {/* Specialty select */}
            <div className="md:w-48">
              <select
                value={heroSpec}
                onChange={e => setHeroSpec(e.target.value)}
                className="w-full border border-gray-100 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none bg-white"
              >
                <option value="">{t('search.allSpecialties')}</option>
                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {/* City select */}
            <div className="md:w-44">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={heroCity}
                  onChange={e => setHeroCity(e.target.value)}
                  className="w-full border border-gray-100 rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none bg-white appearance-none"
                >
                  <option value="">{t('search.allCities')}</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {/* Submit */}
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl px-6 py-3 flex items-center gap-2 text-sm transition-colors shadow-sm whitespace-nowrap">
              <Search className="w-4 h-4" /> {t('search.searchButton')}
            </button>
          </div>
        </form>
      </section>

      {/* ═══ Content ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {loading ? t('search.loadingDoctors') : t('search.showing', { count: total })}
          </span>
          <button onClick={() => setMobileFilter(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 border border-teal-200 bg-teal-50 rounded-lg px-3 py-1.5 hover:bg-teal-100 transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> {t('search.filters')}
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-teal-500" />}
          </button>
        </div>

        <div className="flex gap-6">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600" /> {t('search.filters')}
              </h3>
              {filterSidebar}
            </div>
          </aside>

          {/* ── Results ── */}
          <main className="flex-1 min-w-0">
            {/* Summary bar */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                {loading ? t('search.loadingDoctors') : t('search.showing', { count: total })}
              </span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> {t('search.clearFilters')}
                </button>
              )}
            </div>

            {/* Doctor grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
              </div>
            ) : doctors.length === 0 ? (
              <div className="space-y-6">
                {/* Empty state header */}
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <SearchX className="w-14 h-14 text-gray-300 mb-3" />
                  <h3 className="text-lg font-bold text-gray-700 mb-1">{t('search.noResults')}</h3>
                  <p className="text-sm text-gray-500 mb-3">{t('search.noResultsHint')}</p>
                  <button onClick={clearFilters} className="text-sm font-semibold text-teal-600 hover:text-teal-700 underline underline-offset-2">
                    {t('search.clearFilters')}
                  </button>
                </div>

                {/* "Did you mean?" suggestions */}
                {loadingSuggestions ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
                  </div>
                ) : suggestions && (
                  <>
                    {/* Similar specialties */}
                    {suggestions.similar_specialties?.length > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4" /> {t('search.didYouMean')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.similar_specialties.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSpecId(s.id); setHeroSpec(s.id); setSearchText(''); setHeroQ('');
                                setPage(1); syncUrl({ specialty_id: s.id, q: '' });
                              }}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 bg-white border border-amber-200 rounded-full px-4 py-1.5 hover:bg-amber-100 hover:border-amber-300 transition-all shadow-sm"
                            >
                              <Stethoscope className="w-3.5 h-3.5" /> {s.name}
                              <ArrowRight className="w-3 h-3 opacity-50" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular doctors */}
                    {suggestions.popular_doctors?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-teal-600" />
                          {cityId ? t('search.popularDoctorsInCity') : t('search.popularDoctors')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {suggestions.popular_doctors.map((d) => (
                            <DoctorCard key={d.id} doctor={d} t={t} navigate={navigate} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((d) => <DoctorCard key={d.id} doctor={d} t={t} navigate={navigate} />)}
              </div>
            )}

            {/* Pagination */}
            {!loading && lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-600 px-3">{page} / {lastPage}</span>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ═══ Mobile Filter Drawer ═══ */}
      {mobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilter(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600" /> {t('search.filters')}
              </h3>
              <button onClick={() => setMobileFilter(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              {filterSidebar}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
