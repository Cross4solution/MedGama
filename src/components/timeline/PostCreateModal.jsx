import React, { useEffect, useRef, useState } from 'react';
import { Image, Video, Smile, X, FileText, Send, Loader2 } from 'lucide-react';
import { medStreamAPI } from '../../lib/api';

export default function PostCreateModal({ open, onClose, user, onPost, initialAction = undefined, onResetInitialAction = undefined }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const dialogRef = useRef(null);
  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const [viewer, setViewer] = useState(null); // { type: 'photo'|'video', url: string }

  // Kategorilere ayrılmış emoji listesi
  const emojiCategories = {
    'Yüz İfadeleri': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
    'El İşaretleri': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
    'Kalp ve Duygular': ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💤', '💋', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊'],
    'Spor ve Oyunlar': ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩'],
    'Kutlama ve Parti': ['🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🧁', '🍾', '🥂', '🍻', '🥳', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩']
  };

  const [selectedCategory, setSelectedCategory] = useState('Yüz İfadeleri');

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setTimeout(() => dialogRef.current?.focus(), 0);
    } else {
      setText('');
      setShowEmoji(false);
      setPhotos([]);
      setVideos([]);
      // Cleanup URLs when modal closes
      try {
        photoUrls.forEach(u => URL.revokeObjectURL(u));
        videoUrls.forEach(u => URL.revokeObjectURL(u));
      } catch {}
      setPhotoUrls([]);
      setVideoUrls([]);
      setViewer(null);
    }
  }, [open]);

  // initialAction ile dışarıdan tetikleme: photo | video | emoji
  useEffect(() => {
    if (!open || !initialAction) return;
    if (initialAction === 'photo') {
      photoRef.current?.click();
    } else if (initialAction === 'video') {
      videoRef.current?.click();
    } else if (initialAction === 'emoji') {
      setShowEmoji(true);
    }
    onResetInitialAction?.();
  }, [open, initialAction, onResetInitialAction]);

  // Build preview URLs when selected files change
  useEffect(() => {
    try {
      // cleanup previous
      photoUrls.forEach(u => URL.revokeObjectURL(u));
    } catch {}
    const next = (photos || []).map(f => URL.createObjectURL(f));
    setPhotoUrls(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  useEffect(() => {
    try {
      videoUrls.forEach(u => URL.revokeObjectURL(u));
    } catch {}
    const next = (videos || []).map(f => URL.createObjectURL(f));
    setVideoUrls(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  const removePhotoAt = (idx) => {
    setPhotos(arr => arr.filter((_, i) => i !== idx));
  };
  const removeVideoAt = (idx) => {
    setVideos(arr => arr.filter((_, i) => i !== idx));
  };

  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  if (!open) return null;

  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const displayName = user?.name || 'Guest';
  const specialty = user?.specialty || user?.dept || 'Doctor';

  async function handlePost() {
    console.log('[PostCreateModal] handlePost called, posting:', posting, 'canPost:', text.trim() || photoUrls.length > 0 || videoUrls.length > 0);
    if (posting) return;
    setPosting(true);
    setPostError('');
    try {
      const hasVideo = videoUrls.length > 0;
      const hasPhoto = photoUrls.length > 0;
      const postType = hasVideo ? 'video' : hasPhoto ? 'image' : 'text';
      const mediaUrl = hasVideo ? videoUrls[0] : hasPhoto ? photoUrls[0] : undefined;
      const payload = {
        post_type: postType,
        content: text.trim() || undefined,
        ...(mediaUrl && !mediaUrl.startsWith('blob:') ? { media_url: mediaUrl } : {}),
      };
      console.log('[PostCreateModal] Creating post:', payload);
      const res = await medStreamAPI.createPost(payload);
      console.log('[PostCreateModal] Post created:', res);
      onPost?.(res?.post || res);
      // Success — close modal and reset
      setPosting(false);
      onClose?.();
      setText('');
      setPhotos([]);
      setVideos([]);
      setPhotoUrls([]);
      setVideoUrls([]);
    } catch (err) {
      console.error('[PostCreateModal] Post creation failed:', err?.response?.status, err?.response?.data || err?.message);
      let errorMsg = err?.response?.data?.message || err?.message || 'Upload failed. Please try again.';
      if (err?.response?.status === 413) {
        errorMsg = 'Your file exceeds the upload limit. Try compressing it or choosing a smaller file.';
      } else if (err?.response?.status === 422) {
        errorMsg = 'This file type is not supported. Please use JPG, PNG, MP4, PDF, or Office documents.';
      } else if (err?.message?.includes('Network')) {
        errorMsg = 'Connection lost. Please check your internet and try again.';
      }
      // Keep modal open — show error so user can fix and retry
      setPostError(errorMsg);
      setPosting(false);
    }
  }

  const hasMedia = photoUrls.length > 0 || videoUrls.length > 0;
  const canPost = text.trim() || hasMedia;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6 md:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create post"
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden mt-4 sm:mt-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
            <h3 className="text-sm font-bold text-gray-900">Create Post</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Author row */}
            <div className="px-5 pt-4">
              <div className="flex items-center gap-3">
                <img src={avatar} alt={displayName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-md" />
                <div>
                  <div className="text-[13px] font-bold text-gray-900">{displayName}</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/80 px-1.5 py-0.5 rounded-md">
                    {specialty}
                  </span>
                </div>
              </div>
            </div>

            {/* Textarea */}
            <div className="px-5 pt-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={hasMedia ? 3 : 5}
                placeholder={`What's on your mind, ${displayName}?`}
                className="w-full text-sm leading-6 placeholder:text-gray-400 text-gray-900 outline-none resize-none bg-transparent"
              />
            </div>

            {/* Media Preview Area */}
            {hasMedia && (
              <div className="px-5 pb-2">
                <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Attachments ({photoUrls.length + videoUrls.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => { setPhotos([]); setVideos([]); }}
                      className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Remove all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photoUrls.map((src, i) => (
                      <div key={`p${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200/60 shadow-sm bg-white">
                        <button type="button" onClick={() => setViewer({ type: 'photo', url: src })} className="absolute inset-0">
                          <img src={src} alt={`photo-${i+1}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => removePhotoAt(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent h-6 pointer-events-none" />
                        <span className="absolute bottom-1 left-1.5 text-[9px] font-medium text-white/90">
                          {photos[i]?.name?.slice(0, 12) || `Photo ${i+1}`}
                        </span>
                      </div>
                    ))}
                    {videoUrls.map((src, i) => (
                      <div key={`v${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200/60 shadow-sm bg-gray-900">
                        <button type="button" onClick={() => setViewer({ type: 'video', url: src })} className="absolute inset-0">
                          <video src={src} className="w-full h-full object-cover" muted playsInline />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove video"
                          onClick={() => removeVideoAt(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[9px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent h-6 pointer-events-none" />
                        <span className="absolute bottom-1 left-1.5 text-[9px] font-medium text-white/90">
                          {videos[i]?.name?.slice(0, 12) || `Video ${i+1}`}
                        </span>
                      </div>
                    ))}
                    {/* Add more button */}
                    <button
                      type="button"
                      onClick={() => photoRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 bg-white hover:bg-teal-50/30 flex flex-col items-center justify-center gap-1 transition-all duration-200 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                        <Image className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                      </div>
                      <span className="text-[9px] font-medium text-gray-400 group-hover:text-teal-600">Add</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e)=> {
                const newFiles = Array.from(e.target.files || []);
                setPhotos(prev => {
                  const merged = [...prev];
                  newFiles.forEach(f => {
                    if (!merged.some(p => p.name === f.name && p.size === f.size)) {
                      merged.push(f);
                    }
                  });
                  return merged;
                });
                try { e.target.value = ''; } catch {}
              }}
            />
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e)=> {
                const newFiles = Array.from(e.target.files || []);
                setVideos(prev => {
                  const merged = [...prev];
                  newFiles.forEach(f => {
                    if (!merged.some(p => p.name === f.name && p.size === f.size)) {
                      merged.push(f);
                    }
                  });
                  return merged;
                });
                try { e.target.value = ''; } catch {}
              }}
            />

            {/* Emoji picker */}
            {showEmoji && (
              <div className="px-5 pb-2">
                <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-100">
                    {Object.entries(emojiCategories).map(([category]) => {
                      const categoryIcons = {
                        'Yüz İfadeleri': '😀',
                        'El İşaretleri': '👋',
                        'Kalp ve Duygular': '❤️',
                        'Spor ve Oyunlar': '🏆',
                        'Kutlama ve Parti': '🎉'
                      };
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`flex-1 px-2 py-2 text-center transition-all duration-200 ${
                            selectedCategory === category
                              ? 'bg-teal-50 border-b-2 border-teal-500'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          title={category}
                        >
                          <div className="text-base">{categoryIcons[category]}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-2.5 max-h-[180px] overflow-y-auto">
                    <div className="grid grid-cols-8 gap-0.5">
                      {emojiCategories[selectedCategory]?.map((emoji, i) => (
                        <button
                          key={i}
                          type="button"
                          className="hover:bg-teal-50 rounded-lg p-1 text-center transition-colors"
                          onClick={() => {
                            setText(t => (t ? t + ' ' : '') + emoji);
                            setShowEmoji(false);
                          }}
                          title={emoji}
                        >
                          <span className="text-lg">{emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar: attachment buttons + post */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50/60 to-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button onClick={()=>photoRef.current?.click()} className="p-2 rounded-xl hover:bg-emerald-50 transition-colors group" aria-label="Add photo" title="Photo">
                  <Image className="w-5 h-5 text-emerald-600" />
                </button>
                <button onClick={()=>videoRef.current?.click()} className="p-2 rounded-xl hover:bg-sky-50 transition-colors group" aria-label="Add video" title="Video">
                  <Video className="w-5 h-5 text-sky-600" />
                </button>
                <button onClick={()=>setShowEmoji((v)=>!v)} className={`p-2 rounded-xl transition-colors ${showEmoji ? 'bg-amber-50' : 'hover:bg-amber-50'}`} aria-label="Emoji" title="Emoji">
                  <Smile className="w-5 h-5 text-amber-600" />
                </button>
                <button className="p-2 rounded-xl hover:bg-violet-50 transition-colors group" aria-label="Research paper" title="Research Paper">
                  <FileText className="w-5 h-5 text-violet-600" />
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={!canPost || posting}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${canPost && !posting ? 'text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-200/50 hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
            {postError && !posting && (
              <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50/90 p-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-800">Upload failed</p>
                    <p className="text-[13px] text-red-600 mt-0.5 leading-relaxed">{postError}</p>
                  </div>
                  <button onClick={() => setPostError('')} className="w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen media viewer */}
      {viewer && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewer(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full">
              <button type="button" onClick={() => setViewer(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-10" aria-label="Close preview">
                <X className="w-4 h-4 text-gray-700" />
              </button>
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                {viewer.type === 'photo' ? (
                  <img src={viewer.url} alt="preview" className="w-full h-auto max-h-[80vh] object-contain" />
                ) : (
                  <video src={viewer.url} className="w-full h-auto max-h-[80vh]" controls autoPlay />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
