import React, { useEffect, useMemo, useRef, useState } from 'react';

// Simple responsive carousel with arrows + dots.
// Props:
// - items: array of any
// - renderItem: (item, index) => ReactNode
// - slidesToShow: { base: number, sm?: number, lg?: number }
// - className?: string
export default function Carousel({ items = [], renderItem, slidesToShow = { base: 1, sm: 2, lg: 4 }, className = '' }) {
  const [current, setCurrent] = useState(0); // page index
  const [visible, setVisible] = useState(slidesToShow.base || 1);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  // Responsive breakpoint handling
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w >= 1024 && slidesToShow.lg) setVisible(slidesToShow.lg);
      else if (w >= 640 && slidesToShow.sm) setVisible(slidesToShow.sm);
      else setVisible(slidesToShow.base || 1);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [slidesToShow]);

  // Per-item sliding
  const maxIndex = useMemo(() => {
    if (!items.length) return 0;
    return Math.max(0, items.length - Math.max(1, visible));
  }, [items.length, visible]);

  const goTo = (idx) => setCurrent(Math.max(0, Math.min(idx, maxIndex)));
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // Calculate transform: shift by 1-item width (100/visible)% per step
  const translatePct = current * (100 / Math.max(1, visible));

  // Touch handlers for mobile swipe
  const onTouchStart = (e) => {
    if (!items.length) return;
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    touchDeltaX.current = x - touchStartX.current;
  };
  const onTouchEnd = () => {
    const threshold = 40; // px
    const dx = touchDeltaX.current || 0;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    if (Math.abs(dx) < threshold) return;
    if (dx < 0) next(); else prev();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Track */}
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={(e)=>{ /* optional mouse drag start */ touchStartX.current = e.clientX; touchDeltaX.current = 0; }}
        onMouseMove={(e)=>{ if (touchStartX.current!=null) touchDeltaX.current = e.clientX - touchStartX.current; }}
        onMouseUp={onTouchEnd}
        onMouseLeave={()=>{ touchStartX.current=null; touchDeltaX.current=0; }}
      >
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${translatePct}%)` }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="shrink-0 px-2" style={{ width: `${100 / Math.max(1, visible)}%` }}>
              {renderItem ? renderItem(item, idx) : item}
            </div>
          ))}
        </div>
      </div>

      {/* Side fades (desktop only) */}
      <div aria-hidden className="pointer-events-none hidden md:block absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
      <div aria-hidden className="pointer-events-none hidden md:block absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />

      {/* Arrows */}
      <button type="button" aria-label="Previous" onClick={prev} disabled={current === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border rounded-full w-9 h-9 grid place-items-center shadow disabled:opacity-40">
        <span className="rotate-180">➜</span>
      </button>
      <button type="button" aria-label="Next" onClick={next} disabled={current >= maxIndex}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border rounded-full w-9 h-9 grid place-items-center shadow disabled:opacity-40">
        <span>➜</span>
      </button>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: (items.length ? (maxIndex + 1) : 0) }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full ${i === current ? 'bg-teal-600' : 'bg-gray-300'} hover:bg-teal-500`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
