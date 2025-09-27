import React from 'react';

export default function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="p-4 pb-6">
      <nav className="flex overflow-x-auto gap-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === tab.id
                ? 'text-[#1C6A83] border-[#1C6A83]'
                : 'text-gray-700 border-transparent hover:text-[#1C6A83] hover:border-[#1C6A83]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
