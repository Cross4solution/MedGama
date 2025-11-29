import React from 'react';
import { CheckCircle, MapPin, Star, Minus } from 'lucide-react';

export default function DoctorHero({
  doctorName,
  doctorTitle,
  doctorLocation,
  heroImage,
  isFollowing,
  onToggleFollow,
  onOpenGallery,
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
      <img src={heroImage} alt={doctorName} className="w-full h-64 object-cover" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent cursor-pointer"
        onClick={onOpenGallery}
      />
      <div
        className="absolute bottom-0 left-0 right-0 p-6"
        onClick={onOpenGallery}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{doctorName}</h1>
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-lg text-blue-100 mb-2">{doctorTitle}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{doctorLocation}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>4.9 (342 reviews)</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow();
            }}
            className={`${isFollowing
              ? 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
              : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'} border px-3 py-2 sm:px-3 sm:py-1 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md w-28`}
            aria-label={isFollowing ? 'Unfollow' : 'Follow'}
          >
            {isFollowing ? (
              <>
                <Minus className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">Unfollow</span>
              </>
            ) : (
              <>
                <img src="/images/icon/plus-svgrepo-com.svg" alt="Plus" className="w-4 h-4 flex-shrink-0 brightness-0 invert" />
                <span className="text-sm whitespace-nowrap">Follow</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
