import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/compat/router';
import { Star, Stethoscope, Clock, Languages, Search } from 'lucide-react';
import resolveStorageUrl from '../../../utils/resolveStorageUrl';
import { useTranslation } from 'react-i18next';

const getSpec = (doc) => {
  const dp = doc.doctor_profile || {};
  return dp.specialty_relation?.name || dp.specialty || '';
};

export default function DoctorsTab({ doctors = [] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [specFilter, setSpecFilter] = useState('all');

  const specialties = useMemo(
    () => Array.from(new Set(doctors.map(getSpec).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [doctors],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      const okSpec = specFilter === 'all' || getSpec(d) === specFilter;
      const okQ = !q || (d.fullname || '').toLowerCase().includes(q);
      return okSpec && okQ;
    });
  }, [doctors, query, specFilter]);

  // Show filters only when the list is large enough to need narrowing
  const showFilters = doctors.length > 4;

  if (!doctors.length) {
    return (
      <div className="text-center py-12">
        <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('clinicDetail.noDoctors', 'No doctors registered at this clinic yet.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">{t('clinicDetail.tab_doktorlar', 'Doctors')}</h3>

      {showFilters && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('clinicDetail.searchDoctor', 'Doktor ara...')}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
            />
          </div>
          {specialties.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSpecFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${specFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t('common.all', 'All')}
              </button>
              {specialties.map((s) => (
                <button key={s} type="button" onClick={() => setSpecFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${specFilter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">{t('clinicDetail.noDoctorsMatch', 'Aramanıza uygun doktor bulunamadı.')}</div>
      ) : (
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((doc) => {
          const dp = doc.doctor_profile || {};
          const specObj = dp.specialty_relation || {};
          const specName = specObj.name || dp.specialty || '';
          const rating = dp.avg_rating ? parseFloat(dp.avg_rating) : null;

          const doctorPath = dp.slug ? `/doctor/${dp.slug}` : `/doctor/${doc.id}`;
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => navigate(doctorPath)}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:border-teal-300 hover:shadow-md transition-all text-left group"
            >
              <img
                src={resolveStorageUrl(doc.avatar)}
                alt={doc.fullname}
                loading="lazy"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-teal-200 transition-all flex-shrink-0"
                onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
              />
              <div className="min-w-0 flex-1">
                <h5 className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                  {doc.fullname}
                </h5>
                {specName && (
                  <p className="text-xs text-teal-600 font-medium mt-0.5">{specName}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  {rating && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                      {rating.toFixed(1)}
                      {dp.review_count ? <span className="text-gray-400">({dp.review_count})</span> : null}
                    </span>
                  )}
                  {dp.experience_years && (
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {dp.experience_years} {t('common.years', 'yrs')}
                    </span>
                  )}
                  {dp.languages?.length > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <Languages className="w-3 h-3" />
                      {dp.languages.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}
