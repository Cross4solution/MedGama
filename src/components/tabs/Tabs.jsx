import React from 'react';

export default function Tabs({ tabs = [], active, onChange }) {
  return (
    <div>
      <nav className="flex overflow-x-auto gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-xl border transition-colors ${
              active === tab.id
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
