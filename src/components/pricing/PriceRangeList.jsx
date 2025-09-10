import React from 'react';

export default function PriceRangeList({ items = [] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{item.service}</span>
            <span className="font-semibold text-gray-900">{item.range}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        *Prices may vary. For exact pricing, please book an appointment.
      </p>
    </div>
  );
}
