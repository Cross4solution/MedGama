import React from 'react';
import Header from '../components/Header';

export default function ForPatientsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">For Patients</h1>
        <p className="mt-3 text-gray-600">Discover clinics, book appointments, meet via telehealth, and communicate securely.</p>
      </section>
    </div>
  );
}
