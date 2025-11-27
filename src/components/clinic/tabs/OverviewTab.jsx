import React from 'react';
import { CheckCircle, Shield, Award, Users } from 'lucide-react';

export default function OverviewTab({ aboutTitle, aboutP1, aboutP2 }) {
  const accreditations = [
    { icon: CheckCircle, label: 'JCI Accredited', color: 'blue' },
    { icon: Shield, label: 'ISO 9001', color: 'green' },
    { icon: Award, label: 'Ministry of Health', color: 'purple' },
    { icon: Users, label: 'Health Tourism', color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{aboutTitle}</h3>
        <p className="text-gray-600 leading-relaxed mb-4" style={{ whiteSpace: 'pre-line' }}>
          {aboutP1}
        </p>
        <p className="text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
          {aboutP2}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {accreditations.map((item, idx) => (
          <div key={idx} className={`flex items-center space-x-3 p-4 bg-${item.color}-50 rounded-lg`}>
            <item.icon className={`w-6 h-6 text-${item.color}-600`} />
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
