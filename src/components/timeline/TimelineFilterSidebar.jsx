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

  const hasActiveFilters = !!(localQuery || localCountryName || localSpecialty);

  return (
    <aside className="order-1 lg:order-1 lg:sticky lg:top-24 h-max">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-teal-50/80 to-emerald-50/40">
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">
            Filters
          </h3>
        </div>

        <div className="p-5 space-y-5">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Search</label>
            <div className="relative group">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="search"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search in timeline..."
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 hover:bg-white hover:border-gray-300 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Mobile: Country and Specialization side by side */}
          <div className="block md:hidden">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Country</label>
                <CountryCombobox
                  options={countryOptions}
                  value={localCountryName}
                  onChange={setLocalCountryName}
                  placeholder="All"
                  triggerClassName="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 transition-all"
                  getFlagUrl={(name) => {
                    try {
                      const code = getFlagCode(name);
                      return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                    } catch { return null; }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Specialization</label>
                <SelectCombobox
                  options={specialtyOptions}
                  value={localSpecialty}
                  onChange={setLocalSpecialty}
                  placeholder="All"
                  hideChevron
                  triggerClassName="w-full h-10 pl-3 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Desktop: Separate sections */}
          <div className="hidden md:block space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Country</label>
              <CountryCombobox
                options={countryOptions}
                value={localCountryName}
                onChange={setLocalCountryName}
                placeholder="All countries"
                triggerClassName="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                getFlagUrl={(name) => {
                  try {
                    const code = getFlagCode(name);
                    return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                  } catch { return null; }
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Specialization</label>
              <SelectCombobox
                options={specialtyOptions}
                value={localSpecialty}
                onChange={setLocalSpecialty}
                placeholder="All"
                hideChevron
                triggerClassName="w-full h-10 pl-3 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="px-5 pb-5">
          <button
            onClick={handleApplyFilters}
            className={`w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md ${
              hasActiveFilters
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-teal-200'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 focus:ring-4 focus:ring-teal-200'
            }`}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
