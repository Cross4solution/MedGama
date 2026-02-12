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
    <aside className="order-1 lg:order-1 lg:sticky lg:top-24 h-max">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-600" />
            Filters
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search in timeline..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              />
            </div>
          </div>

          {/* Mobile: Country and Specialization side by side */}
          <div className="block md:hidden">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Country</label>
                <CountryCombobox
                  options={countryOptions}
                  value={localCountryName}
                  onChange={setLocalCountryName}
                  placeholder="All"
                  triggerClassName="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white text-left hover:border-gray-300 transition-all"
                  getFlagUrl={(name) => {
                    try {
                      const code = getFlagCode(name);
                      return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                    } catch { return null; }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Specialization</label>
                <SelectCombobox
                  options={specialtyOptions}
                  value={localSpecialty}
                  onChange={setLocalSpecialty}
                  placeholder="All"
                  hideChevron
                  triggerClassName="w-full h-9 pl-3 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-left hover:border-gray-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Desktop: Separate sections */}
          <div className="hidden md:block space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Country</label>
              <CountryCombobox
                options={countryOptions}
                value={localCountryName}
                onChange={setLocalCountryName}
                placeholder="All countries"
                triggerClassName="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white text-left hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                getFlagUrl={(name) => {
                  try {
                    const code = getFlagCode(name);
                    return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                  } catch { return null; }
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Specialization</label>
              <SelectCombobox
                options={specialtyOptions}
                value={localSpecialty}
                onChange={setLocalSpecialty}
                placeholder="All"
                hideChevron
                triggerClassName="w-full h-9 pl-3 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-left hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleApplyFilters}
            className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
