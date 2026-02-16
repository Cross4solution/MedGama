import React from 'react';
import { Stethoscope, Activity, MessageSquare, Video, Plane, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  return (
    <section id="features" className="pt-4 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {items.slice(0, 6).map((f, i) => {
            const Icon = ICONS[i % ICONS.length];
            const theme = PALETTE[i % PALETTE.length];
            return (
              <div key={i} className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="relative p-5 sm:p-6 flex flex-col h-full">
                  <div className={`w-11 h-11 rounded-xl ${theme.bg} mb-4 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${theme.fg}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-[15px] leading-5 sm:leading-6 mb-2">{f.title}</h3>
                  <p className="text-[13px] sm:text-sm text-gray-500 leading-5 sm:leading-relaxed flex-grow">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
