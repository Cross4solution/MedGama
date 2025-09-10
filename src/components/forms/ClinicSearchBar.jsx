import React from 'react';
import { SelectCombobox, CountryCombobox, CityCombobox } from 'components/forms';
import { Search } from 'lucide-react';

export default function ClinicSearchBar({
  country,
  city,
  specialty,
  priceRange,
  countryOptions = [],
  cityOptions = [],
  specialtyOptions = [],
  priceOptions = [],
  onCountryChange,
  onCityChange,
  onSpecialtyChange,
  onPriceRangeChange,
  onSubmit,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3">
        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <CountryCombobox
            options={countryOptions}
            value={country}
            onChange={(val) => { onCountryChange?.(val); onCityChange?.(''); }}
            placeholder="All Countries"
          />
        </div>
        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <CityCombobox
            options={cityOptions}
            value={city}
            onChange={onCityChange}
            disabled={!country}
            placeholder="All Cities"
          />
        </div>
        {/* Specialty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
          <SelectCombobox
            options={specialtyOptions}
            value={specialty}
            onChange={onSpecialtyChange}
            placeholder="All Specialties"
            hideChevron
            triggerClassName={`w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm bg-white text-left`}
          />
        </div>
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <SelectCombobox
            options={priceOptions}
            value={priceRange}
            onChange={onPriceRangeChange}
            placeholder="All Prices"
            hideChevron
            searchable={false}
            triggerClassName={`w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm bg-white text-left`}
          />
        </div>
        {/* Submit */}
        <div className="flex items-end justify-end md:justify-start">
          <button onClick={onSubmit} className="bg-blue-600 text-white py-2 px-4 text-sm rounded-xl hover:bg-blue-700 transition-all duration-200 inline-flex items-center gap-2 shadow-sm hover:shadow-md min-w-[120px]">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
