import React, { useState, useEffect } from 'react';
import { CountryCombobox, SelectCombobox } from 'components/forms';
import { getFlagCode } from '../../utils/geo';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TimelineFilterSidebar({
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
  const { t } = useTranslation();
  // Use local state for search (debounced), but apply country/specialty instantly
  const [localQuery, setLocalQuery] = useState(initialQuery);

  // Update local query when prop changes
  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);

  // Debounce search query — apply after 400ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onQueryChange && localQuery !== initialQuery) {
        onQueryChange(localQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localQuery]);

  const handleCountryChange = (val) => {
    if (onCountryChange) onCountryChange(val);
  };

  const handleSpecialtyChange = (val) => {
    if (onSpecialtyChange) onSpecialtyChange(val);
  };

  const handleClearAll = () => {
    setLocalQuery('');
    if (onQueryChange) onQueryChange('');
    if (onCountryChange) onCountryChange('');
    if (onSpecialtyChange) onSpecialtyChange('');
  };

  const hasActiveFilters = !!(localQuery || initialCountryName || initialSpecialty);

  return (
    <aside className="order-1 lg:order-1 lg:sticky lg:top-24 h-max">
      <div className="bg-white rounded-xl border border-gray-200/70 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3.5 pb-1">
          <h3 className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            {t('medstream.filters')}
          </h3>
        </div>

        <div className="px-4 pb-4 pt-2 space-y-3.5">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('medstream.search')}</label>
            <div className="relative group">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="search"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder={t('medstream.searchInTimeline')}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 hover:bg-white hover:border-gray-300 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Mobile: Country and Specialization side by side */}
          <div className="block md:hidden">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('medstream.country')}</label>
                <CountryCombobox
                  options={countryOptions}
                  value={initialCountryName}
                  onChange={handleCountryChange}
                  placeholder={t('medstream.all')}
                  triggerClassName="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 transition-all"
                  getFlagUrl={(name) => {
                    try {
                      const code = getFlagCode(name);
                      return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                    } catch { return null; }
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('medstream.specialization')}</label>
                <SelectCombobox
                  options={specialtyOptions}
                  value={initialSpecialty}
                  onChange={handleSpecialtyChange}
                  placeholder={t('medstream.all')}
                  hideChevron
                  triggerClassName="w-full h-9 pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Desktop: Separate sections */}
          <div className="hidden md:block space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('medstream.country')}</label>
              <CountryCombobox
                options={countryOptions}
                value={initialCountryName}
                onChange={handleCountryChange}
                placeholder={t('medstream.allCountries')}
                triggerClassName="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                getFlagUrl={(name) => {
                  try {
                    const code = getFlagCode(name);
                    return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                  } catch { return null; }
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">{t('medstream.specialization')}</label>
              <SelectCombobox
                options={specialtyOptions}
                value={initialSpecialty}
                onChange={handleSpecialtyChange}
                placeholder="All"
                hideChevron
                triggerClassName="w-full h-9 pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 text-left hover:bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <div className="px-4 pb-4">
            <button
              onClick={handleClearAll}
              className="w-full py-2 text-[13px] font-medium rounded-lg transition-all duration-200 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            >
              {t('medstream.clearAllFilters')}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default React.memo(TimelineFilterSidebar);
