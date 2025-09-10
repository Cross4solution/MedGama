import React from 'react';
import { Header } from '../components/layout';

export default function ForClinicsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">For Clinics</h1>
        <p className="mt-3 text-gray-600">Profile management, CRM, messaging, appointment system, and professional evaluations.</p>
      </section>
    </div>
  );
}
