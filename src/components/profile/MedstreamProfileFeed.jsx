import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, Play, Loader2, MessageSquare, Eye } from 'lucide-react';
import { medStreamAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import useAuthGuard from '../../hooks/useAuthGuard';
import { useTranslation } from 'react-i18next';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

const DEFAULT_AVATAR = '/images/default/default-avatar.svg';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

/* ── Video Player with thumbnail + play button ── */
function VideoPlayer({ src, thumbnail }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef(null);

  const handlePlay = () => {
    setPlaying(true);
    setTimeout(() => videoRef.current?.play?.(), 50);
  };

  if (error) {
    return (
      <div className="relative w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <p className="text-sm text-gray-400">Video unavailable</p>
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={handlePlay}
        className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden group focus:outline-none"
      >
        {thumbnail ? (
          <img src={resolveStorageUrl(thumbnail)} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={resolveStorageUrl(src)}
        controls
        autoPlay
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}

/* ── Post Card ── */
function PostCard({ post, onLike, onBookmark, onComment }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const author = post.author || {};
  const ec = post.engagement_counter || {};
  const media = Array.isArray(post.media) ? post.media : [];
  const isVideo = post.post_type === 'video' || media.some(m => m.type === 'video');
  const isImage = post.post_type === 'image' || media.some(m => m.type === 'image');
  const videoMedia = media.find(m => m.type === 'video');
  const imageMedia = media.find(m => m.type === 'image');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <img
          src={resolveStorageUrl(author.avatar) || DEFAULT_AVATAR}
          alt={author.fullname}
          className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0"
          onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{author.fullname || 'Doctor'}</p>
          <p className="text-[11px] text-gray-400">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>
      )}

      {/* Media */}
      {isVideo && videoMedia && (
        <div className="px-4 pb-3">
          <VideoPlayer
            src={videoMedia.original || videoMedia.url || post.media_url}
            thumbnail={videoMedia.thumb}
          />
        </div>
      )}

      {isImage && !isVideo && (imageMedia || post.media_url) && (
        <div className="px-4 pb-3">
          <img
            src={resolveStorageUrl(imageMedia?.medium || imageMedia?.original || imageMedia?.url || post.media_url)}
            alt="Post media"
            className="w-full rounded-xl object-cover max-h-[420px] border border-gray-100"
            loading="lazy"
          />
        </div>
      )}

      {/* Engagement stats */}
      <div className="px-4 pb-2 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-3">
          {(ec.like_count > 0) && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" fill="currentColor" /> {ec.like_count}
            </span>
          )}
          {(post.view_count > 0) && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {post.view_count}
            </span>
          )}
        </div>
        {(ec.comment_count > 0) && (
          <span>{ec.comment_count} {t('common.comments', 'comments')}</span>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-gray-100 px-2 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => onLike?.(post.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            post.is_liked ? 'text-rose-600 bg-rose-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-rose-500' : ''}`} />
          {t('common.like', 'Like')}
        </button>
        <button
          type="button"
          onClick={() => onComment?.(post.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {t('common.comment', 'Comment')}
        </button>
        <button
          type="button"
          onClick={() => onBookmark?.(post.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            post.is_bookmarked ? 'text-violet-600 bg-violet-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${post.is_bookmarked ? 'fill-violet-500' : ''}`} />
          {t('common.save', 'Save')}
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          onClick={() => {
            if (navigator.share) navigator.share({ url: `${window.location.origin}/post/${post.id}` }).catch(() => {});
            else navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`);
          }}
        >
          <Share2 className="w-4 h-4" />
          {t('common.share', 'Share')}
        </button>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-gray-200 rounded w-32" />
          <div className="h-2.5 bg-gray-100 rounded w-20" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-3/4 mb-3" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MedstreamProfileFeed — Main Export
   Props:
     authorId  — filter posts by author_id (doctor user)
     clinicId  — filter posts by clinic_id (clinic)
   ═══════════════════════════════════════════ */
export default function MedstreamProfileFeed({ authorId, clinicId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { guardAction } = useAuthGuard();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (pg = 1) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { per_page: 10, page: pg };
      if (authorId) params.author_id = authorId;
      if (clinicId) params.clinic_id = clinicId;
      const res = await medStreamAPI.posts(params);
      const list = res?.data || [];
      const meta = res?.meta || {};
      if (pg === 1) setPosts(list); else setPosts(prev => [...prev, ...list]);
      setHasMore((meta.current_page || pg) < (meta.last_page || 1));
    } catch { if (pg === 1) setPosts([]); }
    setLoading(false);
    setLoadingMore(false);
  }, [authorId, clinicId]);

  useEffect(() => { setPage(1); fetchPosts(1); }, [fetchPosts]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  const handleLike = guardAction(async (postId) => {
    try {
      const res = await medStreamAPI.toggleLike(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: res?.liked ?? !p.is_liked, engagement_counter: { ...p.engagement_counter, like_count: (p.engagement_counter?.like_count || 0) + (res?.liked ? 1 : -1) } } : p));
    } catch {}
  });

  const handleComment = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleBookmark = guardAction(async (postId) => {
    try {
      const res = await medStreamAPI.toggleBookmark({ bookmarked_type: 'post', target_id: postId });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_bookmarked: res?.bookmarked ?? !p.is_bookmarked } : p));
    } catch {}
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Medstream</h3>
        {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Medstream</h3>
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">{t('medstream.noPosts', 'No posts yet')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('medstream.noPostsHint', 'Posts shared on Medstream will appear here.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Medstream</h3>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onComment={handleComment}
          onBookmark={handleBookmark}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('common.loadMore', 'Load More')}
          </button>
        </div>
      )}
    </div>
  );
}
