import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toEnglishTimestamp } from '../utils/i18n';
import { Star, MessageCircle, Heart, Clock, Image as ImageIcon, Folder, Share2 } from 'lucide-react';
import { generateExploreStyleItems } from 'components/timeline/feedMock';
import Badge from './Badge';
import TimelineCard from 'components/timeline/TimelineCard';
import { medStreamAPI } from '../lib/api';

// TimelinePreview: Şık hover efektli timeline kartları önizlemesi
// Kullanım: <TimelinePreview items={demoItems} columns={3} />
// props:
// - items: [{ id, title, subtitle, image }] şeklinde liste. Boşsa placeholder üretilir.
// - columns: grid kolon sayısı (md breakpoint)
export default function TimelinePreview({ items = [], columns = 3, limit = 6, onViewAll }) {
  const navigate = useNavigate();
  const [apiPosts, setApiPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    medStreamAPI.posts({ per_page: limit || 8 }).then((res) => {
      const list = res?.data || [];
      if (list.length) {
        setApiPosts(list.map((p) => {
          const ec = p.engagement_counter || p.engagementCounter || {};
          return {
            id: p.id,
            author_id: p.author_id,
            type: 'doctor_update',
            title: p.author?.fullname || 'Doctor',
            subtitle: '',
            city: '',
            img: p.media_url || '',
            text: p.content || '',
            likes: ec.like_count || 0,
            comments: ec.comment_count || 0,
            actor: {
              id: p.author_id,
              role: p.author?.role_id || 'doctor',
              name: p.author?.fullname || 'Doctor',
              title: '',
              avatarUrl: p.author?.avatar || '/images/default/default-avatar.svg',
            },
            created_at: p.created_at || null,
            timeAgo: p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
            visibility: 'public',
            is_liked: !!p.is_liked,
            is_bookmarked: !!p.is_bookmarked,
            media: (() => {
              if (Array.isArray(p.media) && p.media.length > 0) {
                return p.media.map(m => ({ url: m.medium || m.original || m.url, thumb: m.thumb, name: m.name, type: m.type || p.post_type || 'image' }));
              }
              if (!p.media_url) return [];
              const mType = (p.post_type === 'video') ? 'video' : (p.post_type === 'document') ? 'document' : 'image';
              return [{ url: p.media_url, type: mType }];
            })(),
          };
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [limit]);

  // Explore-style ortak veri: doğrudan TimelineCard ile uyumlu
  const defaults = useMemo(() => generateExploreStyleItems(limit ?? 6), [limit]);
  const data = apiPosts.length ? apiPosts : (items.length ? items : defaults);
  const scrollRef = useRef(null);

  // Restore scroll to last clicked post if exists, else keep position
  useEffect(() => {
    const key = 'timelinePreviewScroll';
    const lastKey = 'lastPostId';
    const el = scrollRef.current;
    if (!el) return;
    const lastId = sessionStorage.getItem(lastKey);
    const tryScrollToPost = () => {
      if (!lastId) return false;
      const node = el.querySelector(`#post-${CSS.escape(lastId)}`);
      if (node) {
        const top = node.offsetTop - el.clientHeight / 3;
        el.scrollTop = top > 0 ? top : 0;
        sessionStorage.removeItem(lastKey);
        return true;
      }
      return false;
    };
    let done = tryScrollToPost();
    if (!done) {
      requestAnimationFrame(() => {
        done = tryScrollToPost();
        if (!done) setTimeout(() => { tryScrollToPost(); }, 120);
      });
    }
    const saved = Number(sessionStorage.getItem(key) || 0);
    if (!done && !isNaN(saved) && saved > 0) {
      requestAnimationFrame(() => { el.scrollTop = saved; });
    }
    const onScroll = () => sessionStorage.setItem(key, String(el.scrollTop));
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      sessionStorage.setItem(key, String(el.scrollTop || 0));
    };
  }, []);

  return (
    <section id="timeline" className="pt-0 pb-2">
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
        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 overflow-hidden">
          {/* Scrollable feed area */}
          <div ref={scrollRef} className="h-[72vh] overflow-y-auto px-2.5 pt-3 pb-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="max-w-xl mx-auto animate-pulse">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 bg-gray-200 rounded w-32" />
                          <div className="h-2.5 bg-gray-100 rounded w-20" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-48 bg-gray-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="space-y-3">
              {data.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  id={`post-${item.id}`}
                  className="max-w-xl mx-auto"
                  onClick={() => { try { sessionStorage.setItem('lastPostId', String(item.id)); } catch {} }}
                >
                  <TimelineCard item={item} disabledActions={false} view={'list'} compact={true} />
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
