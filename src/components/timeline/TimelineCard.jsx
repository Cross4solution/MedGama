import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Share2, Bookmark, MoreHorizontal, X, Send, ThumbsUp, AlertTriangle, CheckCircle, ImageOff, FileText, Play, Download } from 'lucide-react';
import ShareMenu from '../ShareMenu';
import EmojiPicker from '../EmojiPicker';
import { toEnglishTimestamp } from '../../utils/i18n';
import Modal from '../common/Modal';
import { medStreamAPI } from '../../lib/api';

const DEFAULT_AVATAR = '/images/portrait-candid-male-doctor_720.jpg';

function AvatarImg({ src, alt, className }) {
  const [failed, setFailed] = React.useState(false);
  const imgSrc = failed || !src ? DEFAULT_AVATAR : src;
  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => { if (!failed) setFailed(true); }}
    />
  );
}

function MediaImg({ src, alt, className, onClick = undefined }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center`} onClick={onClick} role={onClick ? 'button' : undefined}>
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="w-12 h-12 rounded-full bg-gray-200/80 flex items-center justify-center">
            <ImageOff className="w-6 h-6" />
          </div>
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

function getMediaType(m) {
  if (m.type === 'video' || /\.(mp4|webm|mov|avi)$/i.test(m.url || '')) return 'video';
  if (m.type === 'document' || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv)$/i.test(m.url || '') || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv)$/i.test(m.name || '')) return 'document';
  return 'image';
}

function getFileExt(m) {
  const name = m.name || m.url || '';
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toUpperCase() : 'FILE';
}

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(str);
}

function getFileName(m) {
  if (m.name) return m.name;
  try {
    const raw = decodeURIComponent((m.url || '').split('/').pop().split('?')[0]);
    // If filename is a UUID (backend-generated), show a friendly name instead
    const nameWithoutExt = raw.replace(/\.[^.]+$/, '');
    if (isUUID(nameWithoutExt)) {
      const ext = getFileExt(m);
      return `Document.${ext.toLowerCase()}`;
    }
    return raw;
  } catch { return 'Document'; }
}

const EXT_COLORS = { PDF: 'bg-red-500', DOC: 'bg-blue-500', DOCX: 'bg-blue-500', XLS: 'bg-green-600', XLSX: 'bg-green-600', PPT: 'bg-orange-500', PPTX: 'bg-orange-500', CSV: 'bg-emerald-500' };

const EXT_TEXT_COLORS = { PDF: 'text-red-600', DOC: 'text-blue-600', DOCX: 'text-blue-600', XLS: 'text-green-700', XLSX: 'text-green-700', PPT: 'text-orange-600', PPTX: 'text-orange-600', CSV: 'text-emerald-600' };
const EXT_BG_LIGHT = { PDF: 'bg-red-50', DOC: 'bg-blue-50', DOCX: 'bg-blue-50', XLS: 'bg-green-50', XLSX: 'bg-green-50', PPT: 'bg-orange-50', PPTX: 'bg-orange-50', CSV: 'bg-emerald-50' };
const EXT_BORDER = { PDF: 'border-red-200', DOC: 'border-blue-200', DOCX: 'border-blue-200', XLS: 'border-green-200', XLSX: 'border-green-200', PPT: 'border-orange-200', PPTX: 'border-orange-200', CSV: 'border-emerald-200' };

function DocumentPreview({ m, className, onClick }) {
  const ext = getFileExt(m);
  const name = getFileName(m);
  const color = EXT_COLORS[ext] || 'bg-gray-500';
  const textColor = EXT_TEXT_COLORS[ext] || 'text-gray-600';
  const bgLight = EXT_BG_LIGHT[ext] || 'bg-gray-50';
  const borderColor = EXT_BORDER[ext] || 'border-gray-200';
  const fileUrl = m.url;

  const handleDownload = (e) => {
    e.stopPropagation();
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  return (
    <div className={`${className} flex items-center justify-center p-4`} onClick={onClick}>
      <div className={`w-full max-w-md rounded-xl border ${borderColor} ${bgLight} p-4 hover:shadow-md transition-all duration-200 cursor-pointer`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate" title={name}>{name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${textColor} ${bgLight} border ${borderColor}`}>{ext}</span>
              <span className="text-[11px] text-gray-400">Attachment</span>
            </div>
          </div>
          {fileUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all flex-shrink-0 shadow-sm"
              aria-label="Download file"
              title="Open file"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoPreview({ m, className, onClick }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const videoSrc = m.original || m.url;

  const handlePlay = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setPlaying(true);
    setTimeout(() => videoRef.current?.play?.(), 50);
  };

  if (playing) {
    return (
      <div className={`${className} relative bg-black flex items-center justify-center`}>
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain"
          poster={m.thumb || undefined}
        />
      </div>
    );
  }

  const thumb = m.thumb;
  const hasThumb = thumb && !thumb.endsWith('.mp4') && !thumb.endsWith('.webm') && !thumb.endsWith('.mov');
  return (
    <div className={`${className} relative bg-black flex items-center justify-center cursor-pointer group`} onClick={handlePlay}>
      {hasThumb ? (
        <img src={thumb} alt="Video" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <video
          src={videoSrc}
          muted
          preload="metadata"
          playsInline
          className="w-full h-full object-cover pointer-events-none"
          onLoadedData={(e) => { e.target.currentTime = 0.5; }}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}

function MediaItem({ m, alt, className, onClick = undefined }) {
  const type = getMediaType(m);
  if (type === 'document') return <DocumentPreview m={m} className={className} onClick={onClick} />;
  if (type === 'video') return <VideoPreview m={m} className={className} />;
  return <MediaImg src={m.url} alt={alt} className={className} onClick={onClick} />;
}

function TimelineCard({ item, disabledActions, view = 'grid', onOpen = () => {}, compact = false }) {
  const avatarUrl = item.avatar || '/images/portrait-candid-male-doctor_720.jpg';
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showCommentsPreview, setShowCommentsPreview] = useState(false);
  const [liked, setLiked] = useState(!!item?.is_liked);
  const [likeCount, setLikeCount] = useState(Number(item?.likes) || 0);
  const [bookmarked, setBookmarked] = useState(!!item?.is_bookmarked);
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
  const [localComments, setLocalComments] = useState([]);
  const [apiComments, setApiComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [visibleCommentCount, setVisibleCommentCount] = useState(3);

  // Fetch comments from API when comment section opens
  useEffect(() => {
    if (!showCommentsPreview || commentsLoaded || !item?.id) return;
    medStreamAPI.comments(item.id, { per_page: 50 }).then(res => {
      const list = res?.data || [];
      setApiComments(list.map(c => ({
        id: c.id,
        name: c.author?.fullname || 'User',
        title: '',
        avatar: c.author?.avatar || '/images/portrait-candid-male-doctor_720.jpg',
        text: c.content || '',
        time: c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
      })));
      setCommentsLoaded(true);
    }).catch(() => setCommentsLoaded(true));
  }, [showCommentsPreview, commentsLoaded, item?.id]);

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

  const submitReply = (e) => {
    e?.stopPropagation?.();
    const text = replyText.trim();
    if (!text) { setReplyTo(''); setReplyText(''); return; }
    const newComment = {
      id: 'reply-' + Date.now(),
      name: item?.actor?.name || 'You',
      title: item?.actor?.title || '',
      avatar: item?.actor?.avatarUrl || '/images/portrait-candid-male-doctor_720.jpg',
      text,
      time: 'Just now',
    };
    setLocalComments(prev => [...prev, newComment]);
    // Fire API call
    if (item?.id) {
      medStreamAPI.createComment(item.id, { content: text }).catch(() => {});
    }
    setReplyTo('');
    setReplyText('');
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
  const nameText = compact ? 'text-sm leading-5' : 'text-sm leading-5';
  const singleImgMaxH = compact ? 'max-h-[340px]' : 'max-h-[400px]';
  const grid2H = compact ? 'h-[168px]' : 'h-[200px]';
  const grid3LeftH = compact ? 'h-[280px]' : 'h-[300px]';
  const grid3SmallH = compact ? 'h-[136px]' : 'h-[164px]';
  const grid4H = compact ? 'h-[168px]' : 'h-[200px]';
  const headerPad = compact ? 'px-3 pt-2.5' : 'px-3 pt-3';
  const headerGap = compact ? 'gap-2' : 'gap-3';

  const likedRef = useRef(!!item?.is_liked);
  const handleLike = React.useCallback((e) => {
    e?.stopPropagation?.();
    if (disabledActions) return;
    const next = !likedRef.current;
    likedRef.current = next;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    // Fire API call (fire-and-forget)
    if (item?.id) {
      medStreamAPI.toggleLike(item.id).catch(() => {});
    }
  }, [disabledActions, item?.id]);

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
      className={`group rounded-lg border border-gray-200/80 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden`}
    >
      {view === 'list' ? (
        <div className="flex flex-col">
          {/* Header */}
          <div className={`flex items-start justify-between ${headerPad}`}>
            <div className={`flex items-start ${headerGap} min-w-0`}>
              <Link to={actorLink} onClick={(e)=>e.stopPropagation()}>
                <AvatarImg src={actorAvatar} alt={actorName} className={`${avatarSize} rounded-full object-cover border ${compact ? 'ring-1 ring-gray-100' : ''}`} />
              </Link>
              <div className="min-w-0">
              {/* socialContext (e.g., liked by N) removed per design */}
              <div className="flex items-center gap-1">
                <Link to={actorLink} onClick={(e)=>e.stopPropagation()} className={`${nameText} font-semibold text-gray-900 truncate hover:underline`} title={actorName}>{actorName}</Link>
              </div>
              <span className="block text-xs leading-4 text-[rgba(0,0,0,0.6)] font-normal break-words">
                {actorTitle}
              </span>
              </div>
            </div>
            {!compact && (
              <div ref={moreMenuRef} className="flex items-center gap-1 text-gray-500 relative">
                <span className="text-xs text-[rgba(0,0,0,0.6)]">{timeLabel}</span>
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
            <p className="text-sm leading-[1.43] text-[rgba(0,0,0,0.9)]">
              {displayText}
              {isTruncated && (
                <button
                  type="button"
                  className="ml-1 text-sm text-gray-500 hover:text-blue-600 font-semibold no-underline hover:underline"
                  onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                >
                  ...see more
                </button>
              )}
            </p>
            {expanded && (
              <button
                type="button"
                className="mt-1 text-xs text-gray-500 hover:text-blue-600 font-semibold no-underline hover:underline"
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
                    <MediaItem m={media[0]} alt={media[0].alt || actorName} className={`w-full ${singleImgMaxH} object-cover rounded-b-none`} />
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
                      <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid2H} object-cover`} />
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
                    <MediaItem m={media[0]} alt={media[0].alt || actorName} className={`w-full ${grid3LeftH} object-cover col-span-1`} />
                  </button>
                  <div className="grid grid-rows-2 gap-2">
                    {media.slice(1,3).map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={goToPost}
                        className="block w-full text-left"
                      >
                        <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid3SmallH} object-cover`} />
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
                        <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid4H} object-cover`} />
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
          <div className="px-3 pt-2 pb-2 mt-1 text-xs text-gray-500 flex items-center justify-between">
            <div className="inline-flex items-center gap-1">
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white`}>
                <ThumbsUp className="w-[9px] h-[9px]" />
              </span>
              <span className="tabular-nums font-medium">{likeCount}</span>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 hover:underline transition-colors"
              onClick={(e)=>{ e.stopPropagation(); setShowCommentsPreview(v=>!v); }}
            >
              <span className="tabular-nums font-medium">{item.comments}</span> comments
            </button>
          </div>

          {/* Comments Preview */}
          {showCommentsPreview && (
            <div className="px-3 pb-3 mt-0 border-t border-gray-100 pt-2.5 relative min-h-0 transform-gpu overflow-x-hidden">
              {/* New comment input */}
              <div className="flex items-center gap-2">
                <AvatarImg src={actorAvatar} alt="Your avatar" className="w-6 h-6 rounded-full object-cover" />
                <div className="relative flex-1">
                  <input
                    placeholder={disabledActions ? 'Sign in to comment…' : 'Add a comment…'}
                    className={`w-full border border-gray-300 rounded-full pl-3 ${commentText.trim() ? 'pr-[4.5rem]' : 'pr-9'} py-1.5 text-[13px] transition-all ${disabledActions ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-transparent hover:border-gray-400 focus:ring-1 focus:ring-gray-400 focus:border-gray-400'}`}
                    disabled={disabledActions}
                    value={commentText}
                    onChange={(e)=>setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentText.trim() && item?.id) {
                        e.stopPropagation();
                        const newComment = commentText.trim();
                        medStreamAPI.createComment(item.id, { content: newComment }).catch(() => {});
                        setLocalComments(prev => [...prev, { id: 'lc-' + Date.now(), name: actorName, title: actorTitle, avatar: actorAvatar, text: newComment, time: 'Just now' }]);
                        setCommentText('');
                        showSuccessToast('Comment posted');
                      }
                    }}
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={disabledActions ? 'Login to add emoji' : 'Add emoji'}
                      disabled={disabledActions}
                      className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                      onClick={(e)=>{ e.stopPropagation(); if (!disabledActions) setShowEmoji(v=>!v); }}
                    >
                      <img src="/images/icon/smile-circle-svgrepo-com.svg" alt="emoji" className="w-4 h-4 opacity-50" />
                    </button>
                    {commentText.trim() && (
                      <button
                        type="button"
                        className="p-1.5 rounded-full bg-teal-500/90 hover:bg-teal-600 text-white shadow-sm hover:shadow transition-all duration-200 animate-[fadeIn_0.15s_ease-out]"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!commentText.trim() || !item?.id) return;
                          const newComment = commentText.trim();
                          medStreamAPI.createComment(item.id, { content: newComment }).catch(() => {});
                          setLocalComments(prev => [...prev, { id: 'lc-' + Date.now(), name: actorName, title: actorTitle, avatar: actorAvatar, text: newComment, time: 'Just now' }]);
                          setCommentText('');
                          showSuccessToast('Comment posted');
                        }}
                      >
                        <Send className="w-3 h-3" strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                  {showEmoji && !disabledActions && (
                    <div ref={emojiPickerRef} className="absolute left-0 top-full mt-1 z-20">
                      <EmojiPicker
                        onSelect={(e)=>{ setCommentText(t => t + e); setShowEmoji(false); }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Comments from API + locally submitted */}
              <div className="mt-3 divide-y divide-gray-100">
                {!commentsLoaded && (
                  <div className="py-4 flex justify-center">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {(() => {
                  const allComments = [...apiComments, ...localComments];
                  const visibleComments = allComments.slice(0, visibleCommentCount);
                  const remainingCount = allComments.length - visibleCommentCount;
                  return (
                    <>
                      {visibleComments.map((c) => (
                        <div key={c.id} className="py-2.5">
                          <div className="flex items-start gap-2">
                            <AvatarImg src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-[13px] font-semibold text-[rgba(0,0,0,0.9)]">{c.name}</span>
                                  {c.title && <p className="text-[11px] text-[rgba(0,0,0,0.6)] leading-tight truncate">{c.title}</p>}
                                </div>
                                <span className="text-[11px] text-gray-400 flex-shrink-0">{c.time}</span>
                              </div>
                              <p className="text-[13px] text-[rgba(0,0,0,0.9)] leading-[1.43] mt-1">{c.text}</p>
                              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
                                <button type="button" className="font-semibold hover:text-blue-600 hover:underline transition-colors" onClick={(e)=>e.stopPropagation()}>Like</button>
                                <span className="text-gray-300 mx-0.5">·</span>
                                <button type="button" className="font-semibold hover:text-blue-600 hover:underline transition-colors" onClick={(e)=>e.stopPropagation()}>Reply</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <button
                          type="button"
                          className="w-full py-2.5 text-[13px] font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50/50 rounded-lg transition-colors"
                          onClick={(e) => { e.stopPropagation(); setVisibleCommentCount(prev => prev + 3); }}
                        >
                          Daha fazla yorum yükle ({remainingCount})
                        </button>
                      )}
                    </>
                  );
                })()}
                {commentsLoaded && apiComments.length === 0 && localComments.length === 0 && (
                  <p className="py-3 text-center text-xs text-gray-400">No comments yet. Be the first!</p>
                )}
              </div>
            </div>
          )}

          

          {/* Action bar */}
          <div className="px-2 py-1 border-t border-gray-100 mt-1 grid grid-cols-3 gap-0.5 justify-items-center">
            <button
              type="button"
              className={`w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[13px] transition-all ${liked ? 'text-teal-600 bg-teal-50/60 font-semibold' : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
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
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[13px] text-gray-600 hover:bg-gray-100 font-medium transition-all"
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
                    if (item?.id) {
                      medStreamAPI.reportPost(item.id, `${reportReason}${reportDesc ? ': ' + reportDesc : ''}`).catch(() => {});
                    }
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
              <AvatarImg src={avatarUrl} alt={item.title} className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover border`} />
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
                <button type="button" aria-label="Save" className={`p-1.5 rounded-full transition ${bookmarked ? 'text-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-100 hover:text-teal-600'}`} onClick={(e)=>{
                  e.stopPropagation();
                  if (!item?.id) return;
                  setBookmarked(b => !b);
                  medStreamAPI.toggleBookmark({ bookmarked_type: 'post', target_id: item.id }).catch(() => setBookmarked(b => !b));
                }}>
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
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
