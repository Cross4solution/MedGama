import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@/compat/router';
import { useTranslation } from 'react-i18next';
import { Search, Star, MapPin, Loader2, Stethoscope, ChevronRight, X } from 'lucide-react';
import { clinicAPI, catalogAPI } from '../lib/api';
import { resolveClinicRating, resolveClinicReviewCount } from '../utils/clinicMetrics';
import resolveStorageUrl from '../utils/resolveStorageUrl';

const FALLBACK_IMAGES = [
  '/images/petr-magera-huwm7malj18-unsplash_720.jpg',
  '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
  '/images/caroline-lm-uqved8dypum-unsplash_720.jpg',
  '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg',
];

function TreatmentCard({ clinic, onClick }) {
  const img = clinic.avatar ? resolveStorageUrl(clinic.avatar) : FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  const rating = resolveClinicRating(clinic);
  const reviews = resolveClinicReviewCount(clinic);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(clinic)}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(clinic); }}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/40"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={img}
          alt={clinic.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK_IMAGES[0]; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        {rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-gray-900">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{clinic.fullname || clinic.name}</h3>
        {clinic.address && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="truncate">{clinic.address}</span>
          </div>
        )}
        {clinic.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {clinic.specialties.slice(0, 3).map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-medium">{s}</span>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">{reviews} Reviews</span>
          <span className="text-xs font-semibold text-teal-600 group-hover:text-teal-700">View →</span>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-1 mt-2">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export default function BrowseTreatments() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language || 'en').split('-')[0];
  const loc = (n) => (typeof n === 'string' ? n : (n?.[lang] || n?.en || n?.tr || Object.values(n || {})[0] || ''));

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Drill-down: Specialty → TreatmentTag → clinics
  const [specialties, setSpecialties] = useState([]);
  const [activeSpecialty, setActiveSpecialty] = useState(null); // {id, code, name}
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null); // {id, slug, name}
  const [loadingTags, setLoadingTags] = useState(false);

  // Treatment search (across specialties)
  const [search, setSearch] = useState('');
  const [tagResults, setTagResults] = useState([]);

  // Load specialties (objects)
  useEffect(() => {
    catalogAPI.specialties().then(res => {
      setSpecialties(res?.data?.specialties || res?.specialties || res?.data || []);
    }).catch(() => {});
  }, []);

  // Load tags when a specialty is picked
  useEffect(() => {
    if (!activeSpecialty) { setTags([]); return; }
    setLoadingTags(true);
    catalogAPI.treatmentTags({ specialty_id: activeSpecialty.id })
      .then(res => setTags(res?.data?.treatment_tags || res?.treatment_tags || []))
      .catch(() => setTags([]))
      .finally(() => setLoadingTags(false));
  }, [activeSpecialty]);

  // Treatment search (debounced) → jump to specialty+tag
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setTagResults([]); return; }
    const id = setTimeout(() => {
      catalogAPI.treatmentTagsSearch(q)
        .then(res => setTagResults(res?.data?.results || res?.results || []))
        .catch(() => setTagResults([]));
    }, 250);
    return () => clearTimeout(id);
  }, [search]);

  // Clinic filter value = active specialty's English name (clinic.specialties is free text)
  const specialtyFilter = useMemo(() => (activeSpecialty ? (activeSpecialty.name?.en || loc(activeSpecialty.name)) : ''), [activeSpecialty]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClinics = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { per_page: 20, page: pg };
      // Precise: a treatment selected → only clinics offering it. Else specialty.
      if (activeTag) params.treatment_tag_id = activeTag.id;
      else if (specialtyFilter) params.specialty = specialtyFilter;
      const res = await clinicAPI.list(params);
      const list = res?.data || [];
      setClinics(prev => (pg === 1 ? list : [...prev, ...list]));
      setHasMore(list.length === 20);
    } catch {
      if (pg === 1) setClinics([]);
    }
    setLoading(false);
  }, [specialtyFilter, activeTag]);

  useEffect(() => { setPage(1); fetchClinics(1); }, [fetchClinics]);

  const loadMore = () => { const next = page + 1; setPage(next); fetchClinics(next); };

  const handleClick = (clinic) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(clinic.codename ? `/clinic/${clinic.codename}` : '/clinic');
  };

  const pickSpecialty = (s) => { setActiveSpecialty(prev => (prev?.id === s.id ? null : s)); setActiveTag(null); };
  const pickTagFromSearch = (r) => {
    setSearch('');
    setTagResults([]);
    if (r.specialty) setActiveSpecialty({ id: r.specialty.id, code: r.specialty.code, name: r.specialty.name });
    setActiveTag({ id: r.id, slug: r.slug, name: r.name });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="w-7 h-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('home.popularTreatments', 'Popular Treatments')}</h1>
          </div>
          <p className="text-sm text-gray-500">{t('browse.treatmentsSubtitle', 'Find clinics and hospitals by treatment type and specialty.')}</p>
        </div>

        {/* Treatment search (across specialties) */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('browse.searchTreatments', 'Tedavi ara (ör. implant, katarakt, tüp bebek)...')}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
          />
          {tagResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
              {tagResults.map(r => (
                <button key={r.id} type="button" onClick={() => pickTagFromSearch(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center justify-between gap-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-800">{loc(r.name)}</span>
                  {r.specialty && <span className="text-[11px] text-gray-400">{loc(r.specialty.name)}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Breadcrumb (drill-down state) */}
        {(activeSpecialty || activeTag) && (
          <div className="flex items-center flex-wrap gap-2 mb-4 text-sm">
            <button onClick={() => { setActiveSpecialty(null); setActiveTag(null); }} className="text-gray-500 hover:text-teal-600">{t('browse.allSpecialties', 'Tüm Uzmanlıklar')}</button>
            {activeSpecialty && (<><ChevronRight className="w-3.5 h-3.5 text-gray-300" /><span className="font-semibold text-gray-800">{loc(activeSpecialty.name)}</span></>)}
            {activeTag && (<><ChevronRight className="w-3.5 h-3.5 text-gray-300" /><span className="inline-flex items-center gap-1 font-semibold text-teal-700">{loc(activeTag.name)}<button onClick={() => setActiveTag(null)} className="text-teal-400 hover:text-teal-600"><X className="w-3.5 h-3.5" /></button></span></>)}
          </div>
        )}

        {/* Step 1: Specialty chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {specialties.slice(0, 24).map((s) => (
            <button
              key={s.id || s.code}
              onClick={() => pickSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeSpecialty?.id === s.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'
              }`}
            >
              {loc(s.name)}
            </button>
          ))}
        </div>

        {/* Step 2: Treatment-tag chips for the selected specialty */}
        {activeSpecialty && (
          <div className="mb-6 p-3 bg-white rounded-xl border border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('browse.treatments', 'Tedaviler')}</p>
            {loadingTags ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
            ) : tags.length === 0 ? (
              <p className="text-xs text-gray-400">{t('browse.noTagsYet', 'Bu uzmanlık için tedavi listesi henüz eklenmedi.')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tg => (
                  <button key={tg.id} onClick={() => setActiveTag(prev => prev?.id === tg.id ? null : tg)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      activeTag?.id === tg.id ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'
                    }`}>
                    {loc(tg.name)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clinic results label */}
        <p className="text-sm text-gray-500 mb-3">
          {activeTag
            ? t('browse.clinicsForTreatment', '"{{name}}" için klinikler', { name: loc(activeTag.name) })
            : activeSpecialty
              ? t('browse.clinicsInSpecialty', '{{name}} klinikleri', { name: loc(activeSpecialty.name) })
              : t('browse.allClinics', 'Tüm klinikler')}
        </p>

        {/* Grid */}
        {loading && page === 1 ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-20">
            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('browse.noTreatments', 'No treatments found')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('browse.tryDifferent', 'Try a different search or filter.')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {clinics.map((clinic) => (
                <TreatmentCard key={clinic.id} clinic={clinic} onClick={handleClick} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('common.loadMore', 'Load More')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
