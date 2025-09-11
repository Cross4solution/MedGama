import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Share2, Bookmark, MoreHorizontal, X, Send, ThumbsUp, Repeat } from 'lucide-react';

export default function TimelineCard({ item, disabledActions, view = 'grid', onOpen = () => {} }) {
  const avatarUrl = item.avatar || '/images/portrait-candid-male-doctor_720.jpg';
  const [expanded, setExpanded] = useState(false);
  const [showCommentsPreview, setShowCommentsPreview] = useState(false);

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
  const visibility = item?.visibility || 'public';
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

  return (
    <article
      className={`group rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
    >
      {view === 'list' ? (
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between px-3 pt-3">
            <div className="flex items-start gap-3 min-w-0">
              <Link to={actorLink} onClick={(e)=>e.stopPropagation()}>
                <img src={actorAvatar} alt={actorName} className="w-12 h-12 rounded-full object-cover border" />
              </Link>
              <div className="min-w-0">
                {/* socialContext (e.g., liked by N) removed per design */}
                <div className="flex items-center gap-1">
                  <Link to={actorLink} onClick={(e)=>e.stopPropagation()} className="text-[15px] md:text-base font-semibold text-gray-900 truncate hover:underline" title={actorName}>{actorName}</Link>
                </div>
                <Link to={titleLink} onClick={(e)=>e.stopPropagation()} className="text-xs text-gray-500 truncate hover:underline">{actorTitle}</Link>
                <div className="text-[11px] text-gray-400">{timeAgo} • {visibility === 'public' ? 'Public' : 'Connections'}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <button type="button" className="p-2 rounded-full hover:bg-gray-100" aria-label="Daha fazla" onClick={(e)=>e.stopPropagation()}>
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-gray-100" aria-label="Gizle" onClick={(e)=>e.stopPropagation()}>
                <X className="w-5 h-5" />
              </button>
            </div>
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
                  <Link to={`/post/${encodeURIComponent(item.id)}`} state={{ item }} onClick={(e)=>e.stopPropagation()}>
                    <img src={media[0].url} alt={media[0].alt || actorName} loading="lazy" className="w-full max-h-[520px] object-cover rounded-b-none" />
                  </Link>
                </div>
              )}
              {media.length === 2 && (
                <div className="grid grid-cols-2 gap-1">
                  {media.slice(0,2).map((m, i) => (
                    <Link key={i} to={`/post/${encodeURIComponent(item.id)}`} state={{ item }} onClick={(e)=>e.stopPropagation()}>
                      <img src={m.url} alt={m.alt || actorName} loading="lazy" className="w-full h-[240px] object-cover" />
                    </Link>
                  ))}
                </div>
              )}
              {media.length === 3 && (
                <div className="grid grid-cols-2 gap-1">
                  <Link to={`/post/${encodeURIComponent(item.id)}`} state={{ item }} onClick={(e)=>e.stopPropagation()}>
                    <img src={media[0].url} alt={media[0].alt || actorName} loading="lazy" className="w-full h-[360px] object-cover col-span-1" />
                  </Link>
                  <div className="grid grid-rows-2 gap-1">
                    {media.slice(1,3).map((m, i) => (
                      <Link key={i} to={`/post/${encodeURIComponent(item.id)}`} state={{ item }} onClick={(e)=>e.stopPropagation()}>
                        <img src={m.url} alt={m.alt || actorName} loading="lazy" className="w-full h-[178px] object-cover" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {media.length >= 4 && (
                <div className="grid grid-cols-2 gap-1">
                  {media.slice(0,4).map((m, i) => (
                    <div key={i} className="relative">
                      <Link to={`/post/${encodeURIComponent(item.id)}`} state={{ item }} onClick={(e)=>e.stopPropagation()}>
                        <img src={m.url} alt={m.alt || actorName} loading="lazy" className="w-full h-[220px] object-cover" />
                      </Link>
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

          {/* Comments Preview */}
          {showCommentsPreview && (
            <div className="px-3 pb-3 mt-2 border-t pt-3 bg-white/80">
              {/* New comment input */}
              <div className="flex items-start gap-2 mt-1">
                <img src={actorAvatar} alt="Your avatar" className="w-8 h-8 rounded-full object-cover border" />
                <input
                  placeholder={disabledActions ? 'Sign in to comment…' : 'Write a comment…'}
                  className={`flex-1 border rounded-full px-3 py-2 text-sm ${disabledActions ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                  disabled={disabledActions}
                />
              </div>

              {/* Threaded comments (mock) */}
              <div className="mt-3 space-y-4">
                {/* Parent comment */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Ayça Karaman" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Dr. Cem Arslan</span>
                            <span className="text-[11px] text-gray-500">1 week</span>
                          </div>
                          <p className="text-[15px] text-blue-700 leading-6"><span className="font-semibold">Ayça Karaman</span> Thanks 🙏</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <button type="button" className="inline-flex items-center gap-1 hover:text-gray-700"><ThumbsUp className="w-3.5 h-3.5" /> Like</button>
                            <button type="button" className="hover:text-gray-700">Reply</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="button" className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>
                </div>

                {/* Another parent comment */}
                <div className="flex items-start gap-3">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Efe Yılmaz" className="w-9 h-9 rounded-full object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                  <button type="button" className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          {/* Social counts */}
          <div className="px-3 pt-2 mt-2 text-sm text-gray-500 flex items-center justify-between">
            <div className="inline-flex items-center gap-1">
              <span className="inline-flex -space-x-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white ring-2 ring-white">
                  <ThumbsUp className="w-3 h-3" />
                </span>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white ring-2 ring-white">
                  <Heart className="w-3 h-3" />
                </span>
              </span>
              <span className="ml-2">{item.likes}</span>
            </div>
            <div>
              <button type="button" className="text-gray-500 hover:underline" onClick={(e)=>{ e.stopPropagation(); setShowCommentsPreview(v=>!v); }}>
                {item.comments} yorum
              </button>
            </div>
          </div>

          {/* Action bar */}
          <div className="px-2 md:px-3 py-1.5 border-t mt-1 grid grid-cols-4">
            <button type="button" disabled={disabledActions} className={`inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`} onClick={(e)=>e.stopPropagation()}>
              <ThumbsUp className="w-4 h-4" /> <span>Like</span>
            </button>
            <button
              type="button"
              disabled={false}
              className={`inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm ${disabledActions ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={(e)=>{ e.stopPropagation(); setShowCommentsPreview(v=>!v); }}
            >
              <MessageCircle className="w-4 h-4" /> <span>Comment</span>
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={(e)=>e.stopPropagation()}>
              <Repeat className="w-4 h-4" /> <span>Share</span>
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={(e)=>e.stopPropagation()}>
              <Send className="w-4 h-4" /> <span>Send</span>
            </button>
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
              <img src={avatarUrl} alt={item.title} className="w-12 h-12 rounded-full object-cover border" />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate" title={item.title}>{item.title}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> {item.city}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-6 text-gray-800 line-clamp-3">{item.text}</p>
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
                <button type="button" aria-label="Share" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700" onClick={(e)=>e.stopPropagation()}>
                  <Share2 className="w-4 h-4" />
                </button>
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
