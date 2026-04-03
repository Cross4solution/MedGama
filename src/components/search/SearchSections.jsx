import React from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import CustomSearch from './CustomSearch';

export default function SearchSections() {
  const { user } = useAuth();

  return (
    <>
      {/* Custom Search (Country → City → Speciality → Symptom/Procedure) */}
      <section className="pt-4 pb-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Search</h2>
          <CustomSearch />
        </div>
      </section>

      {/* Clinics Search (unified clinic/doctor autocomplete) */}
      <section id="clinics-search" className="pt-7 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Clinic Search</h2>
          <div className="relative max-w-3xl mx-auto">
            <GlobalSearch />
          </div>
          {/* Title for course/feature boxes under simple search */}
          <div id="discover-services" className="mt-14 mb-0 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Discover Our World-First Services</h2>
          </div>
        </div>
      </section>
    </>
  );
}
