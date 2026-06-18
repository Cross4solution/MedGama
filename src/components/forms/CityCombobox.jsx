import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function CityCombobox({
  options = [],
  value,
  onChange,
  placeholder = 'Select City',
  disabled = false,
  loading = false,
  wheelFactor = 1, // 1 = normal hız, <1 yavaş, >1 hızlı
  lockBodyScroll = false, // header kaymasını önlemek için varsayılan false
  triggerClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Sonsuz kaydırma: DOM'a kaç öğe basılacağı (aşağı indikçe artar)
  const PAGE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const ref = useRef(null);

  const normalize = (s) => s?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const sorted = useMemo(() => {
    const q = normalize(query || '');
    if (!q) return options;
    // Prefix-öncelikli sıralama: "ber" → önce "Ber..." (Berlin), sonra "...ber..." (Abenberg)
    // 0 = tam başlangıç eşleşmesi, 1 = kelime başı eşleşmesi, 2 = içeren
    const rank = (name) => {
      const n = normalize(name);
      if (n.startsWith(q)) return 0;
      if (n.split(/[\s\-]+/).some((w) => w.startsWith(q))) return 1;
      return 2;
    };
    return options
      .filter((opt) => normalize(opt).includes(q))
      .map((opt) => [opt, rank(opt)])
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }))
      .map((x) => x[0]);
  }, [options, query]);

  // Render performansı: DOM'a yalnızca görünür sayıda öğe bas
  const filtered = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);

  // Arama/options değişince görünür sayacı sıfırla
  useEffect(() => { setVisibleCount(PAGE); }, [query, options]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // İsteğe bağlı: dropdown açıkken body scroll kilitleme (varsayılan kapalı)
  useEffect(() => {
    if (!lockBodyScroll) return;
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open, lockBodyScroll]);

  useEffect(() => {
    // options değiştiğinde aramayı sıfırla
    setQuery('');
  }, [options]);

  const selectedLabel = value || '';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={
          triggerClassName && triggerClassName.length > 0
            ? `${triggerClassName} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`.trim()
            : `w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm bg-white text-left shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20 transition-shadow ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`
        }
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
          <SlowScrollList
            className="max-h-64 overflow-y-auto text-sm"
            items={filtered}
            wheelFactor={wheelFactor}
            hasMore={sorted.length > filtered.length}
            onLoadMore={() => setVisibleCount((c) => Math.min(c + PAGE, sorted.length))}
            onSelect={(opt) => { onChange && onChange(opt); setOpen(false); setQuery(''); }}
          />
        </div>
      )}
    </div>
  );
}

// Internal helper component to provide smooth and slower wheel scrolling
function SlowScrollList({ className = '', items = [], onSelect, wheelFactor = 1, hasMore = false, onLoadMore }) {
  const listRef = useRef(null);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (wheelFactor === 1) return; // Varsayılan tarayıcı davranışını kullan
    const onWheel = (e) => {
      if (e.cancelable) e.preventDefault();
      el.scrollTop += e.deltaY * wheelFactor;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [wheelFactor]);

  // Sonsuz kaydırma: dibe yaklaşınca daha fazla yükle
  const handleScroll = (e) => {
    if (!hasMore || !onLoadMore) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) onLoadMore();
  };

  return (
    <ul
      ref={listRef}
      className={className}
      onScroll={handleScroll}
      style={wheelFactor !== 1 ? { scrollBehavior: 'smooth' } : undefined}
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
