import React from 'react';
import { CheckCircle, Shield, Award, Users } from 'lucide-react';

export default function OverviewTab({ aboutTitle, aboutP1, aboutP2 }) {
  const accreditations = [
    { icon: CheckCircle, label: 'JCI Accredited', bg: 'bg-blue-50', fg: 'text-blue-600' },
    { icon: Shield, label: 'ISO 9001', bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    { icon: Award, label: 'Ministry of Health', bg: 'bg-violet-50', fg: 'text-violet-600' },
    { icon: Users, label: 'Health Tourism', bg: 'bg-amber-50', fg: 'text-amber-600' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{aboutTitle}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3" style={{ whiteSpace: 'pre-line' }}>
          {aboutP1}
        </p>
        <p className="text-sm text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
          {aboutP2}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Accreditations</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {accreditations.map((item, idx) => (
            <div key={idx} className={`flex items-center gap-2.5 p-3 ${item.bg} rounded-xl border border-transparent`}>
              <item.icon className={`w-5 h-5 ${item.fg} flex-shrink-0`} />
              <span className="text-xs font-semibold text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
