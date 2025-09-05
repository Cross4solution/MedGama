import React, { useEffect, useRef, useState } from 'react';
import { Image, Users, Smile, MapPin, ImagePlay, X, ChevronDown } from 'lucide-react';

export default function PostCreateModal({ open, onClose, user, onPost }) {
  const [text, setText] = useState('');
  const dialogRef = useRef(null);

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
    }
  }, [open]);

  if (!open) return null;

  const avatar = '/images/portrait-candid-male-doctor_720.jpg';
  const displayName = user?.name || 'Guest';

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
                <button className="inline-flex items-center gap-1 text-xs text-gray-600 border px-2 py-1 rounded-md hover:bg-gray-50">
                  Friends <ChevronDown className="w-3.5 h-3.5" />
                </button>
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
              className="w-full text-[17px] leading-7 placeholder:text-gray-400 text-gray-900 outline-none resize-y min-h-[140px]"
            />
          </div>

          {/* Add to your post */}
          <div className="px-4 sm:px-5 pt-2 pb-4">
            <div className="rounded-xl border bg-white">
              <div className="px-4 py-3 text-sm text-gray-600 border-b">Add to your post</div>
              <div className="flex items-center gap-3 px-3 py-2">
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Image className="w-5 h-5 text-emerald-600" /> Photo/video
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Users className="w-5 h-5 text-sky-600" /> Tag people
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Smile className="w-5 h-5 text-amber-500" /> Feeling/activity
                </button>
                <button className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <MapPin className="w-5 h-5 text-rose-500" /> Check in
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <ImagePlay className="w-5 h-5 text-teal-600" /> GIF
                </button>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
