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
              className="w-full text-[17px] leading-7 placeholder:text-gray-400 text-gray-900 outline-none resize-y min-h-[140px]"
            />
          </div>

          {/* Add to your post */}
          <div className="px-4 sm:px-5 pt-2 pb-4">
            <div className="rounded-2xl border bg-white">
              <div className="px-4 py-3 text-sm text-gray-600 border-b">Add to your post</div>
              <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add photo or video">
                    <span className="w-6 h-6 grid place-items-center rounded bg-emerald-50"><Image className="w-4 h-4 text-emerald-600" /></span>
                    <span className="text-sm">Photo/video</span>
                  </button>
                  <button className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Tag people">
                    <span className="w-6 h-6 grid place-items-center rounded bg-sky-50"><Users className="w-4 h-4 text-sky-600" /></span>
                    <span className="text-sm">Tag people</span>
                  </button>
                  <button className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add feeling or activity">
                    <span className="w-6 h-6 grid place-items-center rounded bg-amber-50"><Smile className="w-4 h-4 text-amber-500" /></span>
                    <span className="text-sm">Feeling/activity</span>
                  </button>
                  <button className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Check in">
                    <span className="w-6 h-6 grid place-items-center rounded bg-rose-50"><MapPin className="w-4 h-4 text-rose-500" /></span>
                    <span className="text-sm">Check in</span>
                  </button>
                  <button className="h-10 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 inline-flex items-center gap-2 text-gray-700" aria-label="Add GIF">
                    <span className="w-6 h-6 grid place-items-center rounded bg-teal-50"><ImagePlay className="w-4 h-4 text-teal-600" /></span>
                    <span className="text-sm">GIF</span>
                  </button>
                </div>
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
