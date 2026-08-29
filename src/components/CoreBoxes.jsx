import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stethoscope, Activity, MessageSquare, Video, Plane, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Telefonda altı kart alt alta duruyordu: yaklaşık 1000px'lik bir şerit,
// yani kullanıcı listeyi geçmek için ekran boyu kadar kaydırıyordu ve
// altındaki içeriği hiç görmüyordu. Aynı kartlar yatay kaydırmalı şeritte
// ~200px'e iniyor ve metin kırpılmadan okunuyor.
//
// Masaüstü düzeni DEĞİŞMEDİ: `sm` ve üstünde aynı ızgara. Şerit yalnız
// `sm` altındaki genişliklerde kuruluyor.
export default function CoreBoxes() {
  const { t } = useTranslation();
  const items = [
    { title: t('home.coreBox1Title'), desc: t('home.coreBox1Desc') },
    { title: t('home.coreBox2Title'), desc: t('home.coreBox2Desc') },
    { title: t('home.coreBox3Title'), desc: t('home.coreBox3Desc') },
    { title: t('home.coreBox4Title'), desc: t('home.coreBox4Desc') },
    { title: t('home.coreBox5Title'), desc: t('home.coreBox5Desc') },
    { title: t('home.coreBox6Title'), desc: t('home.coreBox6Desc') },
  ];
  const ICONS = [Stethoscope, Activity, Brain, Plane, Video, MessageSquare];
  const PALETTE = [
    { bg: 'bg-teal-100', fg: 'text-teal-700' },
    { bg: 'bg-sky-100', fg: 'text-sky-700' },
    { bg: 'bg-rose-100', fg: 'text-rose-700' },
    { bg: 'bg-amber-100', fg: 'text-amber-700' },
    { bg: 'bg-violet-100', fg: 'text-violet-700' },
    { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
    { bg: 'bg-indigo-100', fg: 'text-indigo-700' },
    { bg: 'bg-pink-100', fg: 'text-pink-700' },
  ];

  const seritRef = useRef(null);
  const [etkin, setEtkin] = useState(0);

  // Kaçıncı kartta olduğumuz. RTL'de `scrollLeft` negatif geliyor (Chrome),
  // bu yüzden mutlak değer alınıyor — yoksa Arapça arayüzde gösterge hep
  // ilk noktada kalırdı.
  const konumuOku = useCallback(() => {
    const el = seritRef.current;
    if (!el) return;
    const kart = el.querySelector('[data-kart]');
    if (!kart) return;
    const adim = kart.getBoundingClientRect().width + 12; // gap-3
    setEtkin(Math.max(0, Math.min(items.length - 1, Math.round(Math.abs(el.scrollLeft) / adim))));
  }, [items.length]);

  useEffect(() => {
    const el = seritRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', konumuOku, { passive: true });
    return () => el.removeEventListener('scroll', konumuOku);
  }, [konumuOku]);

  const kartaGit = (i) => {
    const el = seritRef.current;
    const kart = el?.querySelectorAll('[data-kart]')[i];
    if (!el || !kart) return;
    const azHareket = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    kart.scrollIntoView({ behavior: azHareket ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
  };

  return (
    <section id="services-overview" className="pt-2 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Telefonda yatay şerit, sm'den itibaren ızgara. Şeridin sağ kenarı
            ekran dışına taşırılıyor (`pe-4 -me-4`) ki sonraki kartın ucu
            görünsün — kaydırılabildiğinin tek görsel işareti bu. */}
        <div
          ref={seritRef}
          className="flex gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pe-4 -me-4 pb-1
                     [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
                     sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pe-0 sm:me-0 sm:pb-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.slice(0, 6).map((f, i) => {
            const Icon = ICONS[i % ICONS.length];
            const theme = PALETTE[i % PALETTE.length];
            return (
              <div
                key={i}
                data-kart
                className="relative rounded-2xl border border-gray-200/70 bg-gray-50/60 overflow-hidden
                           shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]
                           w-[82%] shrink-0 snap-start [scroll-snap-stop:always]
                           sm:w-auto sm:shrink"
              >
                <div className="relative p-4 sm:p-5 flex flex-col h-full">
                  <div className={`w-9 h-9 rounded-xl ${theme.bg} mb-3 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${theme.fg}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-[13px] sm:text-[14px] leading-5 mb-1.5">{f.title}</h3>
                  <p className="text-[12px] sm:text-[13px] text-gray-500 leading-[1.5] sm:leading-relaxed flex-grow">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nokta göstergesi yalnız şerit hâlindeyken. Görevi süs değil: yatay
            kaydırmada kaç kart olduğu ve nerede olunduğu başka türlü
            görünmüyor. Dokunma hedefi WCAG 2.5.8 için 24px; görünen nokta
            küçük, tıklanan alan değil. */}
        <div className="mt-3 flex items-center justify-center gap-1 sm:hidden">
          {items.slice(0, 6).map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => kartaGit(i)}
              aria-label={f.title}
              aria-current={i === etkin ? 'true' : undefined}
              className="w-6 h-6 flex items-center justify-center rounded-full"
            >
              <span
                className={`block rounded-full transition-all ${
                  i === etkin ? 'w-4 h-1.5 bg-teal-600' : 'w-1.5 h-1.5 bg-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
