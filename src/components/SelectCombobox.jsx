import React, { useEffect, useMemo, useRef, useState } from 'react';

// Reusable select-like combobox with search, outside-click close, and custom left icon
export default function SelectCombobox({
  options = [], // string[] | {label, value}[]
  value,
  onChange,
  placeholder = 'Select',
  leftIcon = null,
  searchable = true,
  dropUp = false,
  triggerClassName = '',
  menuClassName = '',
  hideChevron = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const toOption = (opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt);
  const list = useMemo(() => options.map(toOption), [options]);

  const normalize = (s) => s?.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  const filtered = useMemo(() => {
    if (!searchable) return list;
    const q = normalize(query || '');
    if (!q) return list;
    return list.filter((opt) => normalize(opt.label).includes(q));
  }, [list, query, searchable]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const found = list.find((o) => o.value === value || o.label === value);
    return found ? found.label : value;
  }, [value, list]);

  return (
    <div className="relative group" ref={ref}>
      {/* Left icon */}
      {leftIcon ? (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 z-10">
          {leftIcon}
        </div>
      ) : null}

      {/* Trigger button styled like the original select */}
      <button
        type="button"
        className={
          triggerClassName && triggerClassName.length > 0
            ? triggerClassName
            : `w-full ${leftIcon ? 'pl-10' : 'pl-3'} pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-base md:text-sm font-medium appearance-none cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400 text-left`
        }
        onClick={() => setOpen((o) => !o)}
      >
        {selectedLabel || placeholder}
      </button>

      {/* Right arrow */}
      {!hideChevron && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      {/* Subtle shadow on focus/hover (visual only) */}
      <div className="absolute inset-0 rounded-xl shadow-sm group-hover:shadow-md group-focus-within:shadow-lg transition-shadow duration-300 pointer-events-none" />

      {open && (
        <div className={`absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-lg ${dropUp ? 'bottom-full mb-1' : 'mt-1'} ${menuClassName}`}>
          {searchable && (
            <div className="p-2">
              <input
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs md:text-sm"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto text-sm py-1">
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={() => {
                    onChange && onChange(opt.value);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-gray-500 text-xs">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
