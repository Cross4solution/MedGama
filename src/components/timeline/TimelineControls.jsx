import React from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';

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
          {showSort && (
            <div className="relative">
              <ArrowDownWideNarrow className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select value={sort} onChange={(e)=>onSortChange?.(e.target.value)} className="pl-9 pr-3 py-2 text-sm border rounded-lg bg-white">
                <option value="top">Top</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          )}
          <button onClick={onUseLocation} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Use my location</button>
          {geo?.lat && <span className="text-xs text-gray-500">{geo.lat.toFixed(2)},{geo.lon.toFixed(2)}</span>}
        </div>
      </div>
      {/* Tabs kaldırıldı */}
    </div>
  );
}
