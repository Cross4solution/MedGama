import React from 'react';
import { MapPin, Star, Heart, Minus, Edit3 } from 'lucide-react';

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
  onImageClick,
  medstreamUrl,
  onEditMedstream,
  followerCount,
  likeCount,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 mt-6">
      <div
        className={`relative h-64 md:h-80 ${onImageClick ? 'cursor-pointer group' : ''}`}
        onClick={onImageClick}
      >
        <img
          src={image}
          alt={`${name} - Modern clinic environment`}
          className="w-full h-full object-cover group-hover:brightness-95 transition"
        />
        <div className="absolute top-4 right-4 flex items-center bg-white rounded-full px-3 py-1 shadow-md">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
          <span className="font-semibold">{rating}</span>
          <span className="text-gray-600 text-sm ml-1">({reviews})</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            {(typeof followerCount === 'number' || typeof likeCount === 'number') && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-3">
                {typeof followerCount === 'number' && followerCount > 0 && (
                  <span>
                    <span className="font-semibold">{followerCount.toLocaleString('en-US')}</span>{' '}
                    followers
                  </span>
                )}
                {typeof likeCount === 'number' && likeCount > 0 && (
                  <span>
                    <span className="font-semibold">{likeCount.toLocaleString('en-US')}</span>{' '}
                    likes
                  </span>
                )}
              </div>
            )}
            {medstreamUrl && (
              <div className="mt-1 flex items-center text-gray-700 text-sm">
                <img
                  src="/images/icon/link.svg"
                  alt="MedStream link"
                  className="w-5 h-5 mr-2 flex-shrink-0"
                />
                <a
                  href={medstreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-medium"
                >
                  {medstreamUrl}
                </a>
              </div>
            )}
            {badgeNode && <div className="flex items-center">{badgeNode}</div>}
          </div>
          <div className="flex items-center justify-end sm:justify-start space-x-2 flex-shrink-0">
            <button
              onClick={onToggleFavorite}
              className={`p-2 sm:p-3 rounded-full transition-colors ${
                isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
              }`}
              aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onToggleFollow || onFollow}
              className={`${isFollowing
                ? 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'} border px-3 py-2 sm:px-3 sm:py-1 rounded-xl transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 shadow-sm hover:shadow-md w-28 sm:w-24`}
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
    </div>
  );
}
