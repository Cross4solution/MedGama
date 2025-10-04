import React from 'react';
import { Stethoscope, Activity, MessageSquare, Video, Plane, Brain } from 'lucide-react';

// Core features (6 items)
const CORE_ITEMS = [
  {
    title: 'Clinic Profiles and Professional Reviews',
    desc: 'Professional Reviews provide expert opinions on clinics/hospitals and their facilities with photos, videos, and materials to help you make the best decision about your treatment.'
  },
  {
    title: 'Medstream™',
    desc: 'With Medstream, follow your favorite clinics, receive their latest updates, and engage with posts. Get personalized updates from clinics in your preferred region and specialization.'
  },
  {
    title: 'Vasco AI',
    desc: 'World-first artificial intelligence that provides symptom analysis and processes treatment requests, matching you with qualified doctors in your chosen location for your medical needs.'
  },
  {
    title: 'One-Click Medical Tourism Program',
    desc: 'Arrange your complete medical journey with one click - flights, accommodation, transport, and treatment - with transparent total pricing.'
  },
  {
    title: 'Telehealth and Messaging with Real-Time Translation',
    desc: 'Communicate with your doctor or patients instantly online in your native language. No more language barriers through real-time translation technology.'
  },
  {
    title: 'Integrated CRM',
    desc: 'Complete clinic/hospital management system with specialized access levels for different staff roles, seamlessly integrating your medical tourism and regular operations.'
  },
];

export default function CoreBoxes({ items = CORE_ITEMS }) {
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
    <section id="features" className="pt-4 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {items.slice(0, 6).map((f, i) => {
            const Icon = ICONS[i % ICONS.length];
            const theme = PALETTE[i % PALETTE.length];
            return (
              <div key={i} className="group rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col h-full">
                  <div className={`w-9 h-9 rounded-lg ${theme.bg} mb-3 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${theme.fg}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-5 sm:leading-6 mb-2">{f.title}</h3>
                  <p className="text-[13px] sm:text-[15px] text-gray-600 leading-5 sm:leading-6 flex-grow">
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
