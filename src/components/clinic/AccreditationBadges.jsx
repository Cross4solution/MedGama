import React from 'react';
import { Award, Shield, Trophy, Leaf } from 'lucide-react';

/**
 * AccreditationBadges — Display accreditations as professional badges
 * Props:
 *   - accreditations: Array of accreditation objects
 *   - variant: 'compact' (small) | 'full' (detailed with descriptions)
 */
const iconMap = {
  award: Award,
  certificate: Shield,
  trophy: Trophy,
  leaf: Leaf,
  hospital: Shield,
  'check-circle': Shield,
};

export default function AccreditationBadges({ accreditations = [], variant = 'full' }) {
  if (!accreditations || accreditations.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {accreditations.map((acc) => {
          const IconComponent = iconMap[acc.icon] || Award;
          return (
            <div
              key={acc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full"
              title={acc.description}
            >
              <IconComponent className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">{acc.name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant with descriptions
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">Sertifikalar & Akreditasyonlar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accreditations.map((acc) => {
          const IconComponent = iconMap[acc.icon] || Award;
          return (
            <div
              key={acc.id}
              className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="flex-shrink-0 mt-0.5">
                <IconComponent className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-amber-900">{acc.name}</div>
                {acc.description && (
                  <div className="text-xs text-amber-700 mt-0.5 line-clamp-2">
                    {acc.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
