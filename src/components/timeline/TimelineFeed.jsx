import React, { useState, useEffect } from 'react';
import TimelineShareBox from './TimelineShareBox';
import TimelineCard from 'components/timeline/TimelineCard';
import { medStreamAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// This component renders ONLY the main timeline content (share box + posts + professional review)
// It is reused in both the full Timeline page and the PatientHome preview.
export default function TimelineFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    medStreamAPI.posts({ per_page: 20 }).then((res) => {
      const list = res?.data || [];
      setPosts(list.map((p) => {
        const ec = p.engagement_counter || p.engagementCounter || {};
        const authorRole = p.author?.role_id || 'doctor';
        return {
          id: p.id,
          author_id: p.author_id,
          type: authorRole === 'clinicOwner' ? 'clinic_update' : 'doctor_update',
          title: p.author?.fullname || 'Doctor',
          subtitle: p.clinic?.fullname || '',
          text: p.content || '',
          img: p.media_url || '',
          likes: ec.like_count || 0,
          comments: ec.comment_count || 0,
          specialty: '',
          actor: {
            id: p.author_id,
            role: authorRole,
            name: p.author?.fullname || 'Doctor',
            title: p.clinic?.fullname || '',
            avatarUrl: p.author?.avatar || '/images/default/default-avatar.svg',
          },
          created_at: p.created_at || null,
          timeAgo: p.time_ago || (p.created_at ? new Date(p.created_at).toLocaleDateString() : ''),
          visibility: 'public',
          media: (() => {
            if (Array.isArray(p.media) && p.media.length > 0) {
              return p.media.map(m => ({ url: m.medium || m.original || m.url, thumb: m.thumb, name: m.name, type: m.type || p.post_type || 'image' }));
            }
            if (!p.media_url) return [];
            const mType = (p.post_type === 'video') ? 'video' : (p.post_type === 'document') ? 'document' : 'image';
            return [{ url: p.media_url, type: mType }];
          })(),
          is_liked: !!p.is_liked,
          is_bookmarked: !!p.is_bookmarked,
        };
      }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1,2,3].map(i => (
          <div key={i} className="w-full sm:max-w-2xl mx-auto px-2 sm:px-0">
            <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gray-200" /><div className="flex-1"><div className="h-3 bg-gray-200 rounded w-32 mb-2" /><div className="h-2 bg-gray-100 rounded w-20" /></div></div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2" /><div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-48 bg-gray-100 rounded-lg mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No posts yet. Be the first to share something!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((item) => (
        <div
          key={item.id}
          id={`post-${item.id}`}
          className="w-full sm:max-w-2xl mx-auto px-2 sm:px-0"
          onClick={() => {
            try { sessionStorage.setItem('lastPostId', String(item.id)); } catch {}
          }}
        >
          <TimelineCard item={item} disabledActions={false} view={'list'} compact={true} />
        </div>
      ))}
    </div>
  );
}
