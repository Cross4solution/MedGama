import React from 'react';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TimelineControls({
  user,
  sort,
  onSortChange,
  // tab,
  // onTabChange,
  onUseLocation,
  geo,
  showSort = false,
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-gray-700 tracking-tight">
            {t('medstream.exploreTimeline', 'Explore Timeline')}
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5 hidden md:block">{t('medstream.discoverLatest', 'Discover the latest from your medical network')}</p>
        </div>

        {/* Center: Segmented toggle (desktop) */}
        <div className="hidden md:flex items-center justify-center">
          <div className="inline-flex rounded-full bg-gray-100/70 p-0.5 gap-0.5">
            <button
              type="button"
              aria-pressed={sort === 'recent'}
              onClick={() => onSortChange?.('recent')}
              className={`text-[13px] px-4 py-1.5 rounded-full focus:outline-none transition-colors duration-200 inline-flex items-center justify-center gap-1.5 font-medium ${
                sort === 'recent'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {t('medstream.mostRecent', 'Most Recent')}
            </button>
            <button
              type="button"
              aria-pressed={sort === 'top'}
              onClick={() => onSortChange?.('top')}
              className={`text-[13px] px-4 py-1.5 rounded-full focus:outline-none transition-colors duration-200 inline-flex items-center justify-center gap-1.5 font-medium ${
                sort === 'top'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {t('medstream.topPosts', 'Top Posts')}
            </button>
          </div>
        </div>

        {/* Right: Location (desktop) — minimalist */}
        <div className="hidden md:flex flex-1 justify-end items-center gap-3">
          <button
            onClick={onUseLocation}
            className="text-[13px] px-3 py-1.5 rounded-full border border-gray-200/70 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-200 inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium"
          >
            <MapPin className="w-3.5 h-3.5 text-teal-500" />
            {t('medstream.useMyLocation', 'Use my location')}
          </button>
          {geo?.lat && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{geo.lat.toFixed(2)}, {geo.lon.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Mobile controls */}
      <div className="mt-4 md:hidden flex items-center gap-3">
        {/* Centered toggle */}
        <div className="flex-1 flex justify-center">
          <div className="inline-flex rounded-xl bg-white border border-gray-200 p-1 gap-1 shadow-sm">
            <button
              type="button"
              aria-pressed={sort === 'recent'}
              onClick={() => onSortChange?.('recent')}
              className={`text-sm px-4 py-2 rounded-lg focus:outline-none transition-all duration-200 inline-flex items-center gap-1.5 font-semibold ${
                sort === 'recent'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {t('medstream.recentShort', 'Recent')}
            </button>
            <button
              type="button"
              aria-pressed={sort === 'top'}
              onClick={() => onSortChange?.('top')}
              className={`text-sm px-4 py-2 rounded-lg focus:outline-none transition-all duration-200 inline-flex items-center gap-1.5 font-semibold ${
                sort === 'top'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {t('medstream.topShort', 'Top')}
            </button>
          </div>
        </div>
        {/* Location button right aligned */}
        <button
          onClick={onUseLocation}
          className="text-sm px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 inline-flex items-center gap-1.5 text-gray-600 font-medium"
        >
          <MapPin className="w-4 h-4 text-teal-500" />
          <span className="hidden sm:inline">{t('medstream.locationShort', 'Location')}</span>
        </button>
      </div>
      {/* Tabs kaldırıldı */}
    </div>
  );
}

export default React.memo(TimelineControls);
