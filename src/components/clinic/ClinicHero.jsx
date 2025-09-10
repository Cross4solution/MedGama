import React from 'react';
import { MapPin, Star, Heart, Plus } from 'lucide-react';

export default function ClinicHero({
  image,
  name,
  location,
  rating,
  reviews,
  badgeNode,
  isFavorite,
  onToggleFavorite,
  onFollow,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div className="relative h-64 md:h-80">
        <img 
          src={image}
          alt={`${name} - Modern clinic environment`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 flex items-center bg-white rounded-full px-3 py-1 shadow-md">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
          <span className="font-semibold">{rating}</span>
          <span className="text-gray-600 text-sm ml-1">({reviews})</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{location}</span>
            </div>
            {badgeNode && <div className="flex items-center">{badgeNode}</div>}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onToggleFavorite}
              className={`p-3 rounded-full transition-colors ${
                isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
              }`}
              aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button onClick={onFollow} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Follow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
