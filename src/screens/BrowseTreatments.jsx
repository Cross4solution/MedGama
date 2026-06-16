import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Star, MapPin, Loader2, Stethoscope } from 'lucide-react';
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

// Popular specialty pills for quick filter
const POPULAR_SPECIALTIES = [
  'Cardiology', 'Dentistry', 'Ophthalmology', 'Dermatology', 'Orthopedics',
  'Plastic Surgery', 'Neurology', 'Oncology', 'General Surgery', 'Aesthetic Medicine',
];

export default function BrowseTreatments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [specialties, setSpecialties] = useState(POPULAR_SPECIALTIES);

  // Fetch specialties from catalog
  useEffect(() => {
    catalogAPI.specialties().then(res => {
      const list = res?.data || [];
      if (list.length) {
        setSpecialties(list.map(s => s.name || s.label || s));
      }
    }).catch(() => {});
  }, []);

  const fetchClinics = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { per_page: 20, page: pg };
      if (search) params.search = search;
      if (activeSpecialty) params.specialty = activeSpecialty;
      const res = await clinicAPI.list(params);
      const list = res?.data || [];
      if (pg === 1) {
        setClinics(list);
      } else {
        setClinics(prev => [...prev, ...list]);
      }
      setHasMore(list.length === 20);
    } catch {
      if (pg === 1) setClinics([]);
    }
    setLoading(false);
  }, [search, activeSpecialty]);

  useEffect(() => { setPage(1); fetchClinics(1); }, [fetchClinics]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchClinics(next);
  };

  const handleClick = (clinic) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(clinic.codename ? `/clinic/${clinic.codename}` : '/clinic');
  };

  const toggleSpecialty = (s) => {
    setActiveSpecialty(prev => prev === s ? '' : s);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="w-7 h-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('home.popularTreatments', 'Popular Treatments')}</h1>
          </div>
          <p className="text-sm text-gray-500">{t('browse.treatmentsSubtitle', 'Find clinics and hospitals by treatment type and specialty.')}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('browse.searchTreatments', 'Search by treatment, specialty, or clinic name...')}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
          />
        </div>

        {/* Specialty pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {specialties.slice(0, 12).map((s) => (
            <button
              key={s}
              onClick={() => toggleSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeSpecialty === s
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

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
