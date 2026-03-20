import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { medStreamAPI } from '../../lib/api';
import SPECIALTIES from '../../data/specialties';
import {
  Stethoscope, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  Plus, Image, X, Send, Loader2, AlertTriangle, Flag, ChevronDown,
  Eye, EyeOff, Shield, Clock, TrendingUp, Filter, Search,
  ThumbsUp, UserPlus, UserCheck, Camera, FileText,
} from 'lucide-react';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

// ═══════════════════════════════════════════════════
// CreatePostModal
// ═══════════════════════════════════════════════════
const CreatePostModal = ({ open, onClose, onCreated, t }) => {
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [specialty, setSpecialty] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      setError('En fazla 5 fotoğraf yüklenebilir.');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim() && photos.length === 0) {
      setError('Lütfen bir içerik veya fotoğraf ekleyin.');
      return;
    }
    if (!gdprConsent) {
      setError('KVKK/GDPR onayını vermeniz gerekmektedir.');
      return;
    }
    setPosting(true);
    setError('');
    try {
      await medStreamAPI.createPost({
        content: content.trim(),
        post_type: photos.length > 0 ? 'image' : 'text',
        specialty_id: specialty || undefined,
        is_anonymous: isAnonymous,
        gdpr_consent: gdprConsent,
        photos,
        onProgress: setUploadProgress,
      });
      setContent('');
      setPhotos([]);
      setPreviews([]);
      setSpecialty('');
      setIsAnonymous(false);
      setGdprConsent(false);
      setUploadProgress(0);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Paylaşım oluşturulamadı.');
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-500" />
            {t('crm.medstream.newPost', 'Yeni Vaka Paylaşımı')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* GDPR Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">KVKK / GDPR Hatırlatması</p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                Paylaşımınızda hasta kişisel verisi (isim, TC, fotoğrafta yüz vb.) bulunmamalıdır. 
                Tıbbi görseller anonimleştirilmiş olmalıdır. KVKK Md. 6 ve GDPR Art. 9 kapsamında 
                sağlık verilerinin korunması zorunludur.
              </p>
            </div>
          </div>

          {/* Content */}
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Vaka açıklamanızı yazın... (tanı, bulgular, tedavi yaklaşımı)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none placeholder:text-gray-400"
            maxLength={5000}
          />
          <div className="text-right text-[10px] text-gray-400">{content.length}/5000</div>

          {/* Photo Upload */}
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors"
            >
              <Camera className="w-4 h-4" /> Fotoğraf Ekle (max 5)
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specialty Selector */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Uzmanlık Alanı</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              <option value="">Seçiniz (opsiyonel)</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            {/* Anonymous Toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${isAnonymous ? 'bg-violet-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mx-1 ${isAnonymous ? 'translate-x-4' : ''}`} />
              </div>
              <div className="flex items-center gap-1.5">
                {isAnonymous ? <EyeOff className="w-4 h-4 text-violet-500" /> : <Eye className="w-4 h-4 text-gray-400" />}
                <span className="text-sm text-gray-700">{isAnonymous ? 'Anonim Paylaşım' : 'İsimle Paylaş'}</span>
              </div>
            </label>

            {/* GDPR Consent Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Bu paylaşımda hasta kişisel verisi bulunmadığını ve KVKK/GDPR düzenlemelerine uygun olduğunu <strong className="text-gray-900">onaylıyorum</strong>.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Progress */}
          {posting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={posting || !gdprConsent}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Paylaş
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// ReportModal
// ═══════════════════════════════════════════════════
const REPORT_REASONS = [
  'Hasta bilgisi içeriyor',
  'Yanıltıcı tıbbi bilgi',
  'Spam / Reklam',
  'Uygunsuz içerik',
  'Telif hakkı ihlali',
];

const ReportModal = ({ open, onClose, postId, t }) => {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleReport = async () => {
    if (!reason) return;
    setSending(true);
    try {
      await medStreamAPI.reportPost(postId, reason);
      setDone(true);
      setTimeout(() => { onClose(); setDone(false); setReason(''); }, 1500);
    } catch { /* ignore */ }
    setSending(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" /> İçeriği Raporla
          </h3>
        </div>
        <div className="p-5 space-y-3">
          {done ? (
            <p className="text-sm text-emerald-600 font-medium text-center py-4">Raporunuz alındı. Teşekkürler.</p>
          ) : (
            REPORT_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="report" value={r} checked={reason === r} onChange={() => setReason(r)} className="text-red-500 focus:ring-red-400" />
                <span className="text-sm text-gray-700">{r}</span>
              </label>
            ))
          )}
        </div>
        {!done && (
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">İptal</button>
            <button onClick={handleReport} disabled={!reason || sending} className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5">
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />} Raporla
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// CommentSection
// ═══════════════════════════════════════════════════
const CommentSection = ({ postId, initialCount, t, isVerified = true }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medStreamAPI.comments(postId, { per_page: 20 });
      setComments(res?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [postId]);

  useEffect(() => { if (open) loadComments(); }, [open, loadComments]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await medStreamAPI.createComment(postId, { content: newComment.trim() });
      setNewComment('');
      loadComments();
    } catch { /* ignore */ }
    setSending(false);
  };

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-gray-500 hover:text-teal-600 transition-colors text-xs">
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">{initialCount || 0}</span>
      </button>

      {open && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Henüz yorum yok</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {c.author?.avatar ? (
                      <img src={resolveStorageUrl(c.author.avatar)} alt="" className="w-7 h-7 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
                    ) : (
                      <span className="text-[9px] font-bold text-gray-500">{c.author?.fullname?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px]"><strong className="text-gray-800">{c.author?.fullname || 'Anonymous'}</strong></p>
                    <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New comment input */}
          {isVerified ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Yorum yaz..."
                className="flex-1 h-9 px-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!newComment.trim() || sending}
                className="h-9 px-3 bg-teal-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
              >
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-amber-600 text-center py-1">{t('crm.verificationBanner.interactionLocked', 'Account verification required for interactions')}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PostCard
// ═══════════════════════════════════════════════════
const PostCard = ({ post, onLike, onBookmark, onReport, t, isVerified = true }) => {
  const author = post.author || {};
  const ec = post.engagement_counter || {};
  const media = Array.isArray(post.media) && post.media.length > 0 ? post.media : (post.media_url ? [{ url: post.media_url, type: 'image' }] : []);
  const specialty = post.specialty;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {author.avatar ? (
            <img src={resolveStorageUrl(author.avatar)} alt="" className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
          ) : (
            <span className="text-sm font-bold text-white">{post.is_anonymous ? '?' : (author.fullname?.[0] || '?')}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">
              {post.is_anonymous ? 'Anonymous Doctor' : (author.fullname || 'Doctor')}
            </p>
            {post.is_anonymous && <EyeOff className="w-3.5 h-3.5 text-violet-400" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{post.time_ago || 'just now'}</span>
            {specialty && (
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                {typeof specialty.name === 'object' ? (specialty.name.en || specialty.name.tr || specialty.code) : (specialty.name || specialty.code)}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => onReport?.(post.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-5 py-2">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Media */}
      {media.length > 0 && (
        <div className={`px-5 pb-2 ${media.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
          {media.slice(0, 4).map((m, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
              <img src={m.medium || m.original || m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              {i === 3 && media.length > 4 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+{media.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center gap-4 px-5 py-2 text-[11px] text-gray-400 border-t border-gray-50">
        <span>{ec.like_count || 0} beğeni</span>
        <span>{ec.comment_count || 0} yorum</span>
        <span>{post.view_count || 0} görüntülenme</span>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <div className="flex items-center gap-5">
          <button
            onClick={() => { if (!isVerified) return; onLike?.(post.id); }}
            disabled={!isVerified}
            title={!isVerified ? t('crm.verificationBanner.interactionLocked', 'Account verification required for interactions') : undefined}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${!isVerified ? 'text-gray-300 cursor-not-allowed' : post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
            {post.is_liked ? 'Beğenildi' : 'Beğen'}
          </button>

          <CommentSection postId={post.id} initialCount={ec.comment_count} t={t} isVerified={isVerified} />

          <button
            onClick={() => { if (!isVerified) return; onBookmark?.(post.id); }}
            disabled={!isVerified}
            title={!isVerified ? t('crm.verificationBanner.interactionLocked', 'Account verification required for interactions') : undefined}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${!isVerified ? 'text-gray-300 cursor-not-allowed' : post.is_bookmarked ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'}`}
          >
            <Bookmark className={`w-4 h-4 ${post.is_bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        <button onClick={() => onReport?.(post.id)} className="text-gray-400 hover:text-red-500 transition-colors">
          <Flag className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Main CRMMedStream Component
// ═══════════════════════════════════════════════════
const CRMMedStream = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState('feed'); // 'feed' | 'all' | 'my'
  const [feedSort, setFeedSort] = useState('recent'); // 'recent' | 'top'
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (reset) setPage(1);
    setLoading(true);
    try {
      const params = { per_page: 15, page: p, sort: feedSort };
      if (specialtyFilter) params.specialty_id = specialtyFilter;

      let res;
      if (feedMode === 'feed') {
        res = await medStreamAPI.feed(params);
      } else if (feedMode === 'my') {
        res = await medStreamAPI.posts({ ...params, author_id: user?.id });
      } else {
        res = await medStreamAPI.posts(params);
      }

      const list = res?.data || [];
      if (reset || p === 1) {
        setPosts(list);
      } else {
        setPosts(prev => [...prev, ...list]);
      }
      setHasMore(list.length >= 15);
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  }, [feedMode, feedSort, specialtyFilter, page, user?.id]);

  useEffect(() => { loadPosts(true); }, [feedMode, feedSort, specialtyFilter]);

  const handleLike = async (postId) => {
    try {
      const res = await medStreamAPI.toggleLike(postId);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        is_liked: res?.liked ?? !p.is_liked,
        engagement_counter: {
          ...p.engagement_counter,
          like_count: res?.like_count ?? (p.engagement_counter?.like_count || 0) + (p.is_liked ? -1 : 1),
        },
      } : p));
    } catch { /* ignore */ }
  };

  const handleBookmark = async (postId) => {
    try {
      const res = await medStreamAPI.toggleBookmark({ bookmarked_type: 'post', target_id: postId });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_bookmarked: res?.bookmarked ?? !p.is_bookmarked } : p));
    } catch { /* ignore */ }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadPosts(false);
  };

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-500" />
            MedStream
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.medstream.subtitle', 'Doktor vaka paylaşım ağı')}</p>
        </div>
        <button
          onClick={() => { if (user?.role_id === 'doctor' && !user?.is_verified) return; setShowCreateModal(true); }}
          disabled={user?.role_id === 'doctor' && !user?.is_verified}
          title={user?.role_id === 'doctor' && !user?.is_verified ? t('crm.verificationBanner.restrictedFeature', 'Verification required to use this feature') : undefined}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${user?.role_id === 'doctor' && !user?.is_verified ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
        >
          <Plus className="w-4 h-4" /> Yeni Paylaşım
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Feed Mode Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            {[
              { key: 'feed', label: 'Akışım', icon: TrendingUp },
              { key: 'all', label: 'Tümü', icon: Stethoscope },
              { key: 'my', label: 'Paylaşımlarım', icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFeedMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  feedMode === key ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Sort Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            {[
              { key: 'recent', label: t('crm.medstream.sortRecent', 'En Yeniler'), icon: Clock },
              { key: 'top', label: t('crm.medstream.sortTop', 'Popülerler'), icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setFeedSort(key); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  feedSort === key ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Specialty Filter */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="h-8 px-3 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            <option value="">Tüm Uzmanlıklar</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2.5 bg-gray-100 rounded w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-12 text-center">
            <Stethoscope className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">Henüz paylaşım yok</p>
            <p className="text-gray-300 text-xs mt-1">İlk vaka paylaşımını sen yap!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onReport={(id) => setReportPostId(id)}
                t={t}
                isVerified={!(user?.role_id === 'doctor' && !user?.is_verified)}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                  Daha Fazla Göster
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => loadPosts(true)}
        t={t}
      />

      {/* Report Modal */}
      <ReportModal
        open={!!reportPostId}
        onClose={() => setReportPostId(null)}
        postId={reportPostId}
        t={t}
      />
    </div>
  );
};

export default CRMMedStream;
