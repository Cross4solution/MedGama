import React, { useEffect, useRef, useState } from 'react';
import { Image, Video, Smile, X } from 'lucide-react';

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

  if (!open) return null;

  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const displayName = user?.name || 'Guest';
  const specialty = user?.specialty || user?.dept || 'Doctor';

  function handlePost() {
    const payload = { text, createdAt: new Date().toISOString(), author: user };
    onPost?.(payload);
    onClose?.();
    setText('');
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6 md:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create post"
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Create post</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Author row */}
          <div className="px-4 sm:px-5 pt-4">
            <div className="flex items-center gap-3">
              <img src={avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover border" />
              <div>
                <div className="text-sm font-medium text-gray-900">{displayName}</div>
                <span className="inline-flex items-center gap-1 text-xs text-teal-800 bg-teal-50 border border-teal-100 px-2 py-1 rounded-md">
                  {specialty}
                </span>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="px-4 sm:px-5 pt-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={`What's on your mind, ${displayName}?`}
              className="w-full text-[17px] leading-7 placeholder:text-gray-400 text-gray-900 outline-none resize-none min-h-[140px]"
            />
          </div>

          {/* Add to your post */}
          <div className="px-4 sm:px-5 pt-2 pb-4">
            <div className="rounded-2xl border bg-white">
              <div className="px-4 py-3 text-sm text-gray-600 border-b">Add to your post</div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Hidden file inputs */}
                  <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=> setPhotos(Array.from(e.target.files||[]))} />
                  <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={(e)=> setVideos(Array.from(e.target.files||[]))} />

                  <button onClick={()=>photoRef.current?.click()} className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add photo">
                    <span className="w-6 h-6 grid place-items-center rounded bg-emerald-50"><Image className="w-4 h-4 text-emerald-600" /></span>
                    <span className="text-sm">Photo</span>
                  </button>
                  <button onClick={()=>videoRef.current?.click()} className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add video">
                    <span className="w-6 h-6 grid place-items-center rounded bg-sky-50"><Video className="w-4 h-4 text-sky-600" /></span>
                    <span className="text-sm">Video</span>
                  </button>
                  <button onClick={()=>setShowEmoji((v)=>!v)} className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add emoji">
                    <span className="w-6 h-6 grid place-items-center rounded bg-amber-50"><Smile className="w-4 h-4 text-amber-500" /></span>
                    <span className="text-sm">Emoji</span>
                  </button>
                </div>
                {showEmoji && (
                  <div className="mt-3 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl shadow-lg w-full max-h-[300px] overflow-hidden">
                    {/* Kategori Tabları - İkonlarla */}
                    <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
                      {Object.entries(emojiCategories).map(([category, emojis]) => {
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
                                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                            title={category}
                          >
                            <div className="text-lg">{categoryIcons[category]}</div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Emoji Grid */}
                    <div className="p-3 max-h-[220px] overflow-y-auto">
                      <div className="grid grid-cols-6 gap-1">
                        {emojiCategories[selectedCategory]?.map((emoji, i) => (
                          <button 
                            key={i} 
                            type="button" 
                            className="hover:bg-blue-100 hover:scale-110 rounded-lg p-1 text-center transition-all duration-200 transform hover:shadow-md" 
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
                    
                    {/* Alt Bilgi */}
                    <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                      <p className="text-xs text-gray-500 text-center">
                        {emojiCategories[selectedCategory]?.length} emoji
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Post button */}
            <div className="mt-3">
              <button
                onClick={handlePost}
                disabled={!text.trim()}
                className={`w-full py-2.5 rounded-xl text-white font-medium ${text.trim() ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Post
              </button>
              {(photos.length>0 || videos.length>0) && (
                <div className="mt-2 text-xs text-gray-500">
                  {photos.length>0 && <span className="mr-3">{photos.length} photo selected</span>}
                  {videos.length>0 && <span>{videos.length} video selected</span>}
                </div>
              )}
              {(photoUrls.length>0 || videoUrls.length>0) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {photoUrls.map((src, i) => (
                    <div key={`p${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      <button type="button" onClick={() => setViewer({ type: 'photo', url: src })} className="absolute inset-0">
                        <img src={src} alt={`photo-${i+1}`} className="w-full h-full object-cover" />
                      </button>
                      <button type="button" aria-label="Remove photo" onClick={() => removePhotoAt(i)} className="absolute -top-1 -right-1 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 shadow">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {videoUrls.map((src, i) => (
                    <div key={`v${i}`} className="relative w-24 h-20 rounded-lg overflow-hidden border bg-black/5">
                      <button type="button" onClick={() => setViewer({ type: 'video', url: src })} className="absolute inset-0">
                        <video src={src} className="w-full h-full object-cover" muted playsInline />
                      </button>
                      <button type="button" aria-label="Remove video" onClick={() => removeVideoAt(i)} className="absolute -top-1 -right-1 bg-white/90 border border-gray-200 text-gray-600 rounded-full p-1 shadow">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {viewer && (
                <div className="fixed inset-0 z-[110]">
                  <div className="absolute inset-0 bg-black/60" onClick={() => setViewer(null)} />
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="relative max-w-3xl w-full">
                      <button type="button" onClick={() => setViewer(null)} className="absolute -top-3 -right-3 bg-white/90 border border-gray-200 rounded-full p-2 shadow" aria-label="Close preview">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="bg-black rounded-lg overflow-hidden">
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
          </div>
        </div>
      </div>
    </div>
  );
}
