import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { clinicAPI } from '../../lib/api';

const PLACEHOLDER_HINTS = [
  'Search clinics or doctors',
  'Try "Dental implant Istanbul"',
  'Try "Cardiology"',
  'Try "Dr. Ahmet Yılmaz"',
  'Try "Hair transplant"',
  'Try "Rhinoplasty Turkey"',
];

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [ph, setPh] = useState(PLACEHOLDER_HINTS[0]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const phIndexRef = useRef(0);
  const phCharRef = useRef(0);
  const phDirectionRef = useRef('deleting'); // 'typing' | 'deleting' | 'pause'
  const phTimerRef = useRef(null);

  // Lightweight typing animation for placeholder
  const animatePlaceholder = useCallback(() => {
    const dir = phDirectionRef.current;
    const idx = phIndexRef.current;
    const full = PLACEHOLDER_HINTS[idx];

    if (dir === 'pause') {
      // Wait then start deleting
      phDirectionRef.current = 'deleting';
      phTimerRef.current = setTimeout(animatePlaceholder, 1200);
      return;
    }

    if (dir === 'deleting') {
      if (phCharRef.current > 0) {
        phCharRef.current -= 1;
        setPh(full.slice(0, phCharRef.current));
        phTimerRef.current = setTimeout(animatePlaceholder, 15);
      } else {
        // Move to next hint
        phIndexRef.current = (idx + 1) % PLACEHOLDER_HINTS.length;
        phDirectionRef.current = 'typing';
        phTimerRef.current = setTimeout(animatePlaceholder, 200);
      }
      return;
    }

    // typing
    const target = PLACEHOLDER_HINTS[phIndexRef.current];
    if (phCharRef.current < target.length) {
      phCharRef.current += 1;
      setPh(target.slice(0, phCharRef.current));
      phTimerRef.current = setTimeout(animatePlaceholder, 28);
    } else {
      phDirectionRef.current = 'pause';
      phTimerRef.current = setTimeout(animatePlaceholder, 2000);
    }
  }, []);

  useEffect(() => {
    // Start animation after initial pause
    phCharRef.current = PLACEHOLDER_HINTS[0].length;
    phDirectionRef.current = 'pause';
    phTimerRef.current = setTimeout(animatePlaceholder, 3000);
    return () => clearTimeout(phTimerRef.current);
  }, [animatePlaceholder]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fallback static data
  const staticClinics = ['Acıbadem Sağlık Grubu', 'Acibadem International', 'SmileCare Clinic', 'AestheticPlus', 'Vision Center', 'OrthoLife'];
  const staticDoctors = ['Dr. Ahmet Yılmaz', 'Dr. Mehmet Demir', 'Dr. Elif Kaya', 'Dr. Ayşe Yılmaz'];

  const [apiResults, setApiResults] = useState([]);
  const debounceRef = useRef(null);

  // Debounced API search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = (query || '').trim();
    if (!q) { setApiResults([]); return; }
    debounceRef.current = setTimeout(() => {
      clinicAPI.list({ search: q, per_page: 8 }).then((res) => {
        const list = res?.data || [];
        if (list.length) {
          setApiResults(list.map((c) => ({ type: 'Klinik', name: c.fullname || c.name, id: c.id, codename: c.codename })));
        } else {
          setApiResults([]);
        }
      }).catch(() => setApiResults([]));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const normalize = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const results = useMemo(() => {
    // API sonuçları varsa onları kullan
    if (apiResults.length > 0) return apiResults;
    // Fallback: statik veri
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const items = [
      ...staticClinics.map((c) => ({ type: 'Klinik', name: c })),
      ...staticDoctors.map((d) => ({ type: 'Doktor', name: d })),
    ];
    return items
      .filter((i) => {
        const nameN = normalize(i.name);
        return tokens.every((t) => nameN.includes(t));
      })
      .slice(0, 8);
  }, [query, apiResults]);


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
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl focus-within:ring-4 focus-within:ring-[#1C6A83]/15 rounded-full transition-shadow">
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
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Results</span>
            <span className="text-xs text-gray-400">{results.length} found</span>
          </div>
          <ul role="listbox" className="max-h-72 overflow-auto py-1">
            {results.map((r, idx) => {
              const isClinic = r.type === 'Klinik';
              return (
                <li key={idx}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => onSelect(r.name)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${activeIndex === idx ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isClinic ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                        <img
                          src={isClinic ? '/images/icon/medical-clinic-svgrepo-com.svg' : '/images/icon/doctor-man-profile-svgrepo-com.svg'}
                          alt=""
                          className="w-5 h-5"
                          loading="lazy"
                        />
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate">{r.name}</span>
                    </span>
                    <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${isClinic ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'}`}>
                      {isClinic ? 'Clinic' : 'Doctor'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
