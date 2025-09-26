import React from 'react';
import { CountryCombobox, SelectCombobox } from 'components/forms';
import { getFlagCode } from '../../utils/geo';
import { Search } from 'lucide-react';

export default function TimelineFilterSidebar({
  query,
  onQueryChange,
  countryName,
  onCountryChange,
  specialty,
  onSpecialtyChange,
  countryOptions = [],
  specialtyOptions = [],
  user,
}) {
  return (
    <aside className="order-1 lg:order-1 space-y-4 lg:sticky lg:top-24 h-max">
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
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
                value={countryName}
                onChange={onCountryChange}
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
                value={specialty}
                onChange={onSpecialtyChange}
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
            value={countryName}
            onChange={onCountryChange}
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
            value={specialty}
            onChange={onSpecialtyChange}
            placeholder="All"
            hideChevron
            triggerClassName={`w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-left`}
          />
        </div>
      </div>
    </aside>
  );
}
