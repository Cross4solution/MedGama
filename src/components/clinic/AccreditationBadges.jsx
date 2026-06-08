import React from 'react';
import { Award, Shield, Trophy, Leaf, CheckCircle, Star } from 'lucide-react';

const iconMap = {
  award: Award,
  certificate: Shield,
  trophy: Trophy,
  leaf: Leaf,
  hospital: Shield,
  'check-circle': CheckCircle,
  star: Star,
};

// Color palette cycling for variety
const colorPalette = [
  { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', text: 'text-emerald-800' },
  { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', text: 'text-violet-800' },
  { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', text: 'text-amber-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', text: 'text-rose-800' },
  { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', text: 'text-teal-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', text: 'text-orange-800' },
];

export default function AccreditationBadges({ accreditations = [], variant = 'full' }) {
  if (!accreditations || accreditations.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {accreditations.map((acc, idx) => {
          const IconComponent = iconMap[acc.icon] || CheckCircle;
          const color = colorPalette[idx % colorPalette.length];
          return (
            <div
              key={acc.id}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${color.bg} border ${color.border} rounded-full`}
              title={acc.description}
            >
              <IconComponent className={`w-3.5 h-3.5 ${color.icon} flex-shrink-0`} />
              <span className={`text-xs font-semibold ${color.text}`}>{acc.name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {accreditations.map((acc, idx) => {
        const IconComponent = iconMap[acc.icon] || CheckCircle;
        const color = colorPalette[idx % colorPalette.length];
        return (
          <div
            key={acc.id}
            className={`flex items-start gap-3 p-3 ${color.bg} border ${color.border} rounded-xl`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center mt-0.5`}>
              <IconComponent className={`w-4.5 h-4.5 ${color.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${color.text}`}>{acc.name}</div>
              {acc.description && (
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{acc.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
