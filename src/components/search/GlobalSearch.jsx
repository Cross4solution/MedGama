import React, { useMemo, useState, useEffect } from 'react';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [ph, setPh] = useState('Search clinics or doctors');
  const [activeIndex, setActiveIndex] = useState(-1);

  const clinics = [
    'Acıbadem Sağlık Grubu',
    'Acibadem International',
    'SmileCare Clinic',
    'AestheticPlus',
    'Vision Center',
    'OrthoLife',
  ];
  const doctors = [
    'Dr. Ahmet Yılmaz',
    'Dr. Mehmet Demir',
    'Dr. Elif Kaya',
    'Dr. Ayşe Yılmaz',
  ];

  const normalize = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const items = [
      ...clinics.map((c) => ({ type: 'Klinik', name: c })),
      ...doctors.map((d) => ({ type: 'Doktor', name: d })),
    ];
    return items
      .filter((i) => {
        const nameN = normalize(i.name);
        return tokens.every((t) => nameN.includes(t));
      })
      .slice(0, 8);
  }, [query]);

  // Set static placeholder (no animation)
  useEffect(() => {
    setPh('Search clinics or doctors');
  }, []);

  const onSelect = (name) => {
    setQuery(name); // autofill input with selected value
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault();
        onSelect(results[activeIndex].name);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl focus-within:ring-4 focus-within:ring-[#1C6A83]/15 rounded-full transition-shadow">
      {/* Search icon (prefix) */}
      <svg
        className="pointer-events-none absolute z-10 left-4 top-1/2 -translate-y-1/2 text-[#1C6A83] opacity-60 w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={ph}
        className="w-full border border-gray-100 rounded-full pl-11 pr-11 py-3.5 text-base bg-white/95 backdrop-blur shadow-[0_6px_20px_-5px_rgba(28,106,131,0.35),0_2px_6px_-2px_rgba(2,6,23,0.2)] hover:shadow-[0_10px_30px_-10px_rgba(28,106,131,0.45),0_4px_12px_-3px_rgba(2,6,23,0.25)] focus:shadow-[0_12px_36px_-12px_rgba(28,106,131,0.55),0_6px_16px_-4px_rgba(2,6,23,0.3)] focus:outline-none focus:ring-4 focus:ring-[#1C6A83]/25 focus:border-transparent transition-shadow duration-200"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
          onClick={() => { setQuery(''); setActiveIndex(-1); setOpen(false); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <ul role="listbox" className="max-h-64 overflow-auto">
            {results.map((r, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  role="option"
                  aria-selected={activeIndex === idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => onSelect(r.name)}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between ${activeIndex===idx ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <span>{r.name}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <img
                      src={r.type === 'Klinik' ? '/images/icon/medical-clinic-svgrepo-com.svg' : '/images/icon/doctor-man-profile-svgrepo-com.svg'}
                      alt={r.type}
                      className="w-3.5 h-3.5 opacity-80"
                      loading="lazy"
                    />
                    {r.type === 'Klinik' ? 'Clinic' : r.type === 'Doktor' ? 'Doctor' : r.type}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
