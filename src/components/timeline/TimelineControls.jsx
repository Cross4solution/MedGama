import React from 'react';

export default function TimelineControls({
  user,
  sort,
  onSortChange,
  // tab,
  // onTabChange,
  onUseLocation,
  geo,
  showSort = false,
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Explore Timeline</h1>
          <p className="text-sm text-gray-600">{user ? 'Takip ettiklerin öncelikli, lokasyon önerileri karışık.' : 'Login olmadan rastgele içerikleri keşfet.'}</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={onUseLocation} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Use my location</button>
          <button
            type="button"
            aria-pressed={sort === 'recent'}
            onClick={() => onSortChange?.('recent')}
            className={`text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 ${sort === 'recent' ? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700' : 'border-gray-300 text-gray-700'}`}
          >
            Most Recent
          </button>
          <button
            type="button"
            aria-pressed={sort === 'top'}
            onClick={() => onSortChange?.('top')}
            className={`text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 ${sort === 'top' ? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700' : 'border-gray-300 text-gray-700'}`}
          >
            Top Posts
          </button>
          {geo?.lat && <span className="text-xs text-gray-500">{geo.lat.toFixed(2)},{geo.lon.toFixed(2)}</span>}
        </div>
      </div>
      {/* Mobile controls */}
      <div className="mt-3 flex items-center gap-2 md:hidden">
        <button onClick={onUseLocation} className="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Use my location</button>
        <button
          type="button"
          aria-pressed={sort === 'recent'}
          onClick={() => onSortChange?.('recent')}
          className={`text-sm px-3 py-2 rounded-lg border ${sort === 'recent' ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Most Recent
        </button>
        <button
          type="button"
          aria-pressed={sort === 'top'}
          onClick={() => onSortChange?.('top')}
          className={`text-sm px-3 py-2 rounded-lg border ${sort === 'top' ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Top Posts
        </button>
        {geo?.lat && <span className="text-xs text-gray-500">{geo.lat.toFixed(2)},{geo.lon.toFixed(2)}</span>}
      </div>
      {/* Tabs kaldırıldı */}
    </div>
  );
}
