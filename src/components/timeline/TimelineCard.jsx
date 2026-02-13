import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Share2, Bookmark, MoreHorizontal, X, Send, ThumbsUp, AlertTriangle, CheckCircle, ImageOff } from 'lucide-react';
import ShareMenu from '../ShareMenu';
import EmojiPicker from '../EmojiPicker';
import { toEnglishTimestamp } from '../../utils/i18n';
import Modal from '../common/Modal';

function MediaImg({ src, alt, className, onClick = undefined }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`} onClick={onClick} role={onClick ? 'button' : undefined}>
        <div className="flex flex-col items-center gap-1.5 text-gray-300">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs font-medium">Image unavailable</span>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
      onClick={onClick}
    />
  );
}

function TimelineCard({ item, disabledActions, view = 'grid', onOpen = () => {}, compact = false }) {
  const avatarUrl = item.avatar || '/images/portrait-candid-male-doctor_720.jpg';
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showCommentsPreview, setShowCommentsPreview] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Number(item?.likes) || 0);
  const [commentText, setCommentText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(''); // hangi yorumun altında yanıt alanı açık
  const [replyText, setReplyText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const moreMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const toastTimerRef = useRef(null);

  // Dışarı tıklayınca "Daha fazla" menüsünü kapat
  useEffect(() => {
    if (!showMoreMenu) return;
    const onDocClick = (e) => {
      if (!moreMenuRef.current) return;
      if (!moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showMoreMenu]);

  useEffect(() => {
    if (!showEmoji) return;
    const onDocClick = (e) => {
      if (!emojiPickerRef.current) return;
      if (!emojiPickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showEmoji]);

  const showSuccessToast = (text) => {
    setToastText(text);
    setShowToast(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setShowToast(false), 3000);
  };

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

  const goToPost = (e) => {
    e?.stopPropagation?.();
    try {
      sessionStorage.setItem('lastPostId', String(item.id));
      sessionStorage.setItem('returnScroll', String(window.scrollY || 0));
    } catch {}
    navigate(`/post/${encodeURIComponent(item.id)}`, { state: { item, prevScroll: (typeof window !== 'undefined' ? window.scrollY : 0) } });
  };

  // Compact mode helpers
  const avatarSize = compact ? 'w-10 h-10' : 'w-12 h-12';
  const nameText = compact ? 'text-sm md:text-[15px] leading-5' : 'text-[15px] md:text-base';
  const singleImgMaxH = compact ? 'max-h-[340px]' : 'max-h-[480px]';
  const grid2H = compact ? 'h-[168px]' : 'h-[220px]';
  const grid3LeftH = compact ? 'h-[280px]' : 'h-[330px]';
  const grid3SmallH = compact ? 'h-[136px]' : 'h-[164px]';
  const grid4H = compact ? 'h-[168px]' : 'h-[200px]';
  const headerPad = compact ? 'px-3 pt-2.5' : 'px-3 pt-3';
  const headerGap = compact ? 'gap-2' : 'gap-3';

  const handleLike = React.useCallback((e) => {
    e?.stopPropagation?.();
    if (disabledActions) return;
    setLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => c + (next ? 1 : -1));
      return next;
    });
  }, [disabledActions]);

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
      className={`group rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
    >
      {view === 'list' ? (
        <div className="flex flex-col">
          {/* Header */}
          <div className={`flex items-start justify-between ${headerPad}`}>
            <div className={`flex items-start ${headerGap} min-w-0`}>
              <Link to={actorLink} onClick={(e)=>e.stopPropagation()}>
                <img src={actorAvatar} alt={actorName} loading="lazy" className={`${avatarSize} rounded-full object-cover border ${compact ? 'ring-1 ring-gray-100' : ''}`} />
              </Link>
              <div className="min-w-0">
              {/* socialContext (e.g., liked by N) removed per design */}
              <div className="flex items-center gap-1">
                <Link to={actorLink} onClick={(e)=>e.stopPropagation()} className={`${nameText} font-semibold text-gray-900 truncate hover:underline`} title={actorName}>{actorName}</Link>
              </div>
              <span
                className={`${compact ? 'block mt-0 pb-0.5 text-sm leading-6 text-gray-600 font-medium break-words' : 'block mt-0 pb-0.5 text-sm leading-6 text-gray-600 font-medium break-words'}`}
              >
                {actorTitle}
              </span>
              </div>
            </div>
            {!compact && (
              <div ref={moreMenuRef} className="flex items-center gap-1 text-gray-500 relative">
                <span className="text-[11px] text-gray-400">{timeLabel}</span>
                <button type="button" className="p-2 rounded-full hover:bg-gray-100" aria-label="More options" onClick={(e)=>{ e.stopPropagation(); setShowMoreMenu(v=>!v); }}>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-8 z-20 w-44 bg-white border rounded-lg shadow-md py-1 text-sm" onClick={(e)=>e.stopPropagation()}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 hover:bg-red-50 text-red-600 inline-flex items-center gap-2"
                      onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Report</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text */}
          <div className="px-3 mt-2">
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
                    onClick={goToPost}
                    className="block w-full text-left"
                  >
                    <MediaImg src={media[0].url} alt={media[0].alt || actorName} className={`w-full ${singleImgMaxH} object-cover rounded-b-none`} />
                  </button>
                </div>
              )}
              {media.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {media.slice(0,2).map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={goToPost}
                      className="block w-full text-left"
                    >
                      <MediaImg src={m.url} alt={m.alt || actorName} className={`w-full ${grid2H} object-cover`} />
                    </button>
                  ))}
                </div>
              )}
              {media.length === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={goToPost}
                    className="block w-full text-left"
                  >
                    <MediaImg src={media[0].url} alt={media[0].alt || actorName} className={`w-full ${grid3LeftH} object-cover col-span-1`} />
                  </button>
                  <div className="grid grid-rows-2 gap-2">
                    {media.slice(1,3).map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={goToPost}
                        className="block w-full text-left"
                      >
                        <MediaImg src={m.url} alt={m.alt || actorName} className={`w-full ${grid3SmallH} object-cover`} />
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
                        onClick={goToPost}
                        className="block w-full text-left"
                      >
                        <MediaImg src={m.url} alt={m.alt || actorName} className={`w-full ${grid4H} object-cover`} />
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

          {/* Social counts */}
          <div className="px-4 pt-2.5 mt-2 text-xs text-gray-500 flex items-center justify-between">
            <button type="button" onClick={handleLike} className="inline-flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full ${liked ? 'bg-blue-500' : 'bg-blue-500'} text-white`}>
                <ThumbsUp className="w-[10px] h-[10px]" />
              </span>
              <span className="tabular-nums font-medium">{likeCount}</span>
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e)=>{ e.stopPropagation(); setShowCommentsPreview(v=>!v); }}
            >
              <span className="tabular-nums font-medium">{item.comments}</span> comments
            </button>
          </div>

          {/* Comments Preview */}
          {showCommentsPreview && (
            <div className="px-4 pb-4 mt-0 border-t border-gray-100 pt-4 bg-gradient-to-b from-gray-50/80 to-gray-50/40 relative min-h-0 transform-gpu overflow-x-hidden">
              {/* New comment input */}
              <div className="flex items-start gap-2.5">
                <img src={actorAvatar} alt="Your avatar" loading="lazy" className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200" />
                <div className="relative flex-1">
                  <input
                    placeholder={disabledActions ? 'Sign in to comment…' : 'Write a comment…'}
                    className={`w-full border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm transition-all ${disabledActions ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400'}`}
                    disabled={disabledActions}
                    value={commentText}
                    onChange={(e)=>setCommentText(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={disabledActions ? 'Login to add emoji' : 'Add emoji'}
                    disabled={disabledActions}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                    onClick={(e)=>{ e.stopPropagation(); if (!disabledActions) setShowEmoji(v=>!v); }}
                  >
                    <img src="/images/icon/smile-circle-svgrepo-com.svg" alt="emoji" className="w-5 h-5 opacity-60" />
                  </button>
                  {showEmoji && !disabledActions && (
                    <div ref={emojiPickerRef} className="absolute left-0 top-full mt-1 z-20">
                      <EmojiPicker
                        onSelect={(e)=>{ setCommentText(t => t + e); setShowEmoji(false); }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Threaded comments (mock) */}
              <div className="mt-4 space-y-3">
                {/* Parent comment */}
                <div className="flex items-start gap-2.5">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Ayça Karaman" className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">Ayça Karaman</span>
                        <span className="text-[11px] text-gray-400">1 week</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">Congrats! 🎉</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400 pl-2">
                      <button type="button" className="font-medium hover:text-gray-600 transition-colors" onClick={(e)=>{ e.stopPropagation(); setReplyTo(prev => prev === 'c1' ? '' : 'c1'); setReplyText(prev => (prev && replyTo==='c1') ? prev : '@Ayça Karaman '); }}>Reply</button>
                      <span className="text-gray-300">·</span>
                      <span>1 reply</span>
                    </div>

                    {/* Reply */}
                    <div className="mt-2 ml-5 pl-4 border-l-2 border-gray-200/80">
                      <div className="flex items-start gap-2.5">
                        <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Dr. Cem Arslan" className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-gray-900">Dr. Cem Arslan</span>
                              <span className="text-[11px] text-gray-400">1 week</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed"><span className="font-semibold text-teal-600">@Ayça Karaman</span> Thanks 🙏</p>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400 pl-2">
                            <button type="button" className="font-medium hover:text-gray-600 transition-colors" onClick={(e)=>{ e.stopPropagation(); setReplyTo(prev => prev === 'c1r1' ? '' : 'c1r1'); setReplyText(prev => (prev && replyTo==='c1r1') ? prev : '@Dr. Cem Arslan '); }}>Reply</button>
                            <span className="text-gray-300">·</span>
                            <span>1 reply</span>
                          </div>
                        </div>
                      </div>
                      {replyTo === 'c1r1' && (
                        <div className="mt-2 ml-10">
                          <div className="border border-gray-200 rounded-xl p-1.5 flex items-center gap-2 bg-white">
                            <input
                              autoFocus
                              value={replyText}
                              onChange={(e)=>setReplyText(e.target.value)}
                              placeholder="Write your reply…"
                              className="flex-1 min-w-0 outline-none px-2.5 py-1.5 text-sm rounded-lg"
                            />
                            <button type="button" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors" onClick={(e)=>{ e.stopPropagation(); setReplyTo(''); setReplyText(''); }}>
                              Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {replyTo === 'c1' && (
                      <div className="mt-2">
                        <div className="border border-gray-200 rounded-xl p-1.5 flex items-center gap-2 bg-white">
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e)=>setReplyText(e.target.value)}
                            placeholder="Write your reply…"
                            className="flex-1 min-w-0 outline-none px-2.5 py-1.5 text-sm rounded-lg"
                          />
                          <button type="button" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors" onClick={(e)=>{ e.stopPropagation(); setReplyTo(''); setReplyText(''); }}>
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Another parent comment */}
                <div className="flex items-start gap-2.5">
                  <img src={'/images/portrait-candid-male-doctor_720.jpg'} alt="Efe Yılmaz" className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">Efe Yılmaz</span>
                        <span className="text-[11px] text-gray-400">1 week</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">Well done 👏</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400 pl-2">
                      <button type="button" className="font-medium hover:text-gray-600 transition-colors" onClick={(e)=>{ e.stopPropagation(); setReplyTo(prev => prev === 'c2' ? '' : 'c2'); setReplyText(prev => (prev && replyTo==='c2') ? prev : '@Efe Yılmaz '); }}>Reply</button>
                      <span className="text-gray-300">·</span>
                      <span>1 reply</span>
                    </div>
                    {replyTo === 'c2' && (
                      <div className="mt-2">
                        <div className="border border-gray-200 rounded-xl p-1.5 flex items-center gap-2 bg-white">
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e)=>setReplyText(e.target.value)}
                            placeholder="Write your reply…"
                            className="flex-1 min-w-0 outline-none px-2.5 py-1.5 text-sm rounded-lg"
                          />
                          <button type="button" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors" onClick={(e)=>{ e.stopPropagation(); setReplyTo(''); setReplyText(''); }}>
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

          

          {/* Action bar */}
          <div className="px-4 py-1.5 border-t border-gray-100 mt-2 grid grid-cols-3 gap-1 justify-items-center">
            <button
              type="button"
              className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] transition-all ${liked ? 'text-teal-600 bg-teal-50/60 font-semibold' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}
              onClick={handleLike}
            >
              {liked ? (
                <ThumbsUp className="w-[15px] h-[15px]" strokeWidth={2.2} />
              ) : (
                <ThumbsUp className="w-[15px] h-[15px]" strokeWidth={1.6} fill="none" />
              )}
              <span>Like</span>
            </button>
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] text-gray-500 hover:bg-gray-50 font-medium transition-all"
              onClick={(e)=>{ e.stopPropagation(); if (disabledActions) return; setShowCommentsPreview(v=>!v); }}
            >
              <MessageCircle className="w-[15px] h-[15px]" strokeWidth={1.6} />
              <span>Comment</span>
            </button>
            <ShareMenu title="Share" url={shareUrl} showNative={false} buttonClassName="w-full text-gray-600 font-medium text-sm" />
          </div>
          {/* Report Modal */}
          <Modal
            open={showReportModal}
            onClose={() => { setShowReportModal(false); }}
            title="Submit Report"
            footer={
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  disabled={!reportReason}
                  onClick={() => {
                    showSuccessToast('Report submitted');
                    setShowReportModal(false);
                    setReportReason('');
                    setReportDesc('');
                  }}
                >
                  Submit
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e)=>setReportReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  <option value="spam">Spam</option>
                  <option value="misleading">Misleading information</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description (optional)</label>
                <textarea
                  rows={3}
                  value={reportDesc}
                  onChange={(e)=>setReportDesc(e.target.value)}
                  placeholder="Briefly describe the issue..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none resize-none"
                />
              </div>
            </div>
          </Modal>
          {/* Toast */}
          {showToast && (
            <div className="fixed bottom-4 right-4 z-[110]">
              <div className="flex items-center gap-2 rounded-lg bg-gray-900/95 backdrop-blur text-white shadow-xl px-3.5 py-2.5 text-sm border border-white/10">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{toastText}</span>
              </div>
            </div>
          )}
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
              <img src={avatarUrl} alt={item.title} loading="lazy" className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover border`} />
              <div className="min-w-0">
                <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-base' : 'text-lg'}`} title={item.title}>{item.title}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> {item.city}
                </p>
              </div>
            </div>
            <p className={`mt-3 leading-6 text-gray-800 line-clamp-3 ${compact ? 'text-[14px]' : 'text-[15px]'}`}>{item.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-400 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium" aria-label="likes">
                  <span className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full bg-blue-500 text-white"><ThumbsUp className="w-[9px] h-[9px]" /></span>
                  {item.likes}
                </span>
                <span className="inline-block w-0.5 h-0.5 rounded-full bg-gray-300" />
                <span className="inline-flex items-center gap-1 font-medium" aria-label="comments"><MessageCircle className="w-3.5 h-3.5" />{item.comments}</span>
              </div>
              <div className="flex items-center gap-0.5 bg-gray-50 rounded-full p-0.5 shadow-sm">
                <button type="button" aria-label="Like" className="p-1.5 rounded-full transition text-gray-500 hover:bg-gray-100 hover:text-teal-600" onClick={(e)=>e.stopPropagation()}>
                  <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.6} fill="none" />
                </button>
                <button type="button" aria-label="Comment" className="p-1.5 rounded-full transition text-gray-500 hover:bg-gray-100 hover:text-teal-600" onClick={(e)=>e.stopPropagation()}>
                  <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.6} />
                </button>
                <ShareMenu title="Share" url={shareUrl} showNative={false} />
                <button type="button" aria-label="Save" className="p-1.5 rounded-full transition text-gray-500 hover:bg-gray-100 hover:text-teal-600" onClick={(e)=>e.stopPropagation()}>
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export default React.memo(TimelineCard, (prev, next) => {
  return prev.item?.id === next.item?.id
    && prev.view === next.view
    && prev.compact === next.compact
    && prev.disabledActions === next.disabledActions;
});
