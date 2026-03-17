import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Building2, BadgeCheck, ArrowRight, Loader2 } from 'lucide-react';
import { searchAPI } from '../../lib/api';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => [
    ...doctors.map((d) => ({ ...d, _type: 'doctor' })),
    ...clinics.map((c) => ({ ...c, _type: 'clinic' })),
  ], [doctors, clinics]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = (query || '').trim();
    if (q.length < 2) {
      setDoctors([]);
      setClinics([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchAPI.live(q)
        .then((res) => {
          const data = res?.data || res;
          setDoctors(data.doctors || []);
          setClinics(data.clinics || []);
        })
        .catch(() => { setDoctors([]); setClinics([]); })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const onSelect = useCallback((item) => {
    setOpen(false);
    setQuery('');
    if (item._type === 'clinic') {
      navigate(`/clinic/${encodeURIComponent(item.slug || item.id)}`);
    } else {
      navigate(`/doctor/${encodeURIComponent(item.slug || item.id)}`);
    }
  }, [navigate]);

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < flatResults.length) {
        e.preventDefault();
        onSelect(flatResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const hasResults = flatResults.length > 0;
  const showDropdown = open && query.trim().length >= 2 && (hasResults || loading);
  const noResults = !loading && query.trim().length >= 2 && !hasResults;

  // Compute flat index offset for clinics (they come after doctors)
  const doctorOffset = 0;
  const clinicOffset = doctors.length;

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl">
      {/* Search icon */}
      <svg
        className="pointer-events-none absolute z-10 left-4 top-1/2 -translate-y-1/2 text-teal-600 opacity-60 w-5 h-5"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder="Search Clinics or Doctors"
        autoComplete="off"
        className="w-full border border-gray-100 rounded-full pl-11 pr-11 py-3.5 text-base bg-white/95 backdrop-blur shadow-[0_6px_20px_-5px_rgba(28,106,131,0.35),0_2px_6px_-2px_rgba(2,6,23,0.2)] hover:shadow-[0_10px_30px_-10px_rgba(28,106,131,0.45),0_4px_12px_-3px_rgba(2,6,23,0.25)] focus:shadow-[0_12px_36px_-12px_rgba(28,106,131,0.55),0_6px_16px_-4px_rgba(2,6,23,0.3)] focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-transparent transition-all duration-200"
      />

      {/* Loading spinner or clear button */}
      {query && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />}
          <button
            type="button"
            aria-label="Clear"
            className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
            onClick={() => { setQuery(''); setActiveIndex(-1); setOpen(false); inputRef.current?.focus(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}

      {/* ═══ Dropdown ═══ */}
      {showDropdown && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">

          {/* Loading state */}
          {loading && !hasResults && (
            <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}

          {/* Doctors category */}
          {doctors.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Doctors</span>
                <span className="text-[11px] text-gray-300">({doctors.length})</span>
              </div>
              <ul role="listbox">
                {doctors.map((d, idx) => {
                  const flatIdx = doctorOffset + idx;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={activeIndex === flatIdx}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        onClick={() => onSelect({ ...d, _type: 'doctor' })}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-100 ${activeIndex === flatIdx ? 'bg-teal-50/70' : 'hover:bg-gray-50'}`}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100 flex items-center justify-center overflow-hidden">
                          {d.avatar ? (
                            <img src={d.avatar} alt="" className="w-full h-full object-cover rounded-full" loading="lazy" />
                          ) : (
                            <Stethoscope className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-800 truncate">{d.name}</span>
                            {d.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                          </div>
                          {(d.specialty || d.title) && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{d.title ? `${d.title} · ` : ''}{d.specialty || ''}</p>
                          )}
                        </div>
                        {/* Arrow */}
                        <ArrowRight className={`w-4 h-4 flex-shrink-0 transition-opacity ${activeIndex === flatIdx ? 'text-teal-500 opacity-100' : 'opacity-0'}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Divider between categories */}
          {doctors.length > 0 && clinics.length > 0 && (
            <div className="mx-4 border-t border-gray-100" />
          )}

          {/* Clinics category */}
          {clinics.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Clinics</span>
                <span className="text-[11px] text-gray-300">({clinics.length})</span>
              </div>
              <ul role="listbox">
                {clinics.map((c, idx) => {
                  const flatIdx = clinicOffset + idx;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={activeIndex === flatIdx}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        onClick={() => onSelect({ ...c, _type: 'clinic' })}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-100 ${activeIndex === flatIdx ? 'bg-teal-50/70' : 'hover:bg-gray-50'}`}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-100 flex items-center justify-center overflow-hidden">
                          {c.avatar ? (
                            <img src={c.avatar} alt="" className="w-full h-full object-cover rounded-xl" loading="lazy" />
                          ) : (
                            <Building2 className="w-5 h-5 text-teal-400" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-800 truncate">{c.name}</span>
                            {c.verified && <BadgeCheck className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />}
                          </div>
                          {c.address && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{c.address}</p>
                          )}
                        </div>
                        {/* Arrow */}
                        <ArrowRight className={`w-4 h-4 flex-shrink-0 transition-opacity ${activeIndex === flatIdx ? 'text-teal-500 opacity-100' : 'opacity-0'}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Bottom padding */}
          {hasResults && <div className="h-1.5" />}
        </div>
      )}

      {/* No results state */}
      {open && noResults && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200/80 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-5 text-center">
            <p className="text-sm text-gray-400">No doctors or clinics found for "<span className="font-medium text-gray-600">{query.trim()}</span>"</p>
          </div>
        </div>
      )}
    </div>
  );
}
