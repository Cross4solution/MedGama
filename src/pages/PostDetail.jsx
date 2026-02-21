import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, X, ChevronLeft, ChevronRight, ThumbsUp, FileText, Play, Download, Bookmark } from 'lucide-react';
import ShareMenu from '../components/ShareMenu';
import TimelineActionsRow from '../components/timeline/TimelineActionsRow';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import EmojiPicker from '../components/EmojiPicker';
import { medStreamAPI } from '../lib/api';

function toStreamUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const marker = '/storage/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const base = url.substring(0, idx);
  const storagePath = url.substring(idx + marker.length);
  return `${base}/api/media/stream/${storagePath}`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  if (dateStr === 'Just now') return 'Just now';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 4) return `${diffWeek}w ago`;
    return date.toLocaleDateString();
  } catch { return dateStr; }
}

function getMediaType(m) {
  if (m.type === 'video' || /\.(mp4|webm|mov|avi)$/i.test(m.url || '')) return 'video';
  if (m.type === 'document' || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv)$/i.test(m.url || '') || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv)$/i.test(m.name || '')) return 'document';
  return 'image';
}

function getFileExt(m) {
  const name = m.name || m.url || '';
  const match = name.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return match ? match[1].toUpperCase() : 'FILE';
}

function getFileName(m) {
  if (m.name) return m.name;
  try { return decodeURIComponent((m.url || '').split('/').pop().split('?')[0]); } catch { return 'Document'; }
}

const EXT_COLORS = { PDF: 'bg-red-500', DOC: 'bg-blue-500', DOCX: 'bg-blue-500', XLS: 'bg-green-600', XLSX: 'bg-green-600', PPT: 'bg-orange-500', PPTX: 'bg-orange-500', CSV: 'bg-emerald-500' };

