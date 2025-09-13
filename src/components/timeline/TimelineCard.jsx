import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Share2, Bookmark, MoreHorizontal, X, Send, ThumbsUp } from 'lucide-react';
import ShareMenu from '../ShareMenu';
import { toEnglishTimestamp } from '../../utils/i18n';

export default function TimelineCard({ item, disabledActions, view = 'grid', onOpen = () => {}, compact = false }) {
  const avatarUrl = item.avatar || '/images/portrait-candid-male-doctor_720.jpg';
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showCommentsPreview, setShowCommentsPreview] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Number(item?.likes) || 0);
  const [commentText, setCommentText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const truncate = (text, max = 120) => {
    if (!text) return '';
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
  };

  const displayText = expanded ? item.text : truncate(item.text);
  const isTruncated = !expanded && item?.text && displayText !== item.text;
  // Derive LinkedIn-like actor/meta fields
  const actorName = item?.actor?.name || item?.title || 'MedGama';
  const actorTitle = item?.actor?.title || item?.subtitle || 'Healthcare';
  const actorAvatar = item?.actor?.avatarUrl || avatarUrl;
  const timeAgo = item?.timeAgo || '1 gün';
  const timeLabel = toEnglishTimestamp(timeAgo);
  const socialContext = item?.socialContext || (item?.likes ? `${Math.max(1, item.likes % 7)} kişi beğendi` : '');
  const media = Array.isArray(item?.media) && item.media.length > 0 ? item.media : (item?.img ? [{ url: item.img, alt: item.title }] : []);
  const actorLink = item?.actor?.role === 'doctor'
    ? `/doctor/${encodeURIComponent(item?.actor?.id || 'unknown')}`
    : item?.actor?.role === 'patient'
      ? `/patient/${encodeURIComponent(item?.actor?.id || 'unknown')}`
      : item?.actor?.role === 'clinic'
        ? `/clinic/${encodeURIComponent(item?.actor?.id || 'unknown')}`
        : (item?.type === 'clinic_update' ? '/clinic' : '/profile');
  const titleLink = item?.specialty ? `/clinics?specialty=${encodeURIComponent(item.specialty)}` : actorLink;

  const shareUrl = (() => {
    try {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      return `${origin}/post/${encodeURIComponent(item?.id || '')}`;
    } catch {
      return `/post/${encodeURIComponent(item?.id || '')}`;
    }
  })();

  // Compact mode helpers
  const avatarSize = compact ? 'w-10 h-10' : 'w-12 h-12';
  const nameText = compact ? 'text-sm md:text-[15px] leading-5' : 'text-[15px] md:text-base';
  const singleImgMaxH = compact ? 'max-h-[340px]' : 'max-h-[480px]';
  const grid2H = compact ? 'h-[168px]' : 'h-[220px]';
  const grid3LeftH = compact ? 'h-[280px]' : 'h-[330px]';
  const grid3SmallH = compact ? 'h-[136px]' : 'h-[164px]';
  const grid4H = compact ? 'h-[168px]' : 'h-[200px]';
  const headerPad = compact ? 'px-3 pt-2' : 'px-3 pt-3';
  const headerGap = compact ? 'gap-2' : 'gap-3';

  const handleLike = (e) => {
    e?.stopPropagation?.();
    if (disabledActions) return;
    setLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => c + (next ? 1 : -1));
      return next;
    });
  };

  const handleShareExternal = async (e) => {
    e?.stopPropagation?.();
    const url = (() => {
      try {
        const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
        return `${origin}/post/${encodeURIComponent(item?.id || '')}`;
      } catch {
        return `/post/${encodeURIComponent(item?.id || '')}`;
      }
    })();
    const title = item?.actor?.name || 'Update';
    const text = (item?.text || '').slice(0, 120);
    if (navigator?.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Link panoya kopyalandı');
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <article
      className={`group rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
    >
      {view === 'list' ? (
        <div className="flex flex-col">
          {/* Header */}
          <div className={`flex items-start justify-between ${headerPad}`}>
            <div className={`flex items-start ${headerGap} min-w-0`}>
              <Link to={actorLink} onClick={(e)=>e.stopPropagation()}>
                <img src={actorAvatar} alt={actorName} className={`${avatarSize} rounded-full object-cover border ${compact ? 'ring-1 ring-gray-100' : ''}`} />
              </Link>
              <div className="min-w-0">
              {/* socialContext (e.g., liked by N) removed per design */}
              <div className="flex items-center gap-1">
                <Link to={actorLink} onClick={(e)=>e.stopPropagation()} className={`${nameText} font-semibold text-gray-900 truncate hover:underline`} title={actorName}>{actorName}</Link>
              </div>
              <Link to={titleLink} onClick={(e)=>e.stopPropagation()} className={`truncate hover:underline ${compact ? 'text-[13px] leading-4 text-gray-600' : 'text-xs text-gray-500'}`}>{actorTitle}</Link>
              </div>
            </div>
            {!compact && (
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-[11px] text-gray-400 mr-1">{timeLabel}</span>
                <button type="button" className="p-2 rounded-full hover:bg-gray-100" aria-label="Daha fazla" onClick={(e)=>e.stopPropagation()}>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-gray-100" aria-label="Gizle" onClick={(e)=>e.stopPropagation()}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Text */}
          <div className="px-3 mt-1.5">
            <p className="text-[15px] leading-6 text-gray-800">
              {displayText}
              {isTruncated && (
                <button
                  type="button"
                  className="ml-1 text-sm text-gray-600 hover:text-teal-700 underline"
                  onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                >
                  …see more
                </button>
              )}
            </p>
            {expanded && (
              <button
                type="button"
                className="mt-1 text-xs text-gray-500 hover:text-teal-700 underline"
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              >
                see less
              </button>
            )}
          </div>

          {/* Media */}
          {media.length > 0 && (
            <div className="mt-2.5">
              {media.length === 1 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e)=>{ e.stopPropagation(); try { sessionStorage.setItem('returnScroll', String(window.scrollY || 0)); } catch {} navigate(`/post/${encodeURIComponent(item.id)}`, { state: { item, prevScroll: (typeof window !== 'undefined' ? window.scrollY : 0) } }); }}
                    className="block w-full text-left"
                  >
                    <img src={media[0].url} alt={media[0].alt || actorName} loading="lazy" className={`w-full ${singleImgMaxH} object-cover rounded-b-none`} />
                  </button>
                </div>
              )}
              {media.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {media.slice(0,2).map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e)=>{ e.stopPropagation(); try { sessionStorage.setItem('returnScroll', String(window.scrollY || 0)); } catch {} navigate(`/post/${encodeURIComponent(item.id)}`, { state: { item, prevScroll: (typeof window !== 'undefined' ? window.scrollY : 0) } }); }}
                      className="block w-full text-left"
                    >
                      <img src={m.url} alt={m.alt || actorName} loading="lazy" className={`w-full ${grid2H} object-cover`} />
                    </button>
                  ))}
                </div>
              )}
              {media.length === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e)=>{ e.stopPropagation(); try { sessionStorage.setItem('returnScroll', String(window.scrollY || 0)); } catch {} navigate(`/post/${encodeURIComponent(item.id)}`, { state: { item, prevScroll: (typeof window !== 'undefined' ? window.scrollY : 0) } }); }}
                    className="block w-full text-left"
                  >
                    <img src={media[0].url} alt={media[0].alt || actorName} loading="lazy" className={`w-full ${grid3LeftH} object-cover col-span-1`} />
                  </button>
                  <div className="grid grid-rows-2 gap-2">
                    {media.slice(1,3).map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e)=>{ e.stopPropagation(); try { sessionStorage.setItem('returnScroll', String(window.scrollY || 0)); } catch {} navigate(`/post/${encodeURIComponent(item.id)}`, { state: { item, prevScroll: (typeof window !== 'undefined' ? window.scrollY : 0) } }); }}
                        className="block w-full text-left"
                      >
                        <img src={m.url} alt={m.alt || actorName} loading="lazy" className={`w-full ${grid3SmallH} object-cover`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {media.length >= 4 && (
                <div className="grid grid-cols-2 gap-2">
                  {media.slice(0,4).map((m, i) => (
                    <div key={i} className="relative">
                      <button
                        type="button"
                        onClick={(e)=>{ e.stopPropagation(); try { sessionStorage.setItem('returnScroll', String(window.scrollY || 0)); } catch {} navigate(`/post/${encodeURIComponent(item.id)}`, { state: { item, prevScroll: (typeof window !== 'undefined' ? window.scrollY : 0) } }); }}
                        className="block w-full text-left"
                      >
                        <img src={m.url} alt={m.alt || actorName} loading="lazy" className={`w-full ${grid4H} object-cover`} />
                      </button>
                      {i === 3 && media.length > 4 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-2xl font-semibold">+{media.length - 3}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social counts (moved above comments preview to keep position stable) */}
          <div className="px-3 pt-2 mt-2 text-sm text-gray-500 flex items-center justify-between">
            <div className="inline-flex items-center gap-1">
              <span className="inline-flex -space-x-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#378fe9] text-white border-2 border-[#0a66c2]">
                  <img src="/images/icon/comment-alt-lines-svgrepo-com.svg" alt="Comments" className="w-3 h-3" />
                </span>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#f35369] text-white border-2 border-[#c41e3a]">
                  <ThumbsUp className="w-3 h-3" />
                </span>
              </span>
              <span className="ml-2">{likeCount}</span>
            </div>
            <div>
              <button type="button" className="text-gray-500 hover:underline" onClick={(e)=>{ e.stopPropagation(); setShowCommentsPreview(v=>!v); }}>
                {item.comments} yorum
              </button>
            </div>
          </div>

          {/* Comments Preview */}
          {showCommentsPreview && (
            <div className="px-3 pb-3 mt-2 border-t pt-3 bg-white/80">
              {/* New comment input */}
              <div className="flex items-start gap-2 mt-1">
                <img src={actorAvatar} alt="Your avatar" className="w-8 h-8 rounded-full object-cover border" />
                <div className="relative flex-1">
                  <input
                    placeholder={disabledActions ? 'Sign in to comment…' : 'Write a comment…'}
                    className={`w-full border rounded-full pl-10 pr-3 py-2 text-sm ${disabledActions ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                    disabled={disabledActions}
                    value={commentText}
                    onChange={(e)=>setCommentText(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={disabledActions ? 'Login to add emoji' : 'Add emoji'}
                    disabled={disabledActions}
                    className={`absolute left-1 top-1/2 -translate-y-1/2 p-2 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 hover:text-teal-700'}`}
                    onClick={(e)=>{ e.stopPropagation(); if (!disabledActions) setShowEmoji(v=>!v); }}
                  >
                    <img src="/images/icon/smile-circle-svgrepo-com.svg" alt="emoji" className="w-5 h-5" />
                  </button>
                  {showEmoji && !disabledActions && (
                    <div className="absolute left-0 top-full mt-1 z-10 bg-white border rounded-lg shadow-lg p-2 w-44">
                      <div className="grid grid-cols-6 gap-1 text-xl select-none">
                        {['😀','😂','😍','👍','👏','🎉','🙏','🔥','😎','🤔','😢','😮','❤️','💙','💯','✅','⭐','✨'].map((e,i)=> (
                          <button
                            key={i}
                            type="button"
                            className="hover:bg-gray-50 rounded"
                            onClick={(ev)=>{ ev.stopPropagation(); setCommentText(t=>t + e); setShowEmoji(false); }}
                          >{e}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Threaded comments (mock) */}
              <div className="mt-3 space-y-4">
                {/* Parent comment */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Ayça Karaman" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900">Ayça Karaman</span>
                      <span className="text-[11px] text-gray-500">1 week</span>
                    </div>
                    <p className="text-[15px] text-gray-800 leading-6">Congrats! 🎉</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <button type="button" className="inline-flex items-center gap-1 hover:text-gray-700"><ThumbsUp className="w-3.5 h-3.5" /> Like</button>
                      <button type="button" className="hover:text-gray-700">Reply</button>
                      <span>1 reply</span>
                    </div>

                    {/* Reply */}
                    <div className="mt-3 pl-4 border-l">
                      <div className="flex items-start gap-3">
                        <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Dr. Cem Arslan" className="w-8 h-8 rounded-full object-cover border" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-gray-900">Dr. Cem Arslan</span>
                            <span className="text-[11px] text-gray-500">1 week</span>
                          </div>
                          <p className="text-[15px] text-blue-700 leading-6"><span className="font-semibold">Ayça Karaman</span> Thanks 🙏</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <button type="button" className="inline-flex items-center gap-1 hover:text-gray-700"><ThumbsUp className="w-3.5 h-3.5" /> Like</button>
                            <button type="button" className="hover:text-gray-700">Reply</button>
                            <span>1 reply</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Another parent comment */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Efe Yılmaz" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900">Efe Yılmaz</span>
                      <span className="text-[11px] text-gray-500">1 week</span>
                    </div>
                    <p className="text-[15px] text-gray-800 leading-6">Well done 👏</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <button type="button" className="inline-flex items-center gap-1 hover:text-gray-700"><ThumbsUp className="w-3.5 h-3.5" /> Like</button>
                      <button type="button" className="hover:text-gray-700">Reply</button>
                      <span>1 reply</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          

          {/* Action bar */}
          <div className="px-2 md:px-3 py-1.5 border-t mt-1 grid grid-cols-3 gap-2 justify-items-center">
            <button
              type="button"
              disabled={disabledActions}
              className={`min-w-[110px] inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border shadow-sm ${disabledActions ? 'text-gray-300 border-gray-200 bg-white cursor-not-allowed' : (liked ? 'text-teal-700 border-teal-200 bg-teal-50' : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-50')}`}
              onClick={handleLike}
            >
              <ThumbsUp className="w-4 h-4" /> <span>{liked ? 'Liked' : 'Like'}</span>
            </button>
            <button
              type="button"
              disabled={disabledActions}
              className={`min-w-[110px] inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border shadow-sm ${disabledActions ? 'text-gray-300 border-gray-200 bg-white cursor-not-allowed' : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-50'}`}
              onClick={(e)=>{ e.stopPropagation(); setShowCommentsPreview(v=>!v); }}
            >
              <MessageCircle className="w-4 h-4" /> <span>Comment</span>
            </button>
            <ShareMenu title="Share" url={shareUrl} showNative={false} buttonClassName="min-w-[110px]" />
          </div>
        </div>
      ) : (
        <>
          <div className={`relative h-60 overflow-hidden`}>
            <img src={item.img} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {item.specialty}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <img src={avatarUrl} alt={item.title} className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover border`} />
              <div className="min-w-0">
                <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-lg'}`} title={item.title}>{item.title}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> {item.city}
                </p>
              </div>
            </div>
            <p className={`mt-3 leading-6 text-gray-800 line-clamp-3 ${compact ? 'text-[14px]' : 'text-[15px]'}`}>{item.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-500 text-xs">
                <span className="inline-flex items-center gap-1" aria-label="likes"><Heart className="w-4 h-4" />{item.likes}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                <span className="inline-flex items-center gap-1" aria-label="comments"><MessageCircle className="w-4 h-4" />{item.comments}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 shadow-sm">
                <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to like' : 'Like'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`} onClick={(e)=>e.stopPropagation()}>
                  <Heart className="w-4 h-4" />
                </button>
                <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to comment' : 'Comment'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`} onClick={(e)=>e.stopPropagation()}>
                  <MessageCircle className="w-4 h-4" />
                </button>
                <ShareMenu title="Share" url={shareUrl} showNative={false} />
                <button type="button" aria-label="Save" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700" onClick={(e)=>e.stopPropagation()}>
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
