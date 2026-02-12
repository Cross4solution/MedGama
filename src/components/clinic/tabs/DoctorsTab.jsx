import React, { useRef, useEffect } from 'react';

export default function DoctorsTab({ doctorsText, deptDoctors, selectedDept, setSelectedDept }) {
  const doctorsListRef = useRef(null);

  useEffect(() => {
    if (selectedDept && doctorsListRef.current) {
      setTimeout(() => {
        doctorsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [selectedDept]);
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
                <img src={doc.avatar} alt={doc.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100" />
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
