import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function CityCombobox({
  options = [],
  value,
  onChange,
  placeholder = 'Select City',
  disabled = false,
  loading = false,
}) {
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

  // Lock body scroll when dropdown is open to prevent page scrolling
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Prevent layout shift by compensating for scrollbar width
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    // options değiştiğinde aramayı sıfırla
    setQuery('');
  }, [options]);

  const selectedLabel = value || '';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-base md:text-sm bg-white text-left ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {loading ? 'Loading…' : (selectedLabel || placeholder)}
      </button>
      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              className="w-full border border-gray-200 rounded px-2 py-1 text-base md:text-sm"
              placeholder="Search city"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <SlowScrollList className="max-h-64 overflow-y-auto text-sm" items={filtered} onSelect={(opt) => { onChange && onChange(opt); setOpen(false); setQuery(''); }} />
        </div>
      )}
    </div>
  );
}

// Internal helper component to provide smooth and slower wheel scrolling
function SlowScrollList({ className = '', items = [], onSelect }) {
  const listRef = useRef(null);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onWheel = (e) => {
      // Slow down the wheel delta to reduce scroll speed
      if (e.cancelable) e.preventDefault();
      const factor = 0.25; // 25% of default speed
      el.scrollTop += e.deltaY * factor;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <ul
      ref={listRef}
      className={className}
      style={{ scrollBehavior: 'smooth' }}
    >
      {items.map((opt) => (
        <li key={opt}>
          <button
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-gray-50"
            onClick={() => onSelect && onSelect(opt)}
          >
            {opt}
          </button>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-3 py-2 text-gray-500 text-xs">No results</li>
      )}
    </ul>
  );
}
