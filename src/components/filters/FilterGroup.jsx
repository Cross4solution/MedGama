import React from 'react';

export default function FilterGroup({ title, options = [], selected = [], onToggle }) {
  return (
    <div>
      <h4 className="text-lg font-medium text-gray-800 mb-3">{title}</h4>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle?.(opt)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-base text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
