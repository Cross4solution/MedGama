import React from 'react';

// Client-approved brief: 6 boxes (optional +2 kept out for now)
const CORE_ITEMS = [
  { title: 'Top Clinics in Your Area', desc: 'Discover highly rated clinics near you with transparent details.' },
  { title: 'Popular Treatments', desc: 'Browse trending procedures and compare options easily.' },
  { title: 'Trusted Reviews', desc: 'Real patient feedback with verified, quality-controlled reviews.' },
  { title: 'Telehealth Consultation', desc: 'Secure online consultations and second opinions.' },
  { title: 'Medical Tourism Programs', desc: 'End-to-end travel plans: flights, hotel, transfer included.' },
  { title: 'AI Symptom Checker', desc: 'Explain symptoms and get guided, structured next steps.' },
];

export default function CoreBoxes({ items = CORE_ITEMS }) {
  return (
    <section id="features" className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {items.map((f, i) => (
            <div key={i} className="p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded bg-teal-100 mb-3" />
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
