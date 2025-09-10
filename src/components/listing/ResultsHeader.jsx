import React from 'react';

export default function ResultsHeader({ count, sortBy, onSortChange, sortOptions = [] }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">{count} Clinics Found</h2>
      <div className="flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => onSortChange?.(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <img
          src="/images/icon/sort-svgrepo-com.svg"
          alt="Sort"
          className="w-5 h-5 opacity-80"
        />
      </div>
    </div>
  );
}
