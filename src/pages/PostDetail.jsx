import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, X, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import ShareMenu from '../components/ShareMenu';
import TimelineActionsRow from '../components/timeline/TimelineActionsRow';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from '../components/EmojiPicker';

export default function PostDetail() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showComments, setShowComments] = React.useState(true);
  const [replyTo, setReplyTo] = React.useState('');
  const [replyText, setReplyText] = React.useState('');
  const [newComment, setNewComment] = React.useState('');
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const emojiReplyRef = React.useRef(null);

  // ExploreTimeline/TimelineCard üzerinden gelen state öncelikli
  const item = state?.item;

  // Image gallery state
  const mediaList = Array.isArray(item?.media) && item.media.length > 0 ? item.media : (item?.img ? [{ url: item.img }] : []);
  const [imgIndex, setImgIndex] = React.useState(0);
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
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(Number(item?.engagement?.likes) || Number(item?.likes) || 0);

  const handleLike = React.useCallback((e) => {
    e?.stopPropagation?.();
    setLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => c + (next ? 1 : -1));
      return next;
    });
  }, []);

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
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Share URL (same approach as TimelineCard)
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

  return (
    !item ? (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-600">
          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">← Geri</button>
          <div className="rounded-2xl border bg-white p-8">Post bulunamadı. Lütfen Explore Timeline üzerinden bir karta tıklayın.</div>
        </div>
      </div>
    ) : (
    <div className="fixed inset-0 bg-black/50 z-[90]">
      <div className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-[minmax(260px,1fr)_minmax(360px,560px)] overflow-y-hidden lg:overflow-y-visible overscroll-y-none touch-pan-y bg-transparent">
        {/* Left: Image column */}
        <div className="flex flex-col bg-transparent lg:min-h-0">
          <div className="relative flex items-center justify-center bg-transparent overflow-hidden select-none sticky top-0 z-10 flex-shrink-0 lg:h-screen" style={{ height: heroHeightPx ? `${heroHeightPx}px` : undefined, transition: 'height 0.12s ease-out', opacity: heroOpacity, willChange: 'height' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* Blurred background using the same image */}
          {mediaList.length > 0 && (
            <>
              <img
                src={mediaList[imgIndex]?.url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
              />
              <div className="absolute inset-0 bg-black/20" />
            </>
          )}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 text-white/80 hover:text-white"
            aria-label="Kapat"
          >
            <X className="w-6 h-6" />
          </button>
          {mediaList.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                aria-label="Önceki görsel"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                aria-label="Sonraki görsel"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {mediaList.length > 0 ? (
            <div
              className="relative flex items-center justify-center overflow-hidden bg-transparent rounded-md w-full h-full md:w-[92vw] md:h-[70vh] lg:w-[82vw] xl:w-[75vw] max-w-[1280px] mx-auto"
              onWheel={onWheelZoom}
              onDoubleClick={onDoubleClickZoom}
              onMouseDown={onMouseDownPan}
              onMouseMove={onMouseMovePan}
              onMouseUp={onMouseUpPan}
              onMouseLeave={onMouseUpPan}
            >
              <img
                src={mediaList[imgIndex]?.url}
                alt={item.title}
                className={`max-w-none select-none ${zoom === 1 ? 'cursor-zoom-in' : 'cursor-grab active:cursor-grabbing'}`}
                style={{
                  width: 'auto',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
                draggable={false}
                onError={() => {
                  // Image error handling - fallback div will be shown automatically
                }}
              />
            </div>
          ) : null}
          {/* Broken image fallback - always visible when no media or image fails */}
          <div className={`${mediaList.length === 0 ? 'flex' : 'hidden'} flex-col items-center justify-center text-white/60 text-center p-8`}>
            <div className="w-16 h-16 mb-4 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm">Görsel yüklenemedi</p>
          </div>
        </div>
        </div>

        {/* Right: Content panel */}
        <div ref={containerRef} className="bg-white flex-1 relative z-0 overflow-y-auto min-h-0 lg:h-full lg:overflow-y-auto" style={{ height: heroHeightPx ? `calc(100vh - ${heroHeightPx}px)` : undefined }}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
            <img src={item.actor?.avatarUrl || item.avatar || '/images/portrait-candid-male-doctor_720.jpg'} alt={item.title} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate" title={item.title}>{item.actor?.name || item.title}</h1>
              {item.specialty && (
                <span className="block text-xs text-gray-500 font-medium mt-0.5">{item.specialty}</span>
              )}
            </div>
          </div>

          {/* Text */}
          <div className="px-5 py-4">
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{item.text}</p>
          </div>

          {/* Action bar */}
          <div className="px-4 py-2 border-t border-b border-gray-100 grid grid-cols-3 gap-1 justify-items-center">
            <button
              type="button"
              className={`w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors ${liked ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600 hover:bg-gray-50'} font-medium`}
              onClick={handleLike}
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? '' : ''}`} strokeWidth={liked ? 2.5 : 1.8} fill={liked ? '#2563eb' : 'none'} />
              <span>Like</span>
            </button>
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              onClick={(e) => { e?.stopPropagation?.(); setShowComments(v => !v); }}
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
              <span>Comments</span>
            </button>
            <ShareMenu title="Share" url={shareUrl} showNative={false} buttonClassName="w-full text-gray-600 font-medium text-sm" />
          </div>

          {/* Comments */}
          {showComments && (
            <div className="px-5 py-4 bg-gray-50/50 relative min-h-0 transform-gpu overflow-x-hidden">
              {/* New comment input */}
              <div className="flex items-start gap-2.5 mb-5">
                <img src={item.actor?.avatarUrl || '/images/portrait-candid-male-doctor_720.jpg'} alt="Your avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200" />
                <div className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 bg-white hover:border-gray-300 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400 transition-all">
                  <input 
                    placeholder="Write a comment…" 
                    className="flex-1 outline-none text-sm bg-transparent"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                        // TODO: submit comment to backend
                        setNewComment('');
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (newComment.trim()) {
                        // TODO: submit comment to backend
                        setNewComment('');
                      }
                    }}
                    disabled={!newComment.trim()}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      newComment.trim() 
                        ? 'bg-teal-600 text-white hover:bg-teal-700' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Threaded comments */}
              <div className="space-y-4 text-sm">
                {/* Parent */}
                <div className="flex items-start gap-2.5">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Zehra Korkmaz" className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">Zehra Korkmaz</span>
                        <span className="text-[11px] text-gray-400">1 week</span>
                      </div>
                    </div>

                    {/* Reply thread */}
                    <div className="mt-2.5 ml-4 pl-3 border-l-2 border-gray-200">
                      <div className="flex items-start gap-2.5">
                        <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Dr. Bora Eren" className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200" />
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-gray-900">Dr. Bora Eren</span>
                              <span className="text-[11px] text-gray-400">1 week</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed"><span className="font-semibold text-teal-700">@Zehra Korkmaz</span> glad it helped 🙏</p>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400 pl-1">
                            <button type="button" className="font-medium hover:text-gray-600 transition-colors">Reply</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Another parent */}
                <div className="flex items-start gap-2.5">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Onur Demirtaş" className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-xl px-3.5 py-2.5 border border-gray-100">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">Onur Demirtaş</span>
                        <span className="text-[11px] text-gray-400">5 days</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">Great update 👏</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400 pl-1">
                      <button type="button" className="font-medium hover:text-gray-600 transition-colors" onClick={() => { setReplyTo(p => p === 'pd_c2' ? '' : 'pd_c2'); setReplyText(prev => (prev && replyTo==='pd_c2') ? prev : '@Onur Demirtaş '); }}>Reply</button>
                    </div>
                    {replyTo === 'pd_c2' && (
                      <div className="mt-2">
                        <div className="relative border border-gray-200 rounded-xl p-1.5 flex items-center gap-2 bg-white">
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e)=>setReplyText(e.target.value)}
                            placeholder="Write your reply…"
                            className="flex-1 min-w-0 outline-none px-2.5 py-1.5 text-sm rounded-lg"
                          />
                          <button type="button" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors" onClick={()=>{ setReplyTo(''); setReplyText(''); }}>
                            Reply
                          </button>
                          {showEmojiPicker && (
                            <div ref={emojiReplyRef} className="absolute left-0 top-full mt-1 z-20" onClick={(e)=>e.stopPropagation()}>
                              <EmojiPicker onSelect={(em)=>{ setReplyText(t => (t ? t + ' ' : '') + em); setShowEmojiPicker(false); }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
    )
  );
}
