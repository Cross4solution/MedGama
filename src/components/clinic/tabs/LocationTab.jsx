import React from 'react';
import { MapPin } from 'lucide-react';
import MapboxMap from '../../map/MapboxMap';

export default function LocationTab({ locationAddress, latitude, longitude }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Location</h3>
      <div className="space-y-3">
        {locationAddress && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 text-teal-600 flex-shrink-0" />
            <span>{locationAddress}</span>
          </div>
        )}
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <MapboxMap 
            address={locationAddress} 
            lat={latitude ? parseFloat(latitude) : undefined}
            lng={longitude ? parseFloat(longitude) : undefined}
            height="320px" 
          />
        </div>
      </div>
    </div>
  );
}
