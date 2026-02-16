import React from 'react';
import FilterGroup from 'components/filters/FilterGroup';
import { useTranslation } from 'react-i18next';

export default function FiltersSidebar({ groups = [], onApply }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('common.filter')}</h3>

      <div className="space-y-4">
        {/* Rating ve Features yan yana (mobilde de 2 kolon) */}
        <div className="grid grid-cols-2 gap-4">
          {groups.slice(0, 2).map((g) => (
            <FilterGroup
              key={g.title}
              title={g.title}
              options={g.options}
              selected={g.selected}
              onToggle={(opt) => g.onToggle?.(opt)}
            />
          ))}
        </div>
        
        {/* Insurance tek başına */}
        {groups.slice(2).map((g) => (
          <FilterGroup
            key={g.title}
            title={g.title}
            options={g.options}
            selected={g.selected}
            onToggle={(opt) => g.onToggle?.(opt)}
          />
        ))}

        <div className="pt-2 flex justify-end">
          <button onClick={onApply} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base px-5 py-2">
            {t('common.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
