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
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';

  // ExploreTimeline/TimelineCard üzerinden gelen state öncelikli
  const item = state?.item;

  // Image gallery state
  const mediaList = Array.isArray(item?.media) && item.media.length > 0 ? item.media : (item?.img ? [{ url: item.img }] : []);
  const [imgIndex, setImgIndex] = React.useState(0);
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
    <div className="fixed inset-0 bg-black/80 z-[90]">
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_minmax(360px,560px)]">
        {/* Left: Image viewer */}
        <div className="relative flex items-center justify-center bg-black min-h-[50vh] lg:min-h-[85vh]">
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
              className="max-h-[85vh] w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
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

        {/* Right: Content panel */}
        <div className="bg-white h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3">
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
          <div className="p-4">
            <p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap">{item.text}</p>
          </div>

          {/* Action bar (TimelineCard ile aynı görünüm) */}
          <div className="px-2 md:px-3 py-2 border-t mt-1 grid grid-cols-3 gap-1 md:gap-2 justify-items-center">
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
            <div className="p-4 relative min-h-0 transform-gpu">
              {/* New comment input */}
              <div className="flex items-start gap-2">
                <img src={item.actor?.avatarUrl || '/images/portrait-candid-male-doctor_720.jpg'} alt="Your avatar" className="w-8 h-8 rounded-full object-cover border" />
                <input placeholder="Write a comment…" className="flex-1 border rounded-full px-3 py-2 text-sm" />
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
                        <div className="border rounded-xl p-1.5 flex items-center gap-2 max-w-[520px]">
                          <button type="button" className="p-2 text-gray-600" aria-label="Emoji">
                            <img src="/images/icon/smile-circle-svgrepo-com.svg" alt="emoji" className="w-6 h-6" />
                          </button>
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e)=>setReplyText(e.target.value)}
                            placeholder="Yanıtınızı yazın..."
                            className="flex-1 outline-none px-2 py-1 text-[14px]"
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
                        <div className="border rounded-xl p-1.5 flex items-center gap-2 max-w-[520px]">
                          <button type="button" className="p-2 text-gray-600" aria-label="Emoji">
                            <img src="/images/icon/smile-circle-svgrepo-com.svg" alt="emoji" className="w-6 h-6" />
                          </button>
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e)=>setReplyText(e.target.value)}
                            placeholder="Yanıtınızı yazın..."
                            className="flex-1 outline-none px-2 py-1 text-[14px]"
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