export default function PostDetail() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showComments, setShowComments] = React.useState(true);
  const [replyTo, setReplyTo] = React.useState('');
  const [replyText, setReplyText] = React.useState('');
  const [newComment, setNewComment] = React.useState('');
  const { user } = useAuth();
  const { t } = useTranslation();
  const isGuest = !user;
  const isPatient = user?.role === 'patient';
  const loginRequiredMsg = t('auth.loginRequiredMessage', 'You need to sign in to perform this action.');

  // Simple toast state for guest warnings
  const [guestToast, setGuestToast] = React.useState('');
  const guestToastTimer = React.useRef(null);
  const showGuestToast = (msg) => {
    setGuestToast(msg);
    if (guestToastTimer.current) clearTimeout(guestToastTimer.current);
    guestToastTimer.current = setTimeout(() => setGuestToast(''), 3500);
  };
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const emojiReplyRef = React.useRef(null);
  const [apiDetailComments, setApiDetailComments] = React.useState([]);
  const [detailCommentsLoaded, setDetailCommentsLoaded] = React.useState(false);
  const [deleteCommentConfirm, setDeleteCommentConfirm] = React.useState(null); // { id, isReply, parentId }

  // ExploreTimeline/TimelineCard üzerinden gelen state öncelikli, fallback to API
  const [apiItem, setApiItem] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // Check if state item has valid (non-blob) media
  const stateItem = state?.item;
  const stateHasBlob = stateItem && (
    (stateItem.img && stateItem.img.startsWith('blob:')) ||
    (Array.isArray(stateItem.media) && stateItem.media.some(m => m.url && m.url.startsWith('blob:')))
  );

  // Fetch from API if no state item or has blob URLs
  React.useEffect(() => {
    if (!id) return;
    if (stateItem && !stateHasBlob) return; // state is valid, no need to fetch
    setLoading(true);
    medStreamAPI.getPost(id).then(res => {
      const p = res?.post || res?.data?.post || res;
      if (p?.id) {
        setApiItem({
          id: p.id,
          type: 'doctor_update',
          title: p.author?.fullname || 'Doctor',
          subtitle: '',
          text: p.content || '',
          img: p.media_url || '',
          likes: (p.engagement_counter || p.engagementCounter)?.like_count || 0,
          comments: (p.engagement_counter || p.engagementCounter)?.comment_count || 0,
          actor: {
            id: p.author_id,
            role: p.author?.role_id || 'doctor',
            name: p.author?.fullname || 'Doctor',
            title: '',
            avatarUrl: p.author?.avatar || '/images/default/default-avatar.svg',
          },
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
          specialty: '',
          is_liked: !!p.is_liked,
          is_bookmarked: !!p.is_bookmarked,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, stateItem, stateHasBlob]);

  const item = (stateItem && !stateHasBlob) ? stateItem : (apiItem || stateItem);

  // Image gallery state
  const mediaList = Array.isArray(item?.media) && item?.media.length > 0
    ? item.media.filter(m => m.url && !m.url.startsWith('blob:'))
    : [];
  const initialMediaIndex = state?.mediaIndex || 0;
  const [imgIndex, setImgIndex] = React.useState(initialMediaIndex);
  const [heroHeightPx, setHeroHeightPx] = React.useState(0);
  const [heroOpacity, setHeroOpacity] = React.useState(1);
  const [heroShiftPx, setHeroShiftPx] = React.useState(0);
  const baseHeightRef = React.useRef(0);
  // Zoom/Pan state for desktop image view
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const offsetStartRef = React.useRef({ x: 0, y: 0 });
  // Action bar local state (match TimelineCard)
  const [liked, setLiked] = React.useState(!!item?.is_liked);
  const [likeCount, setLikeCount] = React.useState(Number(item?.engagement?.likes) || Number(item?.likes) || 0);
  const [bookmarked, setBookmarked] = React.useState(!!item?.is_bookmarked);

  const likedRef = React.useRef(!!item?.is_liked);
  const bookmarkedRef = React.useRef(!!item?.is_bookmarked);

  // Sync liked/bookmarked state when item changes (e.g. after API fetch)
  React.useEffect(() => {
    if (item?.is_liked !== undefined) {
      const val = !!item.is_liked;
      setLiked(val);
      likedRef.current = val;
    }
    if (item?.likes !== undefined || item?.engagement?.likes !== undefined) {
      setLikeCount(Number(item?.engagement?.likes) || Number(item?.likes) || 0);
    }
    if (item?.is_bookmarked !== undefined) {
      const val = !!item.is_bookmarked;
      setBookmarked(val);
      bookmarkedRef.current = val;
    }
  }, [item?.id, item?.is_liked, item?.is_bookmarked]);

  const handleLike = React.useCallback((e) => {
    e?.stopPropagation?.();
    if (isGuest) { showGuestToast(loginRequiredMsg); return; }
    const prev = likedRef.current;
    const next = !prev;
    likedRef.current = next;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (item?.id) {
      medStreamAPI.toggleLike(item.id).then((res) => {
        const serverLiked = res?.liked ?? next;
        likedRef.current = serverLiked;
        setLiked(serverLiked);
        if (res?.like_count !== undefined) setLikeCount(Number(res.like_count));
      }).catch((err) => {
        console.warn('Like failed:', err?.message || err);
        likedRef.current = prev;
        setLiked(prev);
        setLikeCount((c) => Math.max(0, c + (prev ? 1 : -1)));
      });
    }
  }, [isGuest, loginRequiredMsg, item?.id]);

  const handleBookmark = React.useCallback((e) => {
    e?.stopPropagation?.();
    if (isGuest) { showGuestToast(loginRequiredMsg); return; }
    const prev = bookmarkedRef.current;
    const next = !prev;
    bookmarkedRef.current = next;
    setBookmarked(next);
    if (item?.id) {
      medStreamAPI.toggleBookmark({ post_id: item.id }).then((res) => {
        const serverBookmarked = res?.bookmarked ?? next;
        bookmarkedRef.current = serverBookmarked;
        setBookmarked(serverBookmarked);
      }).catch((err) => {
        console.warn('Bookmark failed:', err?.message || err);
        bookmarkedRef.current = prev;
        setBookmarked(prev);
      });
    }
  }, [isGuest, loginRequiredMsg, item?.id]);

  const goPrev = () => setImgIndex((i) => (i - 1 + mediaList.length) % mediaList.length);
  const goNext = () => setImgIndex((i) => (i + 1) % mediaList.length);

  // Touch swipe for images (mobile)
  const touchXRef = React.useRef(null);
  const onTouchStart = (e) => {
    try { touchXRef.current = e.changedTouches?.[0]?.clientX ?? null; } catch {}
  };
  const onTouchEnd = (e) => {
    try {
      const startX = touchXRef.current;
      const endX = e.changedTouches?.[0]?.clientX ?? null;
      if (startX == null || endX == null) return;
      const dx = endX - startX;
      if (Math.abs(dx) > 40) { // simple threshold
        if (dx < 0) { goNext(); } else { goPrev(); }
      }
    } catch {}
  };

  // Initialize base hero height on mount and resize
  React.useEffect(() => {
    const setBase = () => {
      if (typeof window === 'undefined') return;
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        // Desktop: let CSS control height via lg:h-screen; don't drive inline height
        baseHeightRef.current = 0;
        setHeroHeightPx(0);
        return;
      }
      // Mobile: fixed hero height ~50vh, image will not resize
      baseHeightRef.current = Math.round(window.innerHeight * 0.5);
      setHeroHeightPx(baseHeightRef.current);
      setHeroShiftPx(0);
      setHeroOpacity(1);
    };
    setBase();
    window.addEventListener('resize', setBase);
    return () => window.removeEventListener('resize', setBase);
  }, []);

  // Collapsing hero image on scroll (mobile): container height shrinks smoothly
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ticking = false;
    let last = -1;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = el.scrollTop || 0;
        const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
        if (isDesktop) { ticking = false; return; }

        const base = baseHeightRef.current || 0;
        if (base <= 0) { ticking = false; return; }

        // Mobile: hero is sticky and fixed height; apply slight parallax translate only
        const maxShift = Math.round((base || window.innerHeight * 0.66) * 0.15); // ~15% upward shift
        const shift = Math.min(y, maxShift);
        if (shift !== heroShiftPx) setHeroShiftPx(shift);
        setHeroOpacity(1);
        ticking = false;
        return;
      });
    };

    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Share URL (same approach as TimelineCard)
  // Smart back navigation: if user came via direct link (no history), go to /explore
  const goBack = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/explore', { replace: true });
    }
  }, [navigate]);

  const shareUrl = (() => {
    try {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      return `${origin}/post/${encodeURIComponent(item?.id || '')}`;
    } catch {
      return `/post/${encodeURIComponent(item?.id || '')}`;
    }
  })();

  // Zoom handlers (desktop)
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const onWheelZoom = (e) => {
    // Only handle zooming on desktop; ignore if modifier keys pressed unpredictably
    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
    if (!isDesktop) return;
    // Prevent page scroll while zooming over image area
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.15; // wheel up => zoom in
    setZoom((z) => clamp(Number((z + delta).toFixed(2)), 1, 4));
  };

  const onDoubleClickZoom = (e) => {
    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
    if (!isDesktop) return;
    setZoom((z) => (z === 1 ? 2 : 1));
    if (zoom === 1) {
      // will become 2: keep current offset
    } else {
      // reset when returning to 1
      setOffset({ x: 0, y: 0 });
    }
  };

  const onMouseDownPan = (e) => {
    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
    if (!isDesktop || zoom === 1) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
  };
  const onMouseMovePan = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setOffset({ x: offsetStartRef.current.x + dx, y: offsetStartRef.current.y + dy });
  };
  const onMouseUpPan = () => setIsPanning(false);

  const actorSubtitle = item?.actor?.title || item?.specialty || 'Healthcare';
  const timeLabel = item?.timeAgo || '';

  // Comments state — local
  const [localDetailComments, setLocalDetailComments] = React.useState([]);
  const [visibleDetailCommentCount, setVisibleDetailCommentCount] = React.useState(3);

  // Fetch comments from API
  React.useEffect(() => {
    const postId = item?.id || id;
    if (!postId || detailCommentsLoaded) return;
    medStreamAPI.comments(postId, { per_page: 50 }).then(res => {
      const list = res?.data || [];
      setApiDetailComments(list.map(c => ({
        id: c.id,
        author_id: c.author_id || c.author?.id,
        name: c.author?.fullname || 'User',
        avatar: c.author?.avatar || '/images/default/default-avatar.svg',
        text: c.content || '',
        time: c.created_at || '',
        parent_id: c.parent_id || null,
        replies: (c.replies || []).map(r => ({
          id: r.id,
          author_id: r.author_id || r.author?.id,
          name: r.author?.fullname || 'User',
          avatar: r.author?.avatar || '/images/default/default-avatar.svg',
          text: r.content || '',
          time: r.created_at || '',
          parent_id: r.parent_id || c.id,
          replies: [],
        })),
      })));
      setDetailCommentsLoaded(true);
    }).catch(() => setDetailCommentsLoaded(true));
  }, [item?.id, id, detailCommentsLoaded]);
  const submitDetailComment = () => {
    if (isGuest) { showGuestToast(loginRequiredMsg); return; }
    const text = newComment.trim();
    if (!text || !item?.id) return;
    setLocalDetailComments(prev => [...prev, {
      id: 'dc-' + Date.now(),
      author_id: user?.id,
      name: user?.name || item?.actor?.name || 'You',
      avatar: user?.avatar || item?.actor?.avatarUrl || '/images/default/default-avatar.svg',
      text,
      time: 'Just now',
      parent_id: null,
      replies: [],
    }]);
    medStreamAPI.createComment(item.id, { content: text }).catch(() => {});
    setNewComment('');
  };

  const submitDetailReply = () => {
    if (isGuest) { showGuestToast(loginRequiredMsg); return; }
    const text = replyText.trim();
    const parentId = replyTo;
    if (!text || !item?.id) return;
    const newReply = {
      id: 'dr-' + Date.now(),
      author_id: user?.id,
      name: user?.name || item?.actor?.name || 'You',
      avatar: user?.avatar || item?.actor?.avatarUrl || '/images/default/default-avatar.svg',
      text,
      time: 'Just now',
      parent_id: parentId,
      replies: [],
    };
    // Add reply nested under parent
    const inApi = apiDetailComments.some(c => c.id === parentId);
    if (inApi) {
      setApiDetailComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
      ));
    } else {
      setLocalDetailComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
      ));
    }
    medStreamAPI.createComment(item.id, { content: text, parent_id: parentId }).catch(() => {});
    setReplyTo('');
    setReplyText('');
  };

  return (
    <>
    {/* Guest login-required toast */}
    {guestToast && (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3 flex items-center gap-3 max-w-sm">
          <span className="text-amber-500 text-lg">⚠️</span>
          <span className="text-sm text-gray-700 font-medium">{guestToast}</span>
          <button onClick={() => navigate('/login')} className="ml-2 text-xs font-semibold text-teal-600 hover:text-teal-700 whitespace-nowrap">{t('auth.goToLogin', 'Sign In')}</button>
        </div>
      </div>
    )}
    {loading && !item ? (
      <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    ) : !item ? (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-600">
          <button onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="rounded-2xl border bg-white p-10 shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Post not found. Please go back and try again.</p>
          </div>
        </div>
      </div>
    ) : (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[90]">
      <div className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-[1fr_minmax(380px,480px)] overflow-hidden">

        {/* ── Left: Image / Media column ── */}
        <div className="relative flex items-center justify-center bg-gray-950 overflow-hidden select-none flex-shrink-0 lg:h-screen" style={{ height: heroHeightPx ? `${heroHeightPx}px` : undefined, transition: 'height 0.12s ease-out' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

          {/* Subtle blurred bg — only for images */}
          {mediaList.length > 0 && getMediaType(mediaList[imgIndex]) === 'image' && (
            <img src={mediaList[imgIndex]?.url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 opacity-30" />
          )}

          {/* Close button */}
          <button onClick={goBack} className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white/90 hover:text-white flex items-center justify-center transition-all" aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          {/* Image counter badge */}
          {mediaList.length > 1 && (
            <div className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90 text-xs font-medium tabular-nums">
              {imgIndex + 1} / {mediaList.length}
            </div>
          )}

          {/* Navigation arrows */}
          {mediaList.length > 1 && (
            <>
              <button type="button" onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center transition-all" aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center transition-all" aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Main image */}
          {mediaList.length > 0 ? (() => {
            const currentMedia = mediaList[imgIndex];
            const mType = getMediaType(currentMedia);

            if (mType === 'document') {
              const ext = getFileExt(currentMedia);
              const name = getFileName(currentMedia);
              const color = EXT_COLORS[ext] || 'bg-gray-500';
              const downloadUrl = currentMedia.original || currentMedia.url;
              return (
                <div className="relative flex flex-col items-center justify-center w-full h-full p-8">
                  <div className={`w-24 h-24 rounded-3xl ${color} flex items-center justify-center shadow-2xl mb-6`}>
                    <FileText className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-white/90 text-lg font-semibold text-center max-w-[320px] truncate mb-2">{name}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${color} mb-6`}>{ext}</span>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Open / Download
                  </a>
                </div>
              );
            }

            if (mType === 'video') {
              return (
                <div className="relative flex items-center justify-center w-full h-full">
                  <video
                    src={toStreamUrl(currentMedia.original || currentMedia.url)}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="max-w-full max-h-full"
                    poster={currentMedia.thumb || undefined}
                  />
                </div>
              );
            }

            return (
              <div
                className="relative flex items-center justify-center w-full h-full overflow-hidden"
                onWheel={onWheelZoom}
                onDoubleClick={onDoubleClickZoom}
                onMouseDown={onMouseDownPan}
                onMouseMove={onMouseMovePan}
                onMouseUp={onMouseUpPan}
                onMouseLeave={onMouseUpPan}
              >
                <img
                  src={currentMedia?.url}
                  alt={item.title}
                  className={`max-w-full max-h-full select-none object-contain ${zoom === 1 ? 'cursor-zoom-in' : 'cursor-grab active:cursor-grabbing'}`}
                  style={{
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                    transformOrigin: 'center center',
                    willChange: 'transform',
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                  }}
                  draggable={false}
                />
              </div>
            );
          })() : (
            <div className="flex flex-col items-center justify-center text-white/40 text-center p-8">
              <div className="w-20 h-20 mb-5 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium">No media available</p>
            </div>
          )}

          {/* Dot indicators */}
          {mediaList.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {mediaList.slice(0, 8).map((_, i) => (
                <button key={i} type="button" onClick={() => setImgIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/60'}`} />
              ))}
              {mediaList.length > 8 && <span className="text-white/40 text-[10px] ml-1">+{mediaList.length - 8}</span>}
            </div>
          )}
        </div>

        {/* ── Right: Content panel ── */}
        <div ref={containerRef} className="bg-white flex-1 flex flex-col min-h-0 lg:h-screen overflow-hidden" style={{ height: heroHeightPx ? `calc(100vh - ${heroHeightPx}px)` : undefined }}>

          {/* Header — sticky */}
          <div className="px-5 py-3.5 border-b border-gray-100/80 flex items-center gap-3 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <img src={item.actor?.avatarUrl || item.avatar || '/images/default/default-avatar.svg'} alt={item.actor?.name || item.title} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100/80 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-semibold text-gray-900 truncate leading-tight">{item.actor?.name || item.title}</h1>
              <p className="text-xs text-gray-500 truncate mt-0.5 leading-tight">{actorSubtitle}</p>
            </div>
            {timeLabel && (
              <span className="text-[11px] text-gray-400 flex-shrink-0 font-medium">{timeLabel}</span>
            )}
            {/* Close on mobile */}
            <button onClick={() => navigate(-1)} className="lg:hidden w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">

            {/* Post text */}
            <div className="px-5 py-4">
              <p className="text-[15px] leading-[1.6] text-gray-800 whitespace-pre-wrap">{item.text}</p>
            </div>

            {/* Engagement counts */}
            <div className="px-5 pb-2 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-blue-500 text-white">
                  <ThumbsUp className="w-[10px] h-[10px]" />
                </span>
                <span className="font-medium tabular-nums">{likeCount}</span>
              </div>
              <button type="button" onClick={() => setShowComments(v => !v)} className="hover:text-gray-700 hover:underline transition-colors">
                {item.comments || 0} comments
              </button>
            </div>

            {/* Action bar */}
            <div className="mx-5 py-1 border-t border-b border-gray-100 grid grid-cols-4 gap-0.5">
              <button
                type="button"
                className={`inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all ${liked ? 'text-blue-600 bg-blue-50/60' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={handleLike}
              >
                <ThumbsUp className="w-[16px] h-[16px]" strokeWidth={liked ? 2.4 : 1.7} fill={liked ? 'currentColor' : 'none'} />
                Like
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 font-medium transition-all"
                onClick={() => setShowComments(v => !v)}
              >
                <MessageCircle className="w-[16px] h-[16px]" strokeWidth={1.7} />
                Comment
              </button>
              <button
                type="button"
                className={`inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all ${bookmarked ? 'text-amber-600 bg-amber-50/60' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={handleBookmark}
              >
                <Bookmark className="w-[16px] h-[16px]" strokeWidth={bookmarked ? 2.4 : 1.7} fill={bookmarked ? 'currentColor' : 'none'} />
                Save
              </button>
              <ShareMenu title="Share" url={shareUrl} showNative={false} buttonClassName="w-full text-gray-600 font-medium text-[13px]" />
            </div>

            {/* Comments section */}
            {showComments && (
              <div className="px-5 pt-4 pb-6">

                {/* New comment input */}
                <div className="flex items-start gap-2.5 mb-5">
                  <img src={user?.avatar || item?.actor?.avatarUrl || '/images/default/default-avatar.svg'} alt="You" className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 bg-gray-50/50 hover:bg-white hover:border-gray-300 focus-within:bg-white focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
                    <input
                      placeholder={isGuest ? 'Sign in to comment…' : 'Add a comment...'}
                      className={`flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400 ${isGuest ? 'cursor-not-allowed' : ''}`}
                      disabled={isGuest}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitDetailComment(); }}
                    />
                    <button
                      onClick={submitDetailComment}
                      disabled={!newComment.trim()}
                      className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                        newComment.trim()
                          ? 'text-teal-600 hover:bg-teal-50'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Post
                    </button>
                  </div>
                </div>

                {/* Comment threads — from API + local */}
                <div className="space-y-1">
                  {!detailCommentsLoaded && (
                    <div className="py-4 flex justify-center">
                      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {(() => {
                    const allDetailComments = [...apiDetailComments, ...localDetailComments];
                    const visibleComments = allDetailComments.slice(0, visibleDetailCommentCount);
                    const remainingCount = allDetailComments.length - visibleDetailCommentCount;
                    return (
                      <>
                        {visibleComments.map((c) => (
                          <div key={c.id} className="py-2.5">
                            <div className="flex items-start gap-2.5">
                              <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="bg-gray-50/80 rounded-xl px-3.5 py-2.5">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[13px] font-semibold text-gray-900">{c.name}</span>
                                    <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTimeAgo(c.time)}</span>
                                  </div>
                                  <p className="text-[13px] text-gray-700 leading-relaxed mt-0.5">{c.text}</p>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400 pl-2">
                                  {c.author_id !== user?.id && c.user_id !== user?.id && (
                                    <button type="button" className="font-semibold hover:text-gray-600 transition-colors" onClick={() => { setReplyTo(p => p === c.id ? '' : c.id); setReplyText(''); }}>Reply</button>
                                  )}
                                  {(c.author_id === user?.id || c.user_id === user?.id) && (
                                    <button type="button" className="font-semibold hover:text-red-500 transition-colors" onClick={() => {
                                      setDeleteCommentConfirm({ id: c.id, isReply: false, parentId: null });
                                    }}>Delete</button>
                                  )}
                                </div>
                                {/* Nested replies */}
                                {Array.isArray(c.replies) && c.replies.length > 0 && (
                                  <div className="mt-2 ml-2 pl-3 border-l-2 border-gray-100 space-y-2">
                                    {c.replies.map((r) => (
                                      <div key={r.id} className="flex items-start gap-2">
                                        <img src={r.avatar} alt={r.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="bg-gray-50/60 rounded-lg px-3 py-2">
                                            <div className="flex items-baseline justify-between gap-2">
                                              <span className="text-[12px] font-semibold text-gray-900">{r.name}</span>
                                              <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTimeAgo(r.time)}</span>
                                            </div>
                                            <p className="text-[12px] text-gray-700 leading-relaxed mt-0.5">{r.text}</p>
                                          </div>
                                          {(r.author_id === user?.id || r.user_id === user?.id) && (
                                            <button type="button" className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors mt-0.5 flex-shrink-0" onClick={() => {
                                              setDeleteCommentConfirm({ id: r.id, isReply: true, parentId: c.id });
                                            }}>Delete</button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {replyTo === c.id && (
                                  <div className="mt-2 ml-2 pl-3 border-l-2 border-teal-200">
                                    <div className="flex items-center gap-2">
                                      <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitDetailReply(); }} placeholder="Write a reply..." className="flex-1 border border-gray-200 rounded-full px-3.5 py-1.5 text-[12px] outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all" />
                                      <button type="button" className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 px-2" onClick={submitDetailReply}>Post</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <button
                            type="button"
                            className="w-full py-2.5 text-[13px] font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50/50 rounded-lg transition-colors"
                            onClick={() => setVisibleDetailCommentCount(prev => prev + 3)}
                          >
                            Daha fazla yorum yükle ({remainingCount})
                          </button>
                        )}
                      </>
                    );
                  })()}
                  {detailCommentsLoaded && apiDetailComments.length === 0 && localDetailComments.length === 0 && (
                    <p className="py-3 text-center text-xs text-gray-400">No comments yet. Be the first!</p>
                  )}
                </div>

                {/* Delete Comment Confirmation */}
                {deleteCommentConfirm && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 p-3">
                    <p className="text-xs font-semibold text-red-700 mb-2">Are you sure you want to delete this comment?</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        onClick={() => {
                          const { id, isReply, parentId } = deleteCommentConfirm;
                          if (isReply && parentId) {
                            setApiDetailComments(prev => prev.map(x => x.id === parentId ? { ...x, replies: (x.replies || []).filter(rr => rr.id !== id) } : x));
                            setLocalDetailComments(prev => prev.map(x => x.id === parentId ? { ...x, replies: (x.replies || []).filter(rr => rr.id !== id) } : x));
                          } else {
                            setApiDetailComments(prev => prev.filter(x => x.id !== id));
                            setLocalDetailComments(prev => prev.filter(x => x.id !== id));
                          }
                          if (!String(id).startsWith('dc-') && !String(id).startsWith('dr-')) {
                            medStreamAPI.deleteComment(id).catch(() => {});
                          }
                          setDeleteCommentConfirm(null);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setDeleteCommentConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    )}
    </>
  );
}
