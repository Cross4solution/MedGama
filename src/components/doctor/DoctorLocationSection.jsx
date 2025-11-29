import React from 'react';
import LeafletMap from 'components/map/LeafletMap';
import { MapPin } from 'lucide-react';

export default function DoctorLocationSection({ locationAddress }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Location</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin className="w-5 h-5 mt-0.5 text-teal-600" />
          <span>{locationAddress}</span>
        </div>
        <div className="rounded-xl overflow-hidden border shadow-sm">
          <LeafletMap address={locationAddress} height="320px" zoom={15} />
        </div>
      </div>
    </div>
  );
}
