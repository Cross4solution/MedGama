import React, { useState, useEffect } from 'react';
import { CountryCombobox, SelectCombobox } from 'components/forms';
import { getFlagCode } from '../../utils/geo';
import { Search } from 'lucide-react';

export default function TimelineFilterSidebar({
  query: initialQuery,
  onQueryChange,
  countryName: initialCountryName,
  onCountryChange,
  specialty: initialSpecialty,
  onSpecialtyChange,
  countryOptions = [],
  specialtyOptions = [],
  user,
}) {
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [localCountryName, setLocalCountryName] = useState(initialCountryName);
  const [localSpecialty, setLocalSpecialty] = useState(initialSpecialty);

  // Update local states when props change
  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);
  
  useEffect(() => {
    setLocalCountryName(initialCountryName);
  }, [initialCountryName]);
  
  useEffect(() => {
    setLocalSpecialty(initialSpecialty);
  }, [initialSpecialty]);

  const handleApplyFilters = () => {
    if (onQueryChange) onQueryChange(localQuery);
    if (onCountryChange) onCountryChange(localCountryName);
    if (onSpecialtyChange) onSpecialtyChange(localSpecialty);
  };

  return (
    <aside className="order-1 lg:order-1 space-y-4 lg:sticky lg:top-24 h-max lg:-ml-2">
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyFilters();
              }
            }}
            placeholder="Search in timeline..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Mobile: Country and Specialization side by side */}
      <div className="block md:hidden">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Country</h3>
              <CountryCombobox
                options={countryOptions}
                value={localCountryName}
                onChange={setLocalCountryName}
                placeholder="All countries"
                getFlagUrl={(name) => {
                  try {
                    const code = getFlagCode(name);
                    return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                  } catch { return null; }
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Specialization</h3>
              <SelectCombobox
                options={specialtyOptions}
                value={localSpecialty}
                onChange={setLocalSpecialty}
                placeholder="All"
                hideChevron
                triggerClassName={`w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-left`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Separate sections */}
      <div className="hidden md:block space-y-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Country</h3>
          <CountryCombobox
            options={countryOptions}
            value={localCountryName}
            onChange={setLocalCountryName}
            placeholder="All countries"
            getFlagUrl={(name) => {
              try {
                const code = getFlagCode(name);
                return code ? `https://flagcdn.com/24x18/${code}.png` : null;
              } catch { return null; }
            }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Specialization</h3>
          <SelectCombobox
            options={specialtyOptions}
            value={localSpecialty}
            onChange={setLocalSpecialty}
            placeholder="All"
            hideChevron
            triggerClassName={`w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-left`}
          />
        </div>
      </div>
      
      {/* Apply Filters Button */}
      <button
        onClick={handleApplyFilters}
        className="w-full py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors mt-2"
      >
        Apply Filters
      </button>
    </aside>
  );
}
