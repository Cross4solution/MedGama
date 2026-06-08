import React, { useMemo, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function formatRating(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(1);
}

function ClinicCard({ clinic, onClick, onView }) {
  const { t } = useTranslation();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(clinic)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(clinic); } }}
      className="group rounded-md border border-[#e5edf5] bg-white overflow-hidden shadow-[rgba(0,0,0,0.06)_0px_3px_6px_0px] hover:shadow-[rgba(50,50,93,0.12)_0px_16px_32px_0px] hover:border-[#d8d6df] transition-all duration-200 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40"
    >
      <div className="relative h-40 overflow-hidden">
        <img src={clinic.image} alt={clinic.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-[4px] px-2 py-1 shadow-[rgba(0,0,0,0.06)_0px_3px_6px_0px]">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-[#061b31]">{formatRating(clinic.rating)}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-3.5">
        <h3 className="text-sm font-normal tracking-[-0.025em] text-[#061b31] line-clamp-1">{clinic.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-[#50617a]">
          <MapPin className="w-3 h-3 text-[#64748d] flex-shrink-0" />
          <span className="truncate">{clinic.city} · {clinic.dept}</span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[11px] text-[#64748d] font-normal">{clinic.reviews} {t('home.reviews')}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView(clinic); }}
            className="px-3.5 py-1.5 bg-[#0d9488] text-white text-xs font-semibold rounded-[4px] hover:bg-[#0f766e] transition-colors shadow-[rgba(0,0,0,0.06)_0px_3px_6px_0px]"
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
      className={`hidden md:flex absolute ${direction === 'left' ? '-left-5' : '-right-5'} top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white border border-[#e5edf5] shadow-[rgba(0,0,0,0.06)_0px_3px_6px_0px] hover:shadow-[rgba(50,50,93,0.12)_0px_16px_32px_0px] hover:border-[#d8d6df] transition-all`}
    >
      <Icon className="w-4 h-4 text-[#50617a]" />
    </button>
  );
}

export default function PopularClinicsShowcase({
  items = [],
  title: titleProp,
  midTitle: midTitleProp,
  viewAllHref = '/browse/treatments',
  viewAllClinicsHref = '/browse/clinics',
  onCardClick = (_c) => {},
  onViewClick = (_c) => {},
}) {
  const { t } = useTranslation();
  const title = titleProp || t('home.popularTreatments');
  const midTitle = midTitleProp || t('home.popularClinics');
  const scrollRefTop = useRef(null);
  const scrollRefBottom = useRef(null);
  const groups = useMemo(() => {
    const arr = items;
    const grps = [];
    for (let i = 0; i < arr.length; i += 3) grps.push(arr.slice(i, i + 3));
    return grps;
  }, [items]);

  const scrollByAmount = (ref, dir = 1) => {
    const el = ref?.current;
    if (!el) return;
    const firstGroup = el.querySelector('.snap-start');
    const gap = 16;
    const amount = firstGroup ? firstGroup.clientWidth + gap : el.clientWidth;
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
          <h2 className="text-lg font-normal tracking-[-0.025em] text-[#061b31]">{title}</h2>
          <Link to={viewAllHref} className="text-xs font-semibold text-[#0d9488] hover:text-[#0f766e] transition-colors">{t('home.viewAll')} →</Link>
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
              {groups.map((group, i) => (
                <div key={`top-${i}`} className="flex-none shrink-0 w-full min-w-0 snap-start [scroll-snap-stop:always]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((clinic, idx) => (
                      <ClinicCard key={idx} clinic={clinic} onClick={handleCardClick} onView={handleViewClick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Popular Clinics */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-normal tracking-[-0.025em] text-[#061b31]">{midTitle}</h2>
          <Link to={viewAllClinicsHref} className="text-xs font-semibold text-[#0d9488] hover:text-[#0f766e] transition-colors">{t('home.viewAll')} →</Link>
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
              {groups.map((group, i) => (
                <div key={`bot-${i}`} className="flex-none shrink-0 w-full min-w-0 snap-start [scroll-snap-stop:always]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((clinic, idx) => (
                      <ClinicCard key={idx} clinic={clinic} onClick={handleCardClick} onView={handleViewClick} />
                    ))}
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
