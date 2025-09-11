import React from 'react';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import CustomSearch from './CustomSearch';

export default function SearchSections() {
  const { user } = useAuth();
  const isPatient = user && user.role === 'patient';
  // Patient login olduğunda: arkaya GRAYSCALE görsel + siyah transparan overlay uygula

  return (
    <>
      {/* Clinics Search (unified clinic/doctor autocomplete) */}
      <section id="clinics-search" className={`pt-6 pb-6 border-y ${isPatient ? 'relative' : 'bg-gray-50'}`}>
        {isPatient && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center filter grayscale"
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/default/patient-login-background.jpg)` }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
          </>
        )}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className={`text-lg font-semibold mb-5 text-center ${isPatient ? 'text-white drop-shadow' : 'text-gray-900'}`}>Clinics Search</h2>
          <GlobalSearch />
        </div>
      </section>

      {/* Custom Search (Country → City → Speciality → Symptom/Procedure) */}
      <section className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Custom Search</h2>
          <CustomSearch />
        </div>
      </section>
    </>
  );
}
