import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toEnglishTimestamp } from '../utils/i18n';
import { Star, MessageCircle, Heart, Clock, User } from 'lucide-react';
import { posts as sharedPosts, professionalReview as sharedPro } from './timelineData';
import Badge from './Badge';

// TimelinePreview: Şık hover efektli timeline kartları önizlemesi
// Kullanım: <TimelinePreview items={demoItems} columns={3} />
// props:
// - items: [{ id, title, subtitle, image }] şeklinde liste. Boşsa placeholder üretilir.
// - columns: grid kolon sayısı (md breakpoint)
export default function TimelinePreview({ items = [], columns = 3, limit = 6, onViewAll }) {
  // Shared posts -> preview item format
  const mappedFromPosts = sharedPosts.slice(0, limit ?? 6).map((p, i) => {
    if (p.type === 'clinic_update') {
      return {
        id: `post-${p.id}`,
        type: 'clinic_update',
        tag: 'Clinic Update',
        title: `${p.clinic?.name || 'Klinik'}${p.clinic?.specialty ? ' • ' + p.clinic.specialty : ''}`,
        subtitle: p.content,
        image: p.image || null,
        timestamp: p.timestamp,
        engagement: p.engagement,
        badge: p.clinic?.specialty,
      };
    }
    if (p.type === 'patient_review') {
      return {
        id: `post-${p.id}`,
        type: 'patient_review',
        tag: 'Patient Review',
        title: `${p.patient?.name || 'Hasta'} • ${(p.rating || 0).toFixed(1)}`,
        subtitle: p.content,
        image: null,
        timestamp: p.timestamp,
        rating: p.rating,
        engagement: p.engagement,
      };
    }
    return {
      id: `post-${p.id}`,
      type: p.type || 'update',
      tag: 'Update',
      title: p.clinic?.name || 'Güncelleme',
      subtitle: p.content,
      image: p.image || null,
      timestamp: p.timestamp,
      engagement: p.engagement,
    };
  });

  // Shared professional review -> preview item
  const mappedPro = sharedPro
    ? [
        {
          id: sharedPro.id,
          type: 'pro_review',
          tag: 'PRO Review',
          title: `${sharedPro.clinic} • PRO Review`,
          subtitle: sharedPro.content,
          image: sharedPro.images?.[0] || 'https://placehold.co/600x300',
          timestamp: sharedPro.timestamp,
          scores: sharedPro.scores,
          engagement: sharedPro.engagement,
        },
      ]
    : [];

  const defaults = [...mappedFromPosts, ...mappedPro].slice(0, limit ?? 6);
  const data = items.length ? items : defaults;

  

  const colClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns] || 'md:grid-cols-3';

  return (
    <section className="py-8 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Timeline Preview</h2>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="text-sm text-teal-700 hover:text-teal-800 hover:underline"
            >
              View all timeline items
            </button>
          ) : (
            <Link to="/explore" className="text-sm text-teal-700 hover:text-teal-800 hover:underline">View all timeline items</Link>
          )}
        </div>

        <div className={`grid ${colClass} gap-5`} role="list">
          {data.map((item, idx) => (
            <article
              key={item.id ?? idx}
              role="listitem"
              tabIndex={0}
              aria-label={`${item.title || 'Timeline card'}: ${item.subtitle || ''}`}
              className="group relative rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl focus:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 transition-transform duration-300 overflow-hidden hover:-translate-y-0.5 hover:scale-[1.02]"
            >
              {/* Üst görsel / placeholder */}
              <div className="relative h-36 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#e6fffb,transparent_40%),radial-gradient(circle_at_80%_0%,#e0f2fe,transparent_35%)]" />
                    {/* Shimmer */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                )}
                {/* Üst gradient overlay (hover'da biraz koyulaşır) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 group-hover:from-black/10 transition-colors duration-300" />

                {/* Köşe etiketi */}
                <div className="absolute top-3 left-3">
                  <Badge
                    label={item.tag || 'Update'}
                    variant="teal"
                    size="sm"
                    className=""
                    icon={<span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                  />
                </div>

                {/* Sağ üst rozet (varsa) */}
                {item.badge && (
                  <div className="absolute top-3 right-3">
                    <Badge label={item.badge} variant="blue" size="sm" />
                  </div>
                )}
              </div>

              {/* İçerik */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 tracking-tight group-hover:text-gray-950">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 opacity-80 translate-y-0.5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  {item.subtitle}
                </p>

                {/* Meta chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
                  {/* Rating (hasta yorumu) */}
                  {item.type === 'patient_review' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < (item.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </span>
                  )}
                  {/* Scores (pro review) */}
                  {item.type === 'pro_review' && (
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      <span>Technology {item.scores?.technology}</span>
                      <span>•</span>
                      <span>Cleanliness {item.scores?.cleanliness}</span>
                    </span>
                  )}
                </div>

                {/* Alt kısım */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-200 to-sky-200 flex items-center justify-center">
                      {item.type === 'pro_review' ? (
                        <User className="w-4 h-4 text-teal-700" />
                      ) : (
                        <Clock className="w-4 h-4 text-teal-700" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{toEnglishTimestamp(item.timestamp) || 'Just now'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1 text-gray-500">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{item.engagement?.likes ?? 0}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-gray-500">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs">{item.engagement?.comments ?? 0}</span>
                    </div>
                    {onViewAll ? (
                      <button
                        type="button"
                        onClick={onViewAll}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:text-teal-800 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                        aria-label="Timeline details"
                      >
                        Details
                      </button>
                    ) : (
                      <Link
                        to="/explore"
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:text-teal-800 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                        aria-label="Timeline details"
                      >
                        Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Accent halo */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-teal-200/70" />
              <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-100/0 via-sky-100/0 to-purple-100/0 opacity-0 group-hover:opacity-100 blur-xl transition duration-700" />
            </article>
          ))}
        </div>

        {/* Placeholder skeleton row (when items are empty and no image provided) */}
        {!items.length && (
          <div className="mt-6 text-xs text-gray-500">Sample preview. It will update automatically when real steps are added.</div>
        )}
      </div>
    </section>
  );
}
