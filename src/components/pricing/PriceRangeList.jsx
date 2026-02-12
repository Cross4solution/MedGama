import React from 'react';

export default function PriceRangeList({ items = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
      </div>
      <div className="p-4 space-y-0">
        {items.map((item, index) => (
          <div key={index} className={`flex justify-between items-center py-2.5 ${index < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <span className="text-sm text-gray-600">{item.service}</span>
            <span className="text-sm font-semibold text-gray-900">{item.range}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400">
          *Prices may vary. For exact pricing, please book an appointment.
        </p>
      </div>
    </div>
  );
}
