import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, X, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import ShareMenu from '../components/ShareMenu';
import TimelineActionsRow from '../components/timeline/TimelineActionsRow';
import { useAuth } from '../context/AuthContext';

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

  // ExploreTimeline/TimelineCard üzerinden gelen state öncelikli
  const item = state?.item;

  // Image gallery state
  const mediaList = Array.isArray(item?.media) && item.media.length > 0 ? item.media : (item?.img ? [{ url: item.img }] : []);
  const [imgIndex, setImgIndex] = React.useState(0);
  const [heroHeightPx, setHeroHeightPx] = React.useState(0);
  const [heroOpacity, setHeroOpacity] = React.useState(1);
  const [heroShiftPx, setHeroShiftPx] = React.useState(0);
  const baseHeightRef = React.useRef(0);
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
      <div className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-[minmax(260px,1fr)_minmax(360px,560px)] overflow-y-hidden lg:overflow-y-visible overscroll-y-none touch-pan-y bg-white lg:bg-transparent">
        {/* Left: Image column */}
        <div className="flex flex-col bg-white lg:min-h-0">
          <div className="relative flex items-center justify-center bg-white overflow-hidden select-none sticky top-0 z-10 flex-shrink-0 lg:h-screen" style={{ height: heroHeightPx ? `${heroHeightPx}px` : undefined, transition: 'height 0.12s ease-out', opacity: heroOpacity, willChange: 'height' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
            <img 
              src={mediaList[imgIndex]?.url} 
              alt={item.title} 
              className="w-full h-full object-cover"
              onError={() => {
                // Image error handling - fallback div will be shown automatically
              }}
            />
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
        <div ref={containerRef} className="bg-white flex-1 relative z-0 px-4 pb-10 overflow-y-auto min-h-0 lg:h-full lg:overflow-y-auto" style={{ height: heroHeightPx ? `calc(100vh - ${heroHeightPx}px)` : undefined }}>
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3 sticky top-0 z-10 bg-white shadow-sm">
            <img src={item.actor?.avatarUrl || item.avatar || '/images/portrait-candid-male-doctor_720.jpg'} alt={item.title} className="w-10 h-10 rounded-full object-cover border" />
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 truncate" title={item.title}>{item.actor?.name || item.title}</h1>
              {item.specialty && (
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{item.specialty}</span>
                </div>
              )}
              {item.city && (
                <p className="text-xs text-gray-500">{item.city}</p>
              )}
            </div>
          </div>

          {/* Text */}
          <div className="p-4 bg-white mt-4 rounded-lg shadow-sm">
            <p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">{item.text}</p>
          </div>

          {/* Action bar (TimelineCard ile aynı görünüm) */}
          <div className="px-2 md:px-3 py-2 border-t mt-1 grid grid-cols-3 gap-1 md:gap-2 justify-items-center bg-white rounded-lg shadow-sm">
            <button
              type="button"
              className={`w-full max-w-[100px] md:min-w-[110px] inline-flex items-center justify-center gap-1 md:gap-2 py-2 px-2 md:px-3 rounded-full text-xs md:text-sm border border-transparent bg-white ${liked ? 'text-blue-600' : 'text-gray-700'} font-medium`}
              onClick={handleLike}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full ${liked ? 'bg-blue-100 ring-1 ring-blue-500' : ''}`}>
                {liked ? (
                  <ThumbsUp className="w-3 h-3 md:w-4 md:h-4" strokeWidth={2.8} stroke="#2563eb" fill="#ffffff" />
                ) : (
                  <ThumbsUp className="w-3 h-3 md:w-4 md:h-4 text-gray-600" strokeWidth={1.9} fill="none" />
                )}
              </span>
              <span className={`font-medium`}>Like</span>
            </button>
            <button
              type="button"
              className={`w-full max-w-[100px] md:min-w-[110px] inline-flex items-center justify-center gap-1 md:gap-2 py-2 px-2 md:px-3 rounded-full text-xs md:text-sm border border-transparent bg-white text-gray-800 font-medium`}
              onClick={(e) => { e?.stopPropagation?.(); /* inert on PostDetail */ }}
            >
              <img src="/images/icon/comment-alt-lines-svgrepo-com.svg" alt="Yorum" className="w-4 h-4 md:w-5 md:h-5" />
              <span className="whitespace-nowrap">Comments</span>
            </button>
            <ShareMenu title="Share" url={shareUrl} showNative={false} buttonClassName="w-full max-w-[100px] md:min-w-[110px] text-gray-600 font-medium text-xs md:text-sm" />
          </div>

          {/* Comments (default open) */}
          {showComments && (
            <div className="p-4 bg-white mt-4 rounded-lg shadow-sm relative min-h-0 transform-gpu overflow-x-hidden">
              {/* New comment input */}
              <div className="flex items-start gap-2 mb-4">
                <img src={item.actor?.avatarUrl || '/images/portrait-candid-male-doctor_720.jpg'} alt="Your avatar" className="w-8 h-8 rounded-full object-cover border" />
                <div className="flex-1 border rounded-full px-3 py-2 flex items-center gap-2 bg-white border-gray-200">
                  <input 
                    placeholder="Write a comment…" 
                    className="flex-1 outline-none text-sm bg-transparent"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                        console.log('New comment:', newComment);
                        setNewComment('');
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (newComment.trim()) {
                        console.log('New comment:', newComment);
                        setNewComment('');
                      }
                    }}
                    disabled={!newComment.trim()}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      newComment.trim() 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Threaded comments */}
              <div className="mt-4 space-y-4 text-sm">
                {/* Parent */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Zehra Korkmaz" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Zehra Korkmaz</span>
                      <span className="text-[11px] text-gray-500">1 week</span>
                    </div>
                    <p className="text-gray-800 mt-0.5">Very informative, thanks.</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <button type="button" className="hover:text-gray-700" onClick={() => { setReplyTo(p => p === 'pd_c1' ? '' : 'pd_c1'); setReplyText(prev => (prev && replyTo==='pd_c1') ? prev : '@Zehra Korkmaz '); }}>Reply</button>
                      <span>1 reply</span>
                    </div>
                    {replyTo === 'pd_c1' && (
                      <div className="mt-2">
                        <div className="border rounded-xl p-1.5 flex items-center gap-2 w-full max-w-full min-w-0">
                          <button type="button" className="p-2 text-gray-600" aria-label="Emoji">
                            <img src="/images/icon/smile-circle-svgrepo-com.svg" alt="emoji" className="w-6 h-6" />
                          </button>
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e)=>setReplyText(e.target.value)}
                            placeholder="Yanıtınızı yazın..."
                            className="flex-1 min-w-0 outline-none px-2 py-2 text-[14px]"
                          />
                          <button type="button" className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700" onClick={()=>{ setReplyTo(''); setReplyText(''); }}>
                            Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reply */}
                    <div className="mt-3 pl-4 border-l">
                      <div className="flex items-start gap-3">
                        <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Dr. Bora Eren" className="w-8 h-8 rounded-full object-cover border" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Dr. Bora Eren</span>
                            <span className="text-[11px] text-gray-500">1 week</span>
                          </div>
                          <p className="text-gray-800 mt-0.5"><span className="font-semibold">Zehra Korkmaz</span> glad it helped 🙏</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <button type="button" className="hover:text-gray-700">Reply</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Another parent */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Onur Demirtaş" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Onur Demirtaş</span>
                      <span className="text-[11px] text-gray-500">5 days</span>
                    </div>
                    <p className="text-gray-800 mt-0.5">Great update 👏</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <button type="button" className="hover:text-gray-700" onClick={() => { setReplyTo(p => p === 'pd_c2' ? '' : 'pd_c2'); setReplyText(prev => (prev && replyTo==='pd_c2') ? prev : '@Onur Demirtaş '); }}>Reply</button>
                    </div>
                    {replyTo === 'pd_c2' && (
                      <div className="mt-2">
                        <div className="border rounded-xl p-1.5 flex items-center gap-2 w-full max-w-full min-w-0">
                          <button type="button" className="p-2 text-gray-600" aria-label="Emoji">
                            <img src="/images/icon/smile-circle-svgrepo-com.svg" alt="emoji" className="w-6 h-6" />
                          </button>
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e)=>setReplyText(e.target.value)}
                            placeholder="Yanıtınızı yazın..."
                            className="flex-1 min-w-0 outline-none px-2 py-2 text-[14px]"
                          />
                          <button type="button" className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700" onClick={()=>{ setReplyTo(''); setReplyText(''); }}>
                            Reply
                          </button>
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
