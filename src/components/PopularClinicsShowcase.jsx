import React, { useMemo, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function ClinicCard({ clinic, onClick, onView }) {
  const { t } = useTranslation();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(clinic)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(clinic); } }}
      className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/40"
    >
      <div className="relative h-40 overflow-hidden">
        <img src={clinic.image} alt={clinic.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-gray-900">{clinic.rating}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-3.5">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{clinic.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="truncate">{clinic.city} · {clinic.dept}</span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{clinic.reviews} {t('home.reviews')}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView(clinic); }}
            className="px-3.5 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            {t('common.view')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScrollArrow({ direction, onClick }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
      onClick={onClick}
      className={`hidden md:flex absolute ${direction === 'left' ? '-left-5' : '-right-5'} top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all`}
    >
      <Icon className="w-4 h-4 text-gray-600" />
    </button>
  );
}

export default function PopularClinicsShowcase({
  items = [],
  title: titleProp,
  midTitle: midTitleProp,
  viewAllHref = '#',
  onCardClick = (_c) => {},
  onViewClick = (_c) => {},
}) {
  const { t } = useTranslation();
  const title = titleProp || t('home.popularTreatments');
  const midTitle = midTitleProp || t('home.popularClinics');
  const scrollRefTop = useRef(null);
  const scrollRefBottom = useRef(null);
  const columns = useMemo(() => {
    const arr = items;
    const cols = [];
    for (let i = 0; i < arr.length; i += 2) cols.push(arr.slice(i, i + 2));
    return cols;
  }, [items]);

  const scrollByAmount = (ref, dir = 1) => {
    const el = ref?.current;
    if (!el) return;
    const firstCol = el.querySelector('.snap-start');
    const gap = 16;
    const amount = firstCol ? firstCol.clientWidth + gap : el.clientWidth;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const handleCardClick = (c) => {
    if (typeof onCardClick === 'function') onCardClick(c);
  };
  const handleViewClick = (c) => {
    if (typeof onViewClick === 'function') onViewClick(c);
  };

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top: Popular Treatments */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <a href={viewAllHref} className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">{t('home.viewAll')} →</a>
        </div>
        <div className="relative mb-10">
          <ScrollArrow direction="left" onClick={() => scrollByAmount(scrollRefTop, -1)} />
          <ScrollArrow direction="right" onClick={() => scrollByAmount(scrollRefTop, 1)} />

          <div
            ref={scrollRefTop}
            className="overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory pr-2 -mr-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-4 px-0">
              {columns.map((col, i) => (
                <div key={`top-${i}`} className="flex-none shrink-0 basis-[80%] sm:basis-[48%] lg:basis-[calc((100%_-_32px)/3)] min-w-0 snap-start [scroll-snap-stop:always]">
                  <div className="flex flex-col gap-4">
                    {col[0] && <ClinicCard clinic={col[0]} onClick={handleCardClick} onView={handleViewClick} />}
                    {col[1] && <ClinicCard clinic={col[1]} onClick={handleCardClick} onView={handleViewClick} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Popular Clinics */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{midTitle}</h2>
          <a href={viewAllHref} className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">{t('home.viewAll')} →</a>
        </div>
        <div className="relative">
          <ScrollArrow direction="left" onClick={() => scrollByAmount(scrollRefBottom, -1)} />
          <ScrollArrow direction="right" onClick={() => scrollByAmount(scrollRefBottom, 1)} />

          <div
            ref={scrollRefBottom}
            className="overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory pr-2 -mr-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-4 px-0">
              {columns.map((col, i) => (
                <div key={`bot-${i}`} className="flex-none shrink-0 basis-[80%] sm:basis-[48%] lg:basis-[calc((100%_-_32px)/3)] min-w-0 snap-start [scroll-snap-stop:always]">
                  <div className="flex flex-col gap-4">
                    {col[1] && <ClinicCard clinic={col[1]} onClick={handleCardClick} onView={handleViewClick} />}
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
