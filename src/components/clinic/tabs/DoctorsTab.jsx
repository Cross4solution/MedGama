import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import resolveStorageUrl from '../../../utils/resolveStorageUrl';

export default function DoctorsTab({ doctorsText, doctors = [], deptDoctors, selectedDept, setSelectedDept, onBookAppointment }) {
  const navigate = useNavigate();
  const doctorsListRef = useRef(null);

  useEffect(() => {
    if (selectedDept && doctorsListRef.current) {
      setTimeout(() => {
        doctorsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [selectedDept]);

  // Real doctors from API
  if (doctors.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Doctors</h3>
          <p className="text-sm text-gray-500">{doctorsText}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {doctors.map((doc) => {
            const profile = doc.doctor_profile || doc.doctorProfile || {};
            const specialty = profile.specialty || profile.title || '';
            const codename = doc.codename || doc.id;
            return (
              <div
                key={doc.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => navigate(`/doctor/${codename}`)}
              >
                <img
                  src={resolveStorageUrl(doc.avatar)}
                  alt={doc.fullname}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
                  onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">{doc.fullname}</h5>
                  {specialty && <p className="text-xs text-gray-500 mt-0.5 truncate">{specialty}</p>}
                  {profile.experience_years && <p className="text-xs text-gray-400 mt-0.5">{profile.experience_years} yrs exp.</p>}
                  {doc.is_verified && <span className="inline-flex items-center text-[10px] font-semibold text-teal-600 mt-1">✓ Verified</span>}
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
    );
  }

  // Fallback: mock department-based view
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Doctors</h3>
        <p className="text-sm text-gray-500">{doctorsText}</p>
      </div>

      {/* Department tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {deptDoctors.map((dep) => (
          <button
            key={dep.id}
            type="button"
            onClick={() => setSelectedDept(selectedDept === dep.id ? null : dep.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 ${selectedDept === dep.id ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
          >
            <div className="text-sm font-semibold text-gray-900">{dep.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{dep.desc}</div>
          </button>
        ))}
      </div>

      {/* Doctors of selected department */}
      {selectedDept && (
        <div ref={doctorsListRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
              {deptDoctors.find(d => d.id === selectedDept)?.name} Doctors
            </h4>
            <button type="button" onClick={() => setSelectedDept(null)} className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">Hide</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(deptDoctors.find(d => d.id === selectedDept)?.doctors || []).map((doc) => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 hover:border-gray-300 hover:shadow-sm transition-all">
                <img src={resolveStorageUrl(doc.avatar)} alt={doc.name} loading="lazy" className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100" onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
                <div>
                  <h5 className="text-sm font-semibold text-gray-900">{doc.name}</h5>
                  <p className="text-xs text-gray-500 mt-0.5">{doc.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
