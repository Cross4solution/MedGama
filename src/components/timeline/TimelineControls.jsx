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
      <div className="flex items-center">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Explore Timeline</h1>
        </div>

        {/* Center: Segmented toggle (desktop) */}
        <div className="hidden md:flex flex-1 justify-end ml-64">
          <div className="inline-flex rounded-full border border-gray-300 bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              aria-pressed={sort === 'recent'}
              onClick={() => onSortChange?.('recent')}
              className={`text-sm w-32 py-1.5 focus:outline-none transition-colors ${
                sort === 'recent'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Most Recent
            </button>
            <button
              type="button"
              aria-pressed={sort === 'top'}
              onClick={() => onSortChange?.('top')}
              className={`text-sm w-32 py-1.5 focus:outline-none transition-colors ${
                sort === 'top'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Top Posts
            </button>
          </div>
        </div>

        {/* Right: Location (desktop) */}
        <div className="hidden md:flex flex-1 justify-end items-center gap-3">
          <button onClick={onUseLocation} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Use my location</button>
          {geo?.lat && (
            <span className="text-xs text-gray-500">{geo.lat.toFixed(2)},{geo.lon.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Mobile controls */}
      <div className="mt-3 md:hidden flex items-center">
        {/* Centered toggle */}
        <div className="flex-1 flex justify-center">
          <div className="inline-flex rounded-full border border-gray-300 bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              aria-pressed={sort === 'recent'}
              onClick={() => onSortChange?.('recent')}
              className={`text-sm px-4 py-2 focus:outline-none transition-colors ${
                sort === 'recent'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Most Recent
            </button>
            <button
              type="button"
              aria-pressed={sort === 'top'}
              onClick={() => onSortChange?.('top')}
              className={`text-sm px-4 py-2 focus:outline-none transition-colors ${
                sort === 'top'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Top Posts
            </button>
          </div>
        </div>
        {/* Location button right aligned */}
        <div className="flex-1 flex justify-end items-center gap-2 ml-3">
          <button onClick={onUseLocation} className="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Use my location</button>
          {geo?.lat && (
            <span className="text-xs text-gray-500">{geo.lat.toFixed(2)},{geo.lon.toFixed(2)}</span>
          )}
        </div>
      </div>
      {/* Tabs kaldırıldı */}
    </div>
  );
}
