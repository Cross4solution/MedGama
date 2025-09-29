import React from 'react';
import { Heart, MapPin, Stethoscope, Clock } from 'lucide-react';
import Badge from 'components/Badge';

function Rating({ value, reviewCount }) {
  return (
    <div className="flex items-center gap-1">
      {/* Using a single star icon with value to match original UI */}
      <svg className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.401 8.168L12 18.896l-7.335 3.87 1.401-8.168L.132 9.211l8.2-1.193z"/></svg>
      <span className="font-semibold text-gray-900">{value}</span>
      {typeof reviewCount === 'number' && (
        <span className="text-sm text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
}

function FeaturePill({ label }) {
  const iconMap = {
    'Telehealth': <Stethoscope className="w-4 h-4" />,
    'Sağlık Turizmi': <MapPin className="w-4 h-4" />,
    'GDPR Uyumlu': <Clock className="w-4 h-4" />,
    'Pro Review': <Clock className="w-4 h-4" />,
    'ISO 9001': <Clock className="w-4 h-4" />,
    'Akademik': <Clock className="w-4 h-4" />,
    'Uzman Kadro': <Clock className="w-4 h-4" />,
    'SGK': <Clock className="w-4 h-4" />,
  };
  return (
    <div className="flex items-center space-x-1 text-sm text-gray-600">
      {iconMap[label] || <Clock className="w-4 h-4" />}
      <span>{label}</span>
    </div>
  );
}

function mapTagLabel(tag) {
  const map = {
    'SGK Anlaşmalı': 'Public Insurance',
    'SGK': 'Public Insurance',
  };
  return map[tag] || tag;
}

function getTagVariant(tag) {
  if (tag === 'Pro Review' || tag === 'PRO Review') return 'purple';
  if (tag === 'Telehealth') return 'blue';
  if (tag === 'SGK Anlaşmalı' || tag === 'Public Insurance' || tag === 'SGK') return 'green';
  return 'gray';
}

export default function ClinicCard({ clinic, isFavorite, onToggleFavorite, onView }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-56 h-48 md:h-auto relative">
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
            <div className="text-center">
              <Stethoscope className="w-16 h-16 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">{clinic.name}</p>
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite?.(clinic.id)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
            />
          </button>
        </div>

        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{clinic.name}</h3>
              <div className="flex items-center text-gray-600 mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{clinic.location}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Rating value={clinic.rating} reviewCount={clinic.reviewCount} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {(clinic.tags || []).map((tag, index) => (
              <Badge
                key={index}
                label={mapTagLabel(tag)}
                variant={getTagVariant(tag)}
                size="sm"
                rounded="full"
              />
            ))}
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{clinic.description}</p>

          <div className="flex flex-wrap gap-3 mb-3">
            {(clinic.features || []).map((feature, index) => (
              <FeaturePill key={index} label={feature} />
            ))}
          </div>

          <div className="flex items-center justify-end">
            <button onClick={() => onView?.(clinic)} className="bg-[#1C6A83] text-white px-4 py-2 rounded-xl hover:bg-[#155a6f] transition-all duration-200 shadow-sm hover:shadow-md">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
