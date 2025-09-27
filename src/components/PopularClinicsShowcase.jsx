import React, { useMemo, useRef } from 'react';
import { Star } from 'lucide-react';

export default function PopularClinicsShowcase({
  items = [],
  title = 'Popular Treatments',
  midTitle = 'Popular Clinics',
  viewAllHref = '#',
  onCardClick = (_c) => {},
  onViewClick = (_c) => {},
}) {
  const scrollRefTop = useRef(null);
  const scrollRefBottom = useRef(null);
  const columns = useMemo(() => {
    const arr = items; // tüm gönderilen öğeleri kullan
    const cols = [];
    for (let i = 0; i < arr.length; i += 2) cols.push(arr.slice(i, i + 2));
    return cols;
  }, [items]);

  const scrollByAmount = (ref, dir = 1) => {
    const el = ref?.current;
    if (!el) return;
    // Bir sütun kadar kaydır (gap-4 = 16px)
    const firstCol = el.querySelector('.snap-start');
    const gap = 16;
    const amount = firstCol ? firstCol.clientWidth + gap : el.clientWidth;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const handleCardClick = (c) => {
    if (typeof onCardClick === 'function') onCardClick(c);
  };
  const handleViewClick = (e, c) => {
    e.stopPropagation();
    if (typeof onViewClick === 'function') onViewClick(c);
  };

  return (
    <section className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top: Popular Treatments */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <a href={viewAllHref} className="text-sm text-teal-700 hover:underline">View All</a>
        </div>
        <div className="relative mb-8">
          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByAmount(scrollRefTop, -1)}
            className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white"
          >
            <span className="sr-only">Prev</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          {/* Right Arrow */}
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByAmount(scrollRefTop, 1)}
            className="hidden md:flex absolute -right-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white"
          >
            <span className="sr-only">Next</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>

          {/* Scrollable area */}
          <div
            ref={scrollRefTop}
            className="overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory pr-2 -mr-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-4 px-0">
              {columns.map((col, i) => (
                <div key={`top-${i}`} className="flex-none shrink-0 basis-[85%] sm:basis-[55%] lg:basis-[calc((100%_-_32px)/3)] min-w-0 snap-start [scroll-snap-stop:always]">
                  <div className="flex flex-col gap-4">
                    {col[0] && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleCardClick(col[0])}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(col[0]); } }}
                        className="rounded-2xl border bg-white p-4 hover:shadow-md transition h-72 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
                      >
                        <div className="h-36 rounded-lg bg-gray-100 mb-3 overflow-hidden">
                          <img src={col[0].image} alt={col[0].name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{col[0].name}</h3>
                            <div className="flex items-center text-amber-600">
                              <Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" />
                              <span className="font-medium text-gray-900">{col[0].rating}</span>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{col[0].city} • {col[0].dept}</p>
                          <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                            <span className="text-gray-500">{col[0].reviews} Reviews</span>
                            <button type="button" onClick={(e) => handleViewClick(e, col[0])} className="px-3 py-1.5 bg-[#1C6A83] text-white rounded-lg hover:bg-[#155a6f]">View</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {col[1] && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleCardClick(col[1])}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(col[1]); } }}
                        className="rounded-2xl border bg-white p-4 hover:shadow-md transition h-72 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
                      >
                        <div className="h-36 rounded-lg bg-gray-100 mb-3 overflow-hidden">
                          <img src={col[1].image} alt={col[1].name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{col[1].name}</h3>
                            <div className="flex items-center text-amber-600">
                              <Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" />
                              <span className="font-medium text-gray-900">{col[1].rating}</span>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{col[1].city} • {col[1].dept}</p>
                          <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                            <span className="text-gray-500">{col[1].reviews} Reviews</span>
                            <button type="button" onClick={(e) => handleViewClick(e, col[1])} className="px-3 py-1.5 bg-[#1C6A83] text-white rounded-lg hover:bg-[#155a6f]">View</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Popular Clinics */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{midTitle}</h2>
          <a href={viewAllHref} className="text-sm text-teal-700 hover:underline">View All</a>
        </div>
        <div className="relative">
          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByAmount(scrollRefBottom, -1)}
            className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white"
          >
            <span className="sr-only">Prev</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          {/* Right Arrow */}
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByAmount(scrollRefBottom, 1)}
            className="hidden md:flex absolute -right-8 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white"
          >
            <span className="sr-only">Next</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>

          {/* Scrollable area */}
          <div
            ref={scrollRefBottom}
            className="overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory pr-2 -mr-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-4 px-0">
              {columns.map((col, i) => (
                <div key={`bot-${i}`} className="flex-none shrink-0 basis-[85%] sm:basis-[55%] lg:basis-[calc((100%_-_32px)/3)] min-w-0 snap-start [scroll-snap-stop:always]">
                  <div className="flex flex-col gap-4">
                    {col[1] && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleCardClick(col[1])}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(col[1]); } }}
                        className="rounded-2xl border bg-white p-4 hover:shadow-md transition h-72 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
                      >
                        <div className="h-36 rounded-lg bg-gray-100 mb-3 overflow-hidden">
                          <img src={col[1].image} alt={col[1].name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{col[1].name}</h3>
                            <div className="flex items-center text-amber-600">
                              <Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" />
                              <span className="font-medium text-gray-900">{col[1].rating}</span>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{col[1].city} • {col[1].dept}</p>
                          <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                            <span className="text-gray-500">{col[1].reviews} Reviews</span>
                            <button type="button" onClick={(e) => handleViewClick(e, col[1])} className="px-3 py-1.5 bg-[#1C6A83] text-white rounded-lg hover:bg-[#155a6f]">View</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
