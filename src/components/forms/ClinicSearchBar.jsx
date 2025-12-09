import React from 'react';
import { CountryCombobox, CityCombobox } from 'components/forms';
import { Search } from 'lucide-react';

export default function ClinicSearchBar({
  country,
  city,
  specialty,
  countryOptions = [],
  cityOptions = [],
  onCountryChange,
  onCityChange,
  onSpecialtyChange,
  onSubmit,
  // Yeni: bayrak URL çözümü ve şehir yükleme durumu
  getFlagUrl,
  citiesLoading,
  // Opsiyonel: semptom / prosedür araması için üst seviyeden state geliyorsa
  symptom,
  onSymptomChange,
}) {
  const isSearchDisabled = !country && !(symptom && symptom.trim()) && !(specialty && specialty.trim());

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-[12rem,12rem,1.1fr,auto,1.1fr,auto]">
        {/* Country */}
        <div className="max-w-48">
          <CountryCombobox
            options={countryOptions}
            value={country}
            onChange={(val) => {
              onCountryChange?.(val);
              onCityChange?.('');
            }}
            placeholder="Country"
            getFlagUrl={getFlagUrl}
            triggerClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm bg-white text-left"
          />
        </div>

        {/* City */}
        <div className="max-w-48">
          <CityCombobox
            options={cityOptions}
            value={city}
            onChange={onCityChange}
            disabled={!country}
            loading={citiesLoading}
            placeholder="City"
            triggerClassName={`w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm bg-white text-left ${
              !country ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Symptom or Procedure */}
        <div className="relative col-span-2 md:col-span-1">
          <div className="border border-gray-300 rounded-lg px-2 py-1 text-base md:text-sm flex items-center flex-wrap gap-2 bg-white">
            <input
              placeholder="Symptom or Procedure (e.g., nasal congestion)"
              className="flex-1 min-w-[8ch] border-0 outline-none px-1 py-1 text-base md:text-sm bg-transparent"
              type="text"
              value={symptom || ''}
              onChange={(e) => onSymptomChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* OR separator */}
        <div className="flex items-center justify-center text-gray-500 col-span-2 md:col-span-1">or</div>

        {/* Specialty text input */}
        <div className="relative col-span-2 md:col-span-1">
          <div className="border border-gray-300 rounded-lg px-2 py-1 text-base md:text-sm flex items-center flex-wrap gap-2 bg-white">
            <input
              placeholder="Type a specialty (e.g., ENT)"
              className="flex-1 min-w-[8ch] border-0 outline-none px-1 py-1 text-base md:text-sm bg-transparent"
              type="text"
              value={specialty || ''}
              onChange={(e) => onSpecialtyChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex md:block col-span-2 md:col-span-1">
          <button
            type="submit"
            disabled={isSearchDisabled}
            onClick={onSubmit}
            className="ml-auto md:ml-0 bg-[#000000] text-white rounded-lg text-base px-5 py-3 md:text-sm md:px-4 md:h-10 flex items-center gap-2 md:justify-center border border-[#000000] shadow-sm hover:bg-[#111111] focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
