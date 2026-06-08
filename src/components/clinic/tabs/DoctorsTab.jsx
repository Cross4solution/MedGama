import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Stethoscope, Clock, Languages } from 'lucide-react';
import resolveStorageUrl from '../../../utils/resolveStorageUrl';
import { useTranslation } from 'react-i18next';

export default function DoctorsTab({ doctors = [] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      <div className="grid sm:grid-cols-2 gap-4">
        {doctors.map((doc) => {
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
    </div>
  );
}
