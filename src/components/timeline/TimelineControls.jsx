import React from 'react';
import { MapPin, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TimelineControls({
  user,
  sort,
  onSortChange,
  // tab,
  // onTabChange,
  onUseLocation,
  geo,
  geoLoading = false,
  showSort = false,
}) {
  const { t } = useTranslation();
  // Konum butonu durum metni: yükleniyor / tespit edilen yer / hata.
  const geoLabel = geoLoading
    ? t('medstream.locating', 'Locating…')
    : geo?.error
      ? t('medstream.locationDenied', 'Location unavailable')
      : (geo?.country
          ? [geo.city, geo.country].filter(Boolean).join(', ')
          : t('medstream.useMyLocation', 'Use my location'));
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
            disabled={geoLoading}
            className={`text-[13px] px-3 py-1.5 rounded-full border transition-colors duration-200 inline-flex items-center gap-1.5 font-medium ${
              geo?.error
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : geo?.country
                  ? 'border-teal-300 text-teal-700 bg-teal-50/60 hover:bg-teal-50'
                  : 'border-gray-200/70 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'
            } ${geoLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {geoLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
              : <MapPin className={`w-3.5 h-3.5 ${geo?.error ? 'text-red-400' : 'text-teal-500'}`} />}
            <span className="max-w-[180px] truncate">{geoLabel}</span>
          </button>
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
          disabled={geoLoading}
          className={`text-sm px-3 py-2 rounded-xl border transition-all duration-200 inline-flex items-center gap-1.5 font-medium ${
            geo?.error ? 'border-red-200 text-red-500' : geo?.country ? 'border-teal-300 text-teal-700 bg-teal-50/60' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          } ${geoLoading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {geoLoading
            ? <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
            : <MapPin className={`w-4 h-4 ${geo?.error ? 'text-red-400' : 'text-teal-500'}`} />}
          <span className="hidden sm:inline max-w-[140px] truncate">{geo?.country ? [geo.city, geo.country].filter(Boolean).join(', ') : t('medstream.locationShort', 'Location')}</span>
        </button>
      </div>
      {/* Tabs kaldırıldı */}
    </div>
  );
}

export default React.memo(TimelineControls);
