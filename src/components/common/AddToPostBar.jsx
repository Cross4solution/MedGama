import React from 'react';
import { Image, Users, Smile, MapPin, ImagePlay } from 'lucide-react';

export default function AddToPostBar({ onPhoto, onTag, onFeeling, onCheckIn, onGif }) {
  return (
    <div className="rounded-xl border bg-white">
      <div className="px-4 py-3 text-sm text-gray-600 border-b">Add to your post</div>
      <div className="flex items-center gap-3 px-3 py-2">
        <button type="button" onClick={onPhoto} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <Image className="w-5 h-5 text-emerald-600" />
          <span>Photo/video</span>
        </button>
        <button type="button" onClick={onTag} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <Users className="w-5 h-5 text-sky-600" />
          <span>Tag people</span>
        </button>
        <button type="button" onClick={onFeeling} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <Smile className="w-5 h-5 text-amber-500" />
          <span>Feeling/activity</span>
        </button>
        <button type="button" onClick={onCheckIn} className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <MapPin className="w-5 h-5 text-rose-500" />
          <span>Check in</span>
        </button>
        <button type="button" onClick={onGif} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <ImagePlay className="w-5 h-5 text-teal-600" />
          <span>GIF</span>
        </button>
      </div>
    </div>
  );
}
