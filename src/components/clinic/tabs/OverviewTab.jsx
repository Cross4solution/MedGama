import React from 'react';
import { CheckCircle, Shield, Users } from 'lucide-react';

export default function OverviewTab({ aboutTitle, aboutP1, aboutP2, accreditations = [], accreditationDocs = [] }) {
  const defaultAccreditations = [
    { icon: CheckCircle, label: 'JCI Accredited', color: 'blue' },
    { icon: Shield, label: 'ISO 9001', color: 'green' },
    { icon: Users, label: 'Health Tourism', color: 'orange' }
  ];

  const items = (Array.isArray(accreditations) && accreditations.length > 0)
    ? accreditations.map((label) => ({ icon: CheckCircle, label, color: 'teal' }))
    : defaultAccreditations;

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
        {items.map((item, idx) => (
          <div key={idx} className={`flex items-center space-x-3 p-4 bg-${item.color}-50 rounded-lg`}>
            <item.icon className={`w-6 h-6 text-${item.color}-600`} />
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>

      {Array.isArray(accreditationDocs) && accreditationDocs.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-gray-900">Accreditation Documents</h4>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accreditationDocs.map((d, idx) => (
              <a
                key={d?.id || d?.url || `accdoc-${idx}`}
                href={d?.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border bg-white hover:bg-gray-50"
              >
                <div className="text-sm font-medium text-gray-900 truncate">{d?.name || 'Document'}</div>
                <div className="text-xs text-[#1C6A83] mt-1">View</div>
              </a>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
