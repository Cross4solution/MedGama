import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { medStreamAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import TimelineCard from '../components/timeline/TimelineCard';

export default function SavedPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const fetchBookmarks = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await medStreamAPI.bookmarks({ type: 'post', per_page: 20, page: pageNum });
      const bookmarks = res?.data || [];
      const mapped = bookmarks
        .filter(b => b.post)
        .map(b => {
          const p = b.post;
          const ec = p.engagement_counter || p.engagementCounter || {};
          const authorRole = p.author?.role_id || 'doctor';
          const clinicName = p.clinic?.fullname || '';
          return {
            id: p.id,
            author_id: p.author_id,
            type: authorRole === 'clinicOwner' ? 'clinic_update' : 'doctor_update',
            title: p.author?.fullname || 'Doctor',
            subtitle: clinicName,
            city: '',
            img: p.media_url || '',
            text: p.content || '',
            likes: ec.like_count || 0,
            comments: ec.comment_count || 0,
            specialty: '',
            countryCode: '',
            actor: {
              id: p.author_id,
              role: authorRole,
              name: p.author?.fullname || 'Doctor',
              title: clinicName || (authorRole === 'doctor' ? 'Doctor' : ''),
              avatarUrl: p.author?.avatar || '/images/default/default-avatar.svg',
            },
            socialContext: '',
            created_at: p.created_at || null,
            timeAgo: p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
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
            is_bookmarked: true,
            bookmark_id: b.id,
          };
        });

      if (pageNum === 1) {
        setPosts(mapped);
      } else {
        setPosts(prev => [...prev, ...mapped]);
      }
      setTotal(res?.total || mapped.length);
      setHasMore((res?.current_page || 1) < (res?.last_page || 1));
    } catch (err) {
      console.warn('Failed to fetch bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBookmarks(1);
    else setLoading(false);
  }, [user, fetchBookmarks]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchBookmarks(next);
  };

  const handleUnsave = async (postId) => {
    setConfirmRemove(null);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setTotal(prev => Math.max(0, prev - 1));
    try {
      await medStreamAPI.toggleBookmark({ post_id: postId });
    } catch {
      fetchBookmarks(1);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('common.signInRequired', 'Sign in required')}</h2>
          <p className="text-gray-500 mb-6">{t('auth.loginRequiredMessage', 'You need to sign in to view saved posts.')}</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors">
            {t('common.login', 'Sign In')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {t('common.savedPosts', 'Saved Posts')}
            </h1>
            <p className="text-sm text-gray-500">{total} {total === 1 ? 'post' : 'posts'} saved</p>
          </div>
        </div>

        {/* Content */}
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('common.noSavedPosts', 'No saved posts yet')}</h3>
            <p className="text-sm text-gray-400 mb-6">Save posts from your feed to find them here later.</p>
            <button onClick={() => navigate('/medstream')} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
              Browse Feed
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="relative group">
                <TimelineCard
                  item={post}
                  disabledActions={false}
                  view="list"
                  onOpen={() => navigate(`/post/${encodeURIComponent(post.id)}`, { state: { item: post } })}
                />
                <button
                  type="button"
                  onClick={() => setConfirmRemove(post.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all z-10"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button onClick={loadMore} disabled={loading} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Confirm Remove Modal */}
    {confirmRemove && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setConfirmRemove(null)}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Saved Post?</h3>
          <p className="text-sm text-gray-500 mb-5">Are you sure you want to remove this post from your saved list?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmRemove(null)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUnsave(confirmRemove)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
