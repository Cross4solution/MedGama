import React from 'react';
import { Stethoscope, Activity, MessageSquare, Video, Plane, Brain } from 'lucide-react';

// Core features (8 items)
const CORE_ITEMS = [
  { title: 'Top Clinics in Your Area', desc: 'Discover highly rated clinics near you with transparent details.' },
  { title: 'Popular Treatments', desc: 'Browse trending procedures and compare options easily.' },
  { title: 'Trusted Reviews', desc: 'Real patient feedback with verified, quality-controlled reviews.' },
  { title: 'Telehealth Consultation', desc: 'Secure online consultations and second opinions.' },
  { title: 'Medical Tourism Programs', desc: 'End-to-end travel plans: flights, hotel, transfer included.' },
  { title: 'AI Symptom Checker', desc: 'Explain symptoms and get guided, structured next steps.' },
  { title: 'Insurance & Financing', desc: 'Flexible payment plans and insurance compatibility guidance.' },
  { title: '24/7 Patient Support', desc: 'Always-on assistance for scheduling and follow-ups.' },
];

export default function CoreBoxes({ items = CORE_ITEMS }) {
  const ICONS = [Stethoscope, Activity, MessageSquare, Video, Plane, Brain];
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
    <section id="features" className="pt-6 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.slice(0, 8).map((f, i) => {
            const Icon = ICONS[i % ICONS.length];
            const theme = PALETTE[i % PALETTE.length];
            return (
              <div key={i} className="group p-4 sm:p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition focus-within:ring-2 focus-within:ring-teal-300">
                <div className={`w-10 h-10 rounded-lg ${theme.bg} mb-3 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${theme.fg}`} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
