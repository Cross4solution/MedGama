import React, { useState } from 'react';

export default function Filters({ onApply }) {
  const [filters, setFilters] = useState({
    rating45: false,
    rating40: false,
    telehealth: false,
    healthTourism: false,
    professionalReview: false,
    sgk: false,
    privateInsurance: false
  });

  const handleFilterChange = (key) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleApply = () => {
    if (onApply) {
      onApply(filters);
    }
  };

  const FilterCheckbox = ({ id, label, checked, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-base text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Filters</h2>
      
      {/* Rating Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Rating</h3>
        <div className="space-y-3">
          <FilterCheckbox
            id="rating45"
            label="4.5+ Rating"
            checked={filters.rating45}
            onChange={() => handleFilterChange('rating45')}
          />
          <FilterCheckbox
            id="rating40"
            label="4.0+ Rating"
            checked={filters.rating40}
            onChange={() => handleFilterChange('rating40')}
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Features</h3>
        <div className="space-y-3">
          <FilterCheckbox
            id="telehealth"
            label="Telehealth"
            checked={filters.telehealth}
            onChange={() => handleFilterChange('telehealth')}
          />
          <FilterCheckbox
            id="healthTourism"
            label="Health Tourism"
            checked={filters.healthTourism}
            onChange={() => handleFilterChange('healthTourism')}
          />
          <FilterCheckbox
            id="professionalReview"
            label="Professional Review"
            checked={filters.professionalReview}
            onChange={() => handleFilterChange('professionalReview')}
          />
        </div>
      </div>

      {/* Insurance Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Insurance</h3>
        <div className="space-y-3">
          <FilterCheckbox
            id="sgk"
            label="SGK"
            checked={filters.sgk}
            onChange={() => handleFilterChange('sgk')}
          />
          <FilterCheckbox
            id="privateInsurance"
            label="Private Insurance"
            checked={filters.privateInsurance}
            onChange={() => handleFilterChange('privateInsurance')}
          />
        </div>
      </div>

      {/* Apply Button - Bottom Right */}
      <div className="flex justify-end">
        <button
          onClick={handleApply}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-base font-medium transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
