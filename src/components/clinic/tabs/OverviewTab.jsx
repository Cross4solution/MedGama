import React from 'react';
import { CheckCircle, Shield, Award, Users, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import resolveStorageUrl from '../../../utils/resolveStorageUrl';

export default function OverviewTab({ aboutTitle, aboutP1, aboutP2, doctors = [], onBookAppointment, onSwitchToDoctors }) {
  const navigate = useNavigate();
  const accreditations = [
    { icon: CheckCircle, label: 'JCI Accredited', bg: 'bg-blue-50', fg: 'text-blue-600' },
    { icon: Shield, label: 'ISO 9001', bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    { icon: Award, label: 'Ministry of Health', bg: 'bg-violet-50', fg: 'text-violet-600' },
    { icon: Users, label: 'Health Tourism', bg: 'bg-amber-50', fg: 'text-amber-600' }
  ];

  const previewDoctors = doctors.slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{aboutTitle}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3" style={{ whiteSpace: 'pre-line' }}>
          {aboutP1}
        </p>
        <p className="text-sm text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
          {aboutP2}
        </p>
      </div>

      {/* Doctors Section */}
      {previewDoctors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Our Doctors</h4>
            {doctors.length > 4 && (
              <button
                type="button"
                onClick={onSwitchToDoctors}
                className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
              >
                View all {doctors.length} doctors
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {previewDoctors.map((doc) => {
              const profile = doc.doctor_profile || doc.doctorProfile || {};
              const specialty = profile.specialty || profile.title || '';
              const codename = doc.codename || doc.id;
              return (
                <div
                  key={doc.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => navigate(`/doctor/${codename}`)}
                >
                  <img
                    src={resolveStorageUrl(doc.avatar)}
                    alt={doc.fullname}
                    loading="lazy"
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
                    onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                      {doc.fullname}
                    </h5>
                    {specialty && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{specialty}</p>
                    )}
                    {profile.experience_years && (
                      <p className="text-xs text-gray-400 mt-0.5">{profile.experience_years} yrs exp.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onBookAppointment?.(); }}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Accreditations</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {accreditations.map((item, idx) => (
            <div key={idx} className={`flex items-center gap-2.5 p-3 ${item.bg} rounded-xl border border-transparent`}>
              <item.icon className={`w-5 h-5 ${item.fg} flex-shrink-0`} />
              <span className="text-xs font-semibold text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
