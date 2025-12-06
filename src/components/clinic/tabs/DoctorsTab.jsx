import React from 'react';

export default function DoctorsTab({ doctorsText, deptDoctors, selectedDept, setSelectedDept }) {
  const scrollDownSlightly = () => {
    try {
      const startY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const distance = 160;
      const duration = 900;
      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
        const nextY = startY + distance * eased;
        window.scrollTo(0, nextY);
        if (elapsed < duration) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    } catch {
      try { window.scrollBy(0, 160); } catch {}
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Doctors</h3>
      <p className="text-gray-600">{doctorsText}</p>

      {/* Department tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {deptDoctors.map((dep) => (
          <button
            key={dep.id}
            type="button"
            onClick={() => {
              const next = selectedDept === dep.id ? null : dep.id;
              setSelectedDept(next);
              if (next) scrollDownSlightly();
            }}
            className={`text-left p-4 rounded-xl border shadow-sm bg-white hover:bg-teal-50 transition ${selectedDept === dep.id ? 'ring-2 ring-teal-500' : ''}`}
          >
            <div className="font-semibold text-gray-900">{dep.name}</div>
            <div className="text-sm text-gray-600">{dep.desc}</div>
          </button>
        ))}
      </div>

      {/* Doctors of selected department */}
      {selectedDept && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              {deptDoctors.find(d => d.id === selectedDept)?.name} Doctors
            </h4>
            <button type="button" onClick={() => setSelectedDept(null)} className="text-sm text-teal-700 hover:underline">Hide</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {(deptDoctors.find(d => d.id === selectedDept)?.doctors || []).map((doc) => (
              <div key={doc.id} className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
                <img src={doc.avatar} alt={doc.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h5 className="font-semibold text-gray-900">{doc.name}</h5>
                  <p className="text-sm text-gray-600">{doc.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
