import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Share2, MoreHorizontal, X, Send, ThumbsUp, AlertTriangle, CheckCircle, ImageOff, FileText, Play, Download, Trash2, Bookmark, Loader2 } from 'lucide-react';
import ShareMenu from '../ShareMenu';
import EmojiPicker from '../EmojiPicker';
import { toEnglishTimestamp } from '../../utils/i18n';
import Modal from '../common/Modal';
import { medStreamAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const DEFAULT_AVATAR = '/images/default/default-avatar.svg';

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
    return null;
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

function NestedReply({ r, depth, authUser, replyTo, setReplyTo, replyText, setReplyText, submitReply, setDeleteCommentConfirm, topParentId }) {
  const avatarSize = depth >= 2 ? 'w-5 h-5' : 'w-6 h-6';
  const fontSize = depth >= 2 ? 'text-[11px]' : 'text-[12px]';
  const timeFontSize = depth >= 2 ? 'text-[9px]' : 'text-[10px]';
  return (
    <div>
      <div className="flex items-start gap-2">
        <AvatarImg src={r.avatar} alt={r.name} className={`${avatarSize} rounded-full object-cover flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`${fontSize} font-semibold text-[rgba(0,0,0,0.9)]`}>{r.name}</span>
            <span className={`${timeFontSize} text-gray-400 flex-shrink-0`}>{formatTimeAgo(r.time)}</span>
          </div>
          <p className={`${fontSize} text-[rgba(0,0,0,0.9)] leading-[1.43] mt-0.5`}>{r.text}</p>
          <div className="mt-1 flex items-center gap-2">
            {(r.author_id === authUser?.id || r.user_id === authUser?.id) && (
              <button type="button" className="text-[10px] font-semibold text-gray-400 hover:text-red-500 hover:underline transition-colors" onClick={(e) => {
                e.stopPropagation();
                setDeleteCommentConfirm({ id: r.id, isReply: true, parentId: topParentId });
              }}>Delete</button>
            )}
            {r.author_id !== authUser?.id && r.user_id !== authUser?.id && (
              <button type="button" className="text-[10px] font-semibold text-gray-500 hover:text-blue-600 hover:underline transition-colors" onClick={(e) => {
                e.stopPropagation();
                setReplyTo(p => p === r.id ? '' : r.id);
                setReplyText('');
              }}>Reply</button>
            )}
          </div>
          {/* Sub-replies (recursive) */}
          {Array.isArray(r.replies) && r.replies.length > 0 && (
            <div className="mt-1.5 ml-1 pl-2.5 border-l-2 border-gray-100 space-y-1.5">
              {r.replies.map((sub) => (
                <NestedReply
                  key={sub.id}
                  r={sub}
                  depth={depth + 1}
                  authUser={authUser}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  submitReply={submitReply}
                  setDeleteCommentConfirm={setDeleteCommentConfirm}
                  topParentId={topParentId}
                />
              ))}
            </div>
          )}
          {/* Reply input for this specific reply */}
          {replyTo === r.id && (
            <div className="mt-1.5 ml-1 pl-2.5 border-l-2 border-teal-200">
              <div className="flex items-center gap-2">
                <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitReply(e); }} placeholder="Write a reply..." className="flex-1 border border-gray-300 rounded-full px-3 py-1 text-[11px] outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all" onClick={(e) => e.stopPropagation()} />
                <button type="button" className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 px-2" onClick={submitReply}>Post</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getMediaType(m) {
  if (m.type === 'video' || /\.(mp4|webm|mov|avi)$/i.test(m.url || '')) return 'video';
  if (m.type === 'document' || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv)$/i.test(m.url || '') || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv)$/i.test(m.name || '')) return 'document';
  return 'image';
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

function toStreamUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const marker = '/storage/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const base = url.substring(0, idx);
  const storagePath = url.substring(idx + marker.length);
  return `${base}/api/media/stream/${storagePath}`;
}

function VideoPreview({ m, className }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const rawSrc = m.original || m.url;
  const videoSrc = toStreamUrl(rawSrc);

  const handlePlay = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setPlaying(true);
    setTimeout(() => videoRef.current?.play?.(), 50);
  };

  if (playing) {
    return (
      <div
        className="relative bg-black flex items-center justify-center aspect-video w-full"
        style={{ zIndex: 10, overflow: 'visible' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          autoPlay
          playsInline
          preload="auto"
          className="w-full h-full object-contain"
          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 11 }}
          poster={m.thumb || undefined}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onInput={(e) => e.stopPropagation()}
          onChange={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  const thumb = m.thumb;
  const hasThumb = thumb && !thumb.endsWith('.mp4') && !thumb.endsWith('.webm') && !thumb.endsWith('.mov');
  return (
    <div className="relative bg-black flex items-center justify-center cursor-pointer group aspect-video w-full" onClick={handlePlay}>
      {hasThumb ? (
        <img src={thumb} alt="Video" loading="lazy" className="w-full h-full object-contain" />
      ) : (
        <video
          src={videoSrc}
          muted
          preload="metadata"
          playsInline
          className="w-full h-full object-contain pointer-events-none"
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
  const avatarUrl = item.avatar || '/images/default/default-avatar.svg';
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const isGuest = !authUser;
  const [expanded, setExpanded] = useState(false);
  const [showCommentsPreview, setShowCommentsPreview] = useState(false);
  const [liked, setLiked] = useState(!!item?.is_liked);
  const [likeCount, setLikeCount] = useState(Number(item?.likes) || 0);
  const [commentCount, setCommentCount] = useState(Number(item?.comments) || 0);
  const [bookmarked, setBookmarked] = useState(!!item?.is_bookmarked);
  const [commentText, setCommentText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(''); // hangi yorumun altında yanıt alanı açık
  const [replyText, setReplyText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const moreMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const toastTimerRef = useRef(null);
  const [localComments, setLocalComments] = useState([]);
  const [apiComments, setApiComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [visibleCommentCount, setVisibleCommentCount] = useState(3);
  const [deleteCommentConfirm, setDeleteCommentConfirm] = useState(null); // { id, isReply, parentId }

  // Recursive mapper for API comment data
  const mapApiComment = (c) => ({
    id: c.id,
    author_id: c.author_id || c.author?.id,
    name: c.author?.fullname || 'User',
    title: '',
    avatar: c.author?.avatar || '/images/default/default-avatar.svg',
    text: c.content || '',
    time: c.created_at || '',
    parent_id: c.parent_id || null,
    replies: (c.replies || []).map(mapApiComment),
  });
  // Recursive count of all comments in tree
  const countTree = (comments) => comments.reduce((sum, c) => sum + 1 + countTree(c.replies || []), 0);

  // Fetch comments from API when comment section opens
  useEffect(() => {
    if (!showCommentsPreview || commentsLoaded || !item?.id) return;
    medStreamAPI.comments(item.id, { per_page: 50 }).then(res => {
      const list = res?.data || [];
      const mapped = list.map(mapApiComment);
      setApiComments(mapped);
      setCommentCount(countTree(mapped));
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

  // Recursive helper: add a reply under the correct parent at any depth
  const addReplyToTree = (comments, parentId, newReply) => {
    return comments.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      if (Array.isArray(c.replies) && c.replies.length > 0) {
        return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
      }
      return c;
    });
  };
  // Recursive helper: update a reply's fields by tempId at any depth
  const updateReplyInTree = (comments, tempId, updates) => {
    return comments.map(c => {
      if (c.id === tempId) return { ...c, ...updates };
      if (Array.isArray(c.replies) && c.replies.length > 0) {
        return { ...c, replies: updateReplyInTree(c.replies, tempId, updates) };
      }
      return c;
    });
  };
  // Recursive helper: remove a reply by tempId at any depth
  const removeReplyFromTree = (comments, tempId) => {
    return comments.map(c => {
      if (Array.isArray(c.replies)) {
        const filtered = c.replies.filter(r => r.id !== tempId);
        return { ...c, replies: removeReplyFromTree(filtered, tempId) };
      }
      return c;
    });
  };

  const submitReply = (e) => {
    e?.stopPropagation?.();
    const text = replyText.trim();
    const parentId = replyTo;
    if (!text) { setReplyTo(''); setReplyText(''); return; }
    const tempId = 'reply-' + Date.now();
    const newReply = {
      id: tempId,
      author_id: authUser?.id,
      name: authUser?.name || 'You',
      title: '',
      avatar: authUser?.avatar || '/images/default/default-avatar.svg',
      text,
      time: 'Just now',
      parent_id: parentId,
      replies: [],
    };
    // Add reply nested under parent at any depth
    setApiComments(prev => addReplyToTree(prev, parentId, newReply));
    setLocalComments(prev => addReplyToTree(prev, parentId, newReply));
    setCommentCount(c => c + 1);
    setReplyTo('');
    setReplyText('');
    // Fire API call with parent_id — replace temp ID on success, rollback on failure
    if (item?.id) {
      medStreamAPI.createComment(item.id, { content: text, parent_id: parentId }).then((res) => {
        const saved = res?.data || res;
        if (saved?.id) {
          const updates = { id: saved.id, author_id: saved.author_id || saved.author?.id || authUser?.id, time: saved.created_at || 'Just now' };
          setApiComments(prev => updateReplyInTree(prev, tempId, updates));
          setLocalComments(prev => updateReplyInTree(prev, tempId, updates));
        }
      }).catch((err) => {
        setApiComments(prev => removeReplyFromTree(prev, tempId));
        setLocalComments(prev => removeReplyFromTree(prev, tempId));
        setCommentCount(c => Math.max(0, c - 1));
        const msg = err?.message || err?.data?.message || 'Failed to post reply';
        console.error('[MedStream] Reply failed:', err?.status, msg, err);
        showSuccessToast(msg);
      });
    }
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
  const actorName = item?.actor?.name || item?.title || 'MedaGama';
  const actorTitle = item?.actor?.title || item?.subtitle || 'Healthcare';
  const actorAvatar = item?.actor?.avatarUrl || avatarUrl;
  const timeAgo = item?.timeAgo || '1 gün';
  const timeLabel = toEnglishTimestamp(timeAgo);
  const socialContext = item?.socialContext || (item?.likes ? `${Math.max(1, item.likes % 7)} kişi beğendi` : '');
  const media = Array.isArray(item?.media) && item.media.length > 0 ? item.media : [];
  const actorLink = (() => {
    const actorId = item?.actor?.id;
    const actorRole = item?.actor?.role;
    // If the post author is the current user, go to /profile
    if (authUser?.id && actorId === authUser.id) return '/profile';
    // Doctors have a public profile page
    if (actorRole === 'doctor') return `/doctor/${encodeURIComponent(actorId || 'unknown')}`;
    // Clinics
    if (actorRole === 'clinic' || actorRole === 'clinicOwner') return `/clinic/${encodeURIComponent(actorId || 'unknown')}`;
    // Other roles (patient etc.) — no public profile page exists
    return null;
  })();
  const titleLink = item?.specialty ? `/clinics?specialty=${encodeURIComponent(item.specialty)}` : actorLink;

  const shareUrl = (() => {
    try {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      return `${origin}/post/${encodeURIComponent(item?.id || '')}`;
    } catch {
      return `/post/${encodeURIComponent(item?.id || '')}`;
    }
  })();

  const goToPost = (e, mediaIndex) => {
    e?.stopPropagation?.();
    try {
      sessionStorage.setItem('lastPostId', String(item.id));
      sessionStorage.setItem('returnScroll', String(window.scrollY || 0));
    } catch {}
    navigate(`/post/${encodeURIComponent(item.id)}`, { state: { item, mediaIndex: mediaIndex || 0, prevScroll: (typeof window !== 'undefined' ? window.scrollY : 0) } });
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

  const loginRequiredMsg = t('auth.loginRequiredMessage', 'You need to sign in to perform this action.');

  const likedRef = useRef(!!item?.is_liked);
  const handleLike = React.useCallback((e) => {
    e?.stopPropagation?.();
    if (disabledActions) return;
    if (isGuest) { showSuccessToast(loginRequiredMsg); return; }
    const prev = likedRef.current;
    const next = !prev;
    likedRef.current = next;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (item?.id) {
      medStreamAPI.toggleLike(item.id).then((res) => {
        // Sync with server response
        const serverLiked = res?.liked ?? next;
        likedRef.current = serverLiked;
        setLiked(serverLiked);
        // Sync count from server if available
        if (res?.like_count !== undefined) setLikeCount(Number(res.like_count));
      }).catch((err) => {
        console.warn('Like failed:', err?.message || err);
        likedRef.current = prev;
        setLiked(prev);
        setLikeCount((c) => Math.max(0, c + (prev ? 1 : -1)));
      });
    }
  }, [disabledActions, isGuest, loginRequiredMsg, item?.id]);

  const bookmarkedRef = useRef(!!item?.is_bookmarked);
  const handleBookmark = React.useCallback((e) => {
    e?.stopPropagation?.();
    if (disabledActions) return;
    if (isGuest) { showSuccessToast(loginRequiredMsg); return; }
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
  }, [disabledActions, isGuest, loginRequiredMsg, item?.id]);

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

  const handleDelete = async () => {
    if (!item?.id) return;
    setDeleting(true);
    try {
      await medStreamAPI.deletePost(item.id);
      setDeleted(true);
      setShowDeleteConfirm(false);
      showSuccessToast('Post deleted');
    } catch {
      showSuccessToast('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) return null;

  return (
    <article
      className={`group rounded-xl border border-gray-300/60 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {view === 'list' ? (
        <div className="flex flex-col">
          {/* Header */}
          <div className={`flex items-start justify-between ${headerPad}`}>
            <div className={`flex items-start ${headerGap} min-w-0`}>
              {actorLink ? (
                <Link to={actorLink} onClick={(e)=>e.stopPropagation()}>
                  <AvatarImg src={actorAvatar} alt={actorName} className={`${avatarSize} rounded-full object-cover border ${compact ? 'ring-1 ring-gray-100' : ''}`} />
                </Link>
              ) : (
                <AvatarImg src={actorAvatar} alt={actorName} className={`${avatarSize} rounded-full object-cover border ${compact ? 'ring-1 ring-gray-100' : ''}`} />
              )}
              <div className="min-w-0">
              {/* socialContext (e.g., liked by N) removed per design */}
              <div className="flex items-center gap-1">
                {actorLink ? (
                  <Link to={actorLink} onClick={(e)=>e.stopPropagation()} className={`${nameText} font-semibold text-gray-900 truncate hover:underline`} title={actorName}>{actorName}</Link>
                ) : (
                  <span className={`${nameText} font-semibold text-gray-900 truncate`} title={actorName}>{actorName}</span>
                )}
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
                    {authUser?.id && (item?.author_id === authUser.id || item?.actor?.id === authUser.id) && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 hover:bg-red-50 text-red-600 inline-flex items-center gap-2"
                        onClick={() => { setShowDeleteConfirm(true); setShowMoreMenu(false); }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="font-medium">Delete</span>
                      </button>
                    )}
                    {!(authUser?.id && (item?.author_id === authUser.id || item?.actor?.id === authUser.id)) && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 hover:bg-red-50 text-red-600 inline-flex items-center gap-2"
                        onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Report</span>
                      </button>
                    )}
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
                  {getMediaType(media[0]) === 'video' ? (
                    <div className="block w-full">
                      <MediaItem m={media[0]} alt={media[0].alt || actorName} className={`w-full ${singleImgMaxH} object-cover rounded-b-none`} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => goToPost(e, 0)}
                      className="block w-full text-left"
                    >
                      <MediaItem m={media[0]} alt={media[0].alt || actorName} className={`w-full ${singleImgMaxH} object-cover rounded-b-none`} />
                    </button>
                  )}
                </div>
              )}
              {media.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {media.slice(0,2).map((m, i) => (
                    getMediaType(m) === 'video' ? (
                      <div key={i} className="block w-full">
                        <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid2H} object-cover`} />
                      </div>
                    ) : (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => goToPost(e, i)}
                        className="block w-full text-left"
                      >
                        <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid2H} object-cover`} />
                      </button>
                    )
                  ))}
                </div>
              )}
              {media.length === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  {getMediaType(media[0]) === 'video' ? (
                    <div className="block w-full">
                      <MediaItem m={media[0]} alt={media[0].alt || actorName} className={`w-full ${grid3LeftH} object-cover col-span-1`} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => goToPost(e, 0)}
                      className="block w-full text-left"
                    >
                      <MediaItem m={media[0]} alt={media[0].alt || actorName} className={`w-full ${grid3LeftH} object-cover col-span-1`} />
                    </button>
                  )}
                  <div className="grid grid-rows-2 gap-2">
                    {media.slice(1,3).map((m, i) => (
                      getMediaType(m) === 'video' ? (
                        <div key={i} className="block w-full">
                          <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid3SmallH} object-cover`} />
                        </div>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => goToPost(e, i + 1)}
                          className="block w-full text-left"
                        >
                          <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid3SmallH} object-cover`} />
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
              {media.length >= 4 && (
                <div className="grid grid-cols-2 gap-2">
                  {media.slice(0,4).map((m, i) => (
                    <div key={i} className="relative">
                      {getMediaType(m) === 'video' ? (
                        <div className="block w-full">
                          <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid4H} object-cover`} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => goToPost(e, i)}
                          className="block w-full text-left"
                        >
                          <MediaItem m={m} alt={m.alt || actorName} className={`w-full ${grid4H} object-cover`} />
                        </button>
                      )}
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
              <span className="tabular-nums font-medium">{commentCount}</span> comments
            </button>
          </div>

          {/* Comments Preview */}
          {showCommentsPreview && (
            <div className="px-3 pb-3 mt-0 border-t border-gray-100 pt-2.5 relative min-h-0 transform-gpu overflow-x-hidden">
              {/* New comment input */}
              <div className="flex items-center gap-2">
                <AvatarImg src={authUser?.avatar || '/images/default/default-avatar.svg'} alt="Your avatar" className="w-6 h-6 rounded-full object-cover" />
                <div className="relative flex-1">
                  <input
                    placeholder={(disabledActions || isGuest) ? 'Sign in to comment…' : 'Add a comment…'}
                    className={`w-full border border-gray-300 rounded-full pl-3 ${commentText.trim() ? 'pr-[4.5rem]' : 'pr-9'} py-1.5 text-[13px] transition-all ${(disabledActions || isGuest) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-transparent hover:border-gray-400 focus:ring-1 focus:ring-gray-400 focus:border-gray-400'}`}
                    disabled={disabledActions || isGuest}
                    onFocus={() => { if (isGuest) showSuccessToast(loginRequiredMsg); }}
                    value={commentText}
                    onChange={(e)=>setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentText.trim() && item?.id) {
                        e.stopPropagation();
                        if (isGuest) { showSuccessToast(loginRequiredMsg); return; }
                        const newComment = commentText.trim();
                        const tempId = 'lc-' + Date.now();
                        setLocalComments(prev => [...prev, { id: tempId, author_id: authUser?.id, name: authUser?.name || 'You', title: '', avatar: authUser?.avatar || '/images/default/default-avatar.svg', text: newComment, time: 'Just now', parent_id: null, replies: [] }]);
                        setCommentCount(c => c + 1);
                        setVisibleCommentCount(v => v + 1);
                        setCommentText('');
                        medStreamAPI.createComment(item.id, { content: newComment }).then((res) => {
                          const saved = res?.data || res;
                          if (saved?.id) {
                            setLocalComments(prev => prev.map(c => c.id === tempId ? { ...c, id: saved.id, author_id: saved.author_id || saved.author?.id || authUser?.id, time: saved.created_at || 'Just now' } : c));
                          }
                        }).catch((err) => {
                          setLocalComments(prev => prev.filter(c => c.id !== tempId));
                          setCommentCount(c => Math.max(0, c - 1));
                          const msg = err?.message || err?.data?.message || 'Failed to post comment';
                          console.error('[MedStream] Comment failed:', err?.status, msg, err);
                          showSuccessToast(msg);
                        });
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
                          if (isGuest) { showSuccessToast(loginRequiredMsg); return; }
                          if (!commentText.trim() || !item?.id) return;
                          const newComment = commentText.trim();
                          const tempId = 'lc-' + Date.now();
                          setLocalComments(prev => [...prev, { id: tempId, author_id: authUser?.id, name: authUser?.name || 'You', title: '', avatar: authUser?.avatar || '/images/default/default-avatar.svg', text: newComment, time: 'Just now', parent_id: null, replies: [] }]);
                          setCommentCount(c => c + 1);
                          setVisibleCommentCount(v => v + 1);
                          setCommentText('');
                          medStreamAPI.createComment(item.id, { content: newComment }).then((res) => {
                            const saved = res?.data || res;
                            if (saved?.id) {
                              setLocalComments(prev => prev.map(c => c.id === tempId ? { ...c, id: saved.id, author_id: saved.author_id || saved.author?.id || authUser?.id, time: saved.created_at || 'Just now' } : c));
                            }
                          }).catch((err) => {
                            setLocalComments(prev => prev.filter(c => c.id !== tempId));
                            setCommentCount(c => Math.max(0, c - 1));
                            const msg = err?.message || err?.data?.message || 'Failed to post comment';
                            console.error('[MedStream] Comment failed:', err?.status, msg, err);
                            showSuccessToast(msg);
                          });
                        }}
                      >
                        <Send className="w-3 h-3" strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                  {showEmoji && !disabledActions && (
                    <div ref={emojiPickerRef} className="absolute left-0 bottom-full mb-1" style={{ zIndex: 9999 }}>
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
                          <div className="flex items-start gap-2 relative group/comment">
                            <AvatarImg src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-[13px] font-semibold text-[rgba(0,0,0,0.9)]">{c.name}</span>
                                  {c.title && <p className="text-[11px] text-[rgba(0,0,0,0.6)] leading-tight truncate">{c.title}</p>}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-[11px] text-gray-400">{formatTimeAgo(c.time)}</span>
                                  {(c.author_id === authUser?.id || c.user_id === authUser?.id) && (
                                    <button type="button" className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete" onClick={(e)=>{
                                      e.stopPropagation();
                                      setDeleteCommentConfirm({ id: c.id, isReply: false, parentId: null });
                                    }}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[13px] text-[rgba(0,0,0,0.9)] leading-[1.43] mt-1">{c.text}</p>
                              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
                                {c.author_id !== authUser?.id && c.user_id !== authUser?.id && (
                                  <button type="button" className="font-semibold hover:text-blue-600 hover:underline transition-colors" onClick={(e)=>{ e.stopPropagation(); setReplyTo(p => p === c.id ? '' : c.id); setReplyText(''); }}>Reply</button>
                                )}
                              </div>
                              {/* Nested replies — recursive */}
                              {Array.isArray(c.replies) && c.replies.length > 0 && (
                                <div className="mt-2 ml-2 pl-3 border-l-2 border-gray-100 space-y-2">
                                  {c.replies.map((r) => (
                                    <NestedReply
                                      key={r.id}
                                      r={r}
                                      depth={1}
                                      authUser={authUser}
                                      replyTo={replyTo}
                                      setReplyTo={setReplyTo}
                                      replyText={replyText}
                                      setReplyText={setReplyText}
                                      submitReply={submitReply}
                                      setDeleteCommentConfirm={setDeleteCommentConfirm}
                                      topParentId={c.id}
                                    />
                                  ))}
                                </div>
                              )}
                              {replyTo === c.id && (
                                <div className="mt-1.5 ml-2 pl-3 border-l-2 border-teal-200">
                                  <div className="flex items-center gap-2">
                                    <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitReply(e); }} placeholder="Write a reply..." className="flex-1 border border-gray-300 rounded-full px-3 py-1 text-[12px] outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all" onClick={(e) => e.stopPropagation()} />
                                    <button type="button" className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 px-2" onClick={submitReply}>Post</button>
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

          

          {/* Delete Comment Confirmation Dialog */}
          {deleteCommentConfirm && (
            <div className="mx-3 mb-2 rounded-xl border border-red-200 bg-red-50/80 p-3" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-semibold text-red-700 mb-2">Are you sure you want to delete this comment?</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const { id, isReply, parentId } = deleteCommentConfirm;
                    if (isReply && parentId) {
                      setApiComments(prev => prev.map(x => x.id === parentId ? { ...x, replies: (x.replies || []).filter(rr => rr.id !== id) } : x));
                      setLocalComments(prev => prev.map(x => x.id === parentId ? { ...x, replies: (x.replies || []).filter(rr => rr.id !== id) } : x));
                    } else {
                      setApiComments(prev => prev.filter(x => x.id !== id));
                      setLocalComments(prev => prev.filter(x => x.id !== id));
                      setCommentCount(cnt => Math.max(0, cnt - 1));
                    }
                    if (!String(id).startsWith('lc-') && !String(id).startsWith('reply-') && !String(id).startsWith('lr-')) {
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
                  onClick={(e) => { e.stopPropagation(); setDeleteCommentConfirm(null); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Video processing banner */}
          {item?.media_processing && (
            <div className="mx-3 mb-1 rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin flex-shrink-0" />
              <span className="text-xs font-medium text-sky-700">Video is being processed. It will appear shortly.</span>
            </div>
          )}

          {/* Action bar */}
          <div className="px-2 py-1 border-t border-gray-100 mt-1 grid grid-cols-4 gap-0.5 justify-items-center">
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
            <button
              type="button"
              className={`w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[13px] transition-all ${bookmarked ? 'text-amber-600 bg-amber-50/60 font-semibold' : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
              onClick={handleBookmark}
            >
              <Bookmark className="w-[15px] h-[15px]" strokeWidth={bookmarked ? 2.2 : 1.6} fill={bookmarked ? 'currentColor' : 'none'} />
              <span>Save</span>
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
          {/* Delete Confirmation Modal */}
          <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Post">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
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
