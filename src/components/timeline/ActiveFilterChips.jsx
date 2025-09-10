import React from 'react';

export default function ActiveFilterChips({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
      {items.map((chip, idx) => (
        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border text-gray-700">
          {chip.label}
          {chip.onClear && (
            <button onClick={chip.onClear} className="ml-1 text-gray-500 hover:text-gray-700" aria-label="clear">✕</button>
          )}
        </span>
      ))}
    </div>
  );
}
