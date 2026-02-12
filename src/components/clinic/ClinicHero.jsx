import React from 'react';
import { MapPin, Star, Heart, Minus } from 'lucide-react';

export default function ClinicHero({
  image,
  name,
  location,
  rating,
  reviews,
  badgeNode,
  isFavorite,
  onToggleFavorite,
  // Yeni: takip durumu ve toggler
  isFollowing,
  onToggleFollow,
  // Geriye dönük uyumluluk: onFollow hala gelebilir
  onFollow,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 mt-4">
      <div className="relative h-56 md:h-72">
        <img 
          src={image}
          alt={`${name} - Modern clinic environment`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute top-4 right-4 flex items-center bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-white/20">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
          <span className="font-bold text-sm text-gray-900">{rating}</span>
          <span className="text-gray-500 text-xs ml-1">({reviews})</span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">{name}</h1>
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
              <span className="truncate">{location}</span>
            </div>
            {badgeNode && <div className="flex items-center">{badgeNode}</div>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleFavorite}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                isFavorite ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
              }`}
              aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onToggleFollow || onFollow}
              className={`${isFollowing
                ? 'bg-white text-teal-700 border-teal-300 hover:bg-teal-50'
                : 'bg-teal-600 text-white hover:bg-teal-700 border-transparent'} border px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-semibold shadow-sm hover:shadow-md`}
              aria-label={isFollowing ? 'Unfollow' : 'Follow'}
            >
              {isFollowing ? (
                <>
                  <Minus className="w-4 h-4 flex-shrink-0" />
                  <span>Unfollow</span>
                </>
              ) : (
                <>
                  <img src="/images/icon/plus-svgrepo-com.svg" alt="Plus" className="w-4 h-4 flex-shrink-0 brightness-0 invert" />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
