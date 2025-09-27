import React from 'react';
import FilterGroup from 'components/filters/FilterGroup';

export default function FiltersSidebar({ groups = [], onApply }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Filters</h3>

      <div className="space-y-4">
        {/* Rating ve Features yan yana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
