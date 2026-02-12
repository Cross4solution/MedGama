import React from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import CustomSearch from './CustomSearch';

export default function SearchSections() {
  const { user } = useAuth();

  return (
    <>
      {/* Clinics Search (unified clinic/doctor autocomplete) */}
      <section id="clinics-search" className="pt-8 pb-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">Find Clinics & Doctors</h2>
          </div>
          <GlobalSearch />
        </div>
      </section>

      {/* Custom Search (Country → City → Speciality → Symptom/Procedure) */}
      <section className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4.5 h-4.5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Advanced Search</h2>
          </div>
          <CustomSearch />
          {/* Title for course/feature boxes under custom search */}
          <div className="mt-14 mb-2 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Discover Our World-First Services</h2>
          </div>
        </div>
      </section>
    </>
  );
}
