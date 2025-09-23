import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toEnglishTimestamp } from '../utils/i18n';
import { Star, MessageCircle, Heart, Clock, Image as ImageIcon, Folder, Share2 } from 'lucide-react';
import { generateExploreStyleItems } from 'components/timeline/feedMock';
import Badge from './Badge';
import TimelineCard from 'components/timeline/TimelineCard';

// TimelinePreview: Şık hover efektli timeline kartları önizlemesi
// Kullanım: <TimelinePreview items={demoItems} columns={3} />
// props:
// - items: [{ id, title, subtitle, image }] şeklinde liste. Boşsa placeholder üretilir.
// - columns: grid kolon sayısı (md breakpoint)
export default function TimelinePreview({ items = [], columns = 3, limit = 6, onViewAll }) {
  const navigate = useNavigate();
  // Explore-style ortak veri: doğrudan TimelineCard ile uyumlu
  const defaults = useMemo(() => generateExploreStyleItems(limit ?? 6), [limit]);
  const data = items.length ? items : defaults;

  

  return (
    <section id="timeline" className="py-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Medstream</h2>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="text-sm text-teal-700 hover:text-teal-800 hover:underline"
            >
              View All Updates
            </button>
          ) : (
            <Link to="/explore" className="text-sm text-teal-700 hover:text-teal-800 hover:underline">View all updates items</Link>
          )}
        </div>
        <div className="bg-white p-0 rounded-xl border border-gray-200 shadow-sm">
          {/* Scrollable feed area */}
          <div className="h-[86vh] overflow-y-auto pr-2 pt-2" style={{ backgroundColor: '#f4f2ee' }}>
            <div className="space-y-6">
              {data.slice(0, 8).map((item) => (
                <div key={item.id} className="max-w-2xl mx-auto">
                  <TimelineCard item={item} disabledActions={false} view={'list'} compact={true} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
