import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function CountryCombobox({ options = [], value, onChange, placeholder = 'Select Country' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const normalize = (s) => s?.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  const filtered = useMemo(() => {
    const q = normalize(query || '');
    if (!q) return options;
    return options.filter((opt) => normalize(opt).includes(q));
  }, [options, query]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedLabel = value || '';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs md:text-sm bg-white text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {selectedLabel || placeholder}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs md:text-sm"
              placeholder="Search country"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-64 overflow-y-auto text-sm">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={() => { onChange && onChange(opt); setOpen(false); setQuery(''); }}
                >
                  {opt}
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
