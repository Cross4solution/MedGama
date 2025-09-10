import React from 'react';

export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex justify-center mt-8">
      <div className="flex items-center space-x-2">
        <button
          disabled={!canPrev}
          onClick={() => canPrev && onChange?.(page - 1)}
          className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange?.(p)}
            className={`${p === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'} px-3 py-2 rounded-xl shadow-sm`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={!canNext}
          onClick={() => canNext && onChange?.(page + 1)}
          className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
