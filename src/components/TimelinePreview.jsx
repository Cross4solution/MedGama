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

  useEffect(() => {
    medStreamAPI.posts({ per_page: limit || 8 }).then((res) => {
      const list = res?.data || [];
      if (list.length) {
        setApiPosts(list.map((p) => ({
          id: p.id,
          type: 'doctor_update',
          title: p.author?.fullname || 'Doctor',
          subtitle: '',
          city: '',
          img: p.media_url || '/images/petr-magera-huwm7malj18-unsplash_720.jpg',
          text: p.content || '',
          likes: p.engagementCounter?.like_count || 0,
          comments: p.engagementCounter?.comment_count || 0,
          actor: {
            id: p.author_id,
            role: p.author?.role_id || 'doctor',
            name: p.author?.fullname || 'Doctor',
            title: '',
            avatarUrl: p.author?.avatar || '/images/portrait-candid-male-doctor_720.jpg',
          },
          timeAgo: p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
          visibility: 'public',
          media: (() => {
            if (Array.isArray(p.media) && p.media.length > 0) {
              return p.media.map(m => ({ url: m.medium || m.original || m.url, thumb: m.thumb, name: m.name, type: m.type || p.post_type || 'image' }));
            }
            if (!p.media_url) return [{ url: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' }];
            const mType = (p.post_type === 'video') ? 'video' : (p.post_type === 'document') ? 'document' : 'image';
            return [{ url: p.media_url, type: mType }];
          })(),
        })));
      }
    }).catch(() => {});
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
          </div>
        </div>
      </div>
    </section>
  );
}
