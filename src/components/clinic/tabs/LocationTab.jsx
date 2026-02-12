import React from 'react';
import { MapPin } from 'lucide-react';
import LeafletMap from 'components/map/LeafletMap';

export default function LocationTab({ locationAddress }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Location</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>{locationAddress}</span>
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <LeafletMap address={locationAddress} height="320px" />
        </div>
      </div>
    </div>
  );
}
