import React from 'react';

export default function ResultsHeader({ count, sortBy, onSortChange, sortOptions = [] }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">{count} Clinics Found</h2>
      <div className="flex items-center">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <img
            src="/images/icon/sort-amount-down-svgrepo-com.svg"
            alt="Sort"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-80"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
