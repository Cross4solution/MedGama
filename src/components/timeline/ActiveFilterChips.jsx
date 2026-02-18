import React from 'react';
import { X } from 'lucide-react';

function ActiveFilterChips({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {items.map((chip, idx) => (
        <span key={idx} className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[11px] font-medium shadow-sm">
          {chip.label}
          {chip.onClear && (
            <button onClick={chip.onClear} className="ml-0.5 p-0.5 rounded-full hover:bg-teal-100 text-teal-500 hover:text-teal-700 transition-colors" aria-label="clear">
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export default React.memo(ActiveFilterChips);
