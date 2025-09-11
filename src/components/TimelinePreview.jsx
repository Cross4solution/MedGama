import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toEnglishTimestamp } from '../utils/i18n';
import { Star, MessageCircle, Heart, Clock, Image as ImageIcon, Folder, Share2 } from 'lucide-react';
import { posts as sharedPosts, professionalReview as sharedPro } from './timelineData';
import Badge from './Badge';
import TimelineCard from 'components/timeline/TimelineCard';

// TimelinePreview: Şık hover efektli timeline kartları önizlemesi
// Kullanım: <TimelinePreview items={demoItems} columns={3} />
// props:
// - items: [{ id, title, subtitle, image }] şeklinde liste. Boşsa placeholder üretilir.
// - columns: grid kolon sayısı (md breakpoint)
export default function TimelinePreview({ items = [], columns = 3, limit = 6, onViewAll }) {
  const navigate = useNavigate();
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

  

  return (
    <section id="timeline" className="py-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Updates Preview</h2>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="text-sm text-teal-700 hover:text-teal-800 hover:underline"
            >
              View all updates items
            </button>
          ) : (
            <Link to="/explore" className="text-sm text-teal-700 hover:text-teal-800 hover:underline">View all updates items</Link>
          )}
        </div>
        <div className="bg-white p-0 rounded-none border-0 shadow-none">
          {/* Scrollable feed area */}
          <div className="h-[80vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Feed cards using TimelineCard (Explore style) */}
              {data.slice(0, 8).map((p, idx) => {
                // Map preview item to TimelineCard expected shape
                const nameParts = String(p.title || '').split(' • ');
                const actorName = nameParts[0] || 'Update';
                const specialty = nameParts[1] || undefined;
                const item = {
                  id: p.id || `prev-${idx}`,
                  text: p.subtitle,
                  media: p.image ? [{ url: p.image }] : [],
                  likes: p.engagement?.likes ?? 0,
                  comments: p.engagement?.comments ?? 0,
                  city: '',
                  specialty,
                  actor: {
                    id: `prev-${idx}`,
                    role: p.type === 'patient_review' ? 'patient' : (p.type === 'clinic_update' ? 'clinic' : 'doctor'),
                    name: actorName,
                    title: specialty || (p.type === 'patient_review' ? 'Shared experience' : 'Update'),
                    avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
                  },
                };
                return (
                  <TimelineCard key={item.id} item={item} disabledActions={false} view={'list'} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
