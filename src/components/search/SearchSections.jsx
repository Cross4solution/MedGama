import React from 'react';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import CustomSearch from './CustomSearch';

export default function SearchSections() {
  const { user } = useAuth();

  return (
    <>
      {/* Clinics Search (unified clinic/doctor autocomplete) */}
      <section id="clinics-search" className={"pt-5 pb-6 border-y bg-gray-50"}>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className={"text-lg font-semibold mb-3 text-center text-gray-900"}>Clinics Search</h2>
          <GlobalSearch />
        </div>
      </section>

      {/* Custom Search (Country → City → Speciality → Symptom/Procedure) */}
      <section className="pt-6 pb-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Custom Search</h2>
          <CustomSearch />
          {/* Title for course/feature boxes under custom search */}
          <h2 id="features" className="mt-12 mb-1 text-lg font-semibold text-gray-900 text-left">
            Discover Our World-First Services
          </h2>
        </div>
      </section>
    </>
  );
}
