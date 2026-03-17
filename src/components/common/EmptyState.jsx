import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ILLUSTRATIONS = {
  appointments: (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      <circle cx="70" cy="70" r="65" fill="url(#gradAppt)" opacity="0.06" />
      <circle cx="70" cy="70" r="48" fill="url(#gradAppt)" opacity="0.04" />
      {/* Calendar body */}
      <rect x="35" y="42" width="70" height="62" rx="10" fill="white" stroke="#0d9488" strokeWidth="2" opacity="0.8" />
      <rect x="35" y="42" width="70" height="18" rx="10" fill="#0d9488" opacity="0.15" />
      {/* Calendar rings */}
      <line x1="55" y1="37" x2="55" y2="47" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="85" y1="37" x2="85" y2="47" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      {/* Calendar dots */}
      <circle cx="50" cy="72" r="3" fill="#0d9488" opacity="0.2" />
      <circle cx="62" cy="72" r="3" fill="#0d9488" opacity="0.2" />
      <circle cx="74" cy="72" r="3" fill="#0d9488" opacity="0.2" />
      <circle cx="86" cy="72" r="3" fill="#0d9488" opacity="0.2" />
      <circle cx="50" cy="86" r="3" fill="#0d9488" opacity="0.2" />
      <circle cx="62" cy="86" r="3" fill="#10b981" opacity="0.4" />
      <circle cx="74" cy="86" r="3" fill="#0d9488" opacity="0.2" />
      <circle cx="86" cy="86" r="3" fill="#0d9488" opacity="0.2" />
      {/* Highlight selected date */}
      <circle cx="62" cy="86" r="7" fill="#0d9488" opacity="0.12" />
      {/* Plus icon */}
      <circle cx="100" cy="95" r="12" fill="#0d9488" opacity="0.15" stroke="#0d9488" strokeWidth="1.5" />
      <line x1="100" y1="89" x2="100" y2="101" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
      <line x1="94" y1="95" x2="106" y2="95" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="gradAppt" x1="0" y1="0" x2="140" y2="140">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  ),
  messages: (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      <circle cx="70" cy="70" r="65" fill="url(#gradMsg)" opacity="0.06" />
      <circle cx="70" cy="70" r="48" fill="url(#gradMsg)" opacity="0.04" />
      {/* Chat bubble 1 */}
      <rect x="30" y="40" width="55" height="32" rx="10" fill="white" stroke="#0d9488" strokeWidth="2" opacity="0.8" />
      <path d="M45 72 L40 82 L55 72" fill="white" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round" opacity="0.8" />
      {/* Lines in bubble 1 */}
      <line x1="40" y1="50" x2="72" y2="50" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      <line x1="40" y1="57" x2="62" y2="57" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" opacity="0.15" />
      <line x1="40" y1="64" x2="55" y2="64" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" opacity="0.1" />
      {/* Chat bubble 2 (smaller, offset) */}
      <rect x="60" y="75" width="45" height="24" rx="8" fill="#0d9488" opacity="0.1" stroke="#0d9488" strokeWidth="1.5" />
      <path d="M90 99 L95 107 L85 99" fill="#0d9488" opacity="0.1" stroke="#0d9488" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lines in bubble 2 */}
      <line x1="68" y1="84" x2="97" y2="84" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" opacity="0.15" />
      <line x1="68" y1="91" x2="88" y2="91" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" opacity="0.1" />
      {/* Notification dot */}
      <circle cx="88" cy="38" r="6" fill="#10b981" opacity="0.3" />
      <circle cx="88" cy="38" r="3" fill="#10b981" opacity="0.5" />
      <defs>
        <linearGradient id="gradMsg" x1="0" y1="0" x2="140" y2="140">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  ),
  vault: (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      <circle cx="70" cy="70" r="65" fill="url(#gradVault)" opacity="0.06" />
      <circle cx="70" cy="70" r="48" fill="url(#gradVault)" opacity="0.04" />
      {/* Folder body */}
      <path d="M30 55 L30 100 Q30 108 38 108 L102 108 Q110 108 110 100 L110 55 Q110 47 102 47 L75 47 L68 38 Q65 35 60 35 L38 35 Q30 35 30 43 Z"
        fill="white" stroke="#0d9488" strokeWidth="2" opacity="0.8" />
      {/* Folder tab */}
      <path d="M30 47 L68 47 L75 38" stroke="#0d9488" strokeWidth="2" fill="none" opacity="0.4" />
      {/* Medical cross on folder */}
      <rect x="60" y="65" width="20" height="20" rx="4" fill="#0d9488" opacity="0.12" />
      <line x1="70" y1="69" x2="70" y2="81" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <line x1="64" y1="75" x2="76" y2="75" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      {/* Upload arrow */}
      <path d="M70 100 L70 112" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M65 105 L70 100 L75 105" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3" />
      <defs>
        <linearGradient id="gradVault" x1="0" y1="0" x2="140" y2="140">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  ),
};

export default function EmptyState({
  type = 'appointments',
  title,
  description,
  actionLabel = '',
  actionUrl = '',
  onAction = null,
  secondaryLabel = '',
  secondaryUrl = '',
}) {
  const { t } = useTranslation();
  const illustration = ILLUSTRATIONS[type] || ILLUSTRATIONS.appointments;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="mb-5">{illustration}</div>
      <h3 className="text-base font-semibold text-gray-800 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6 leading-relaxed">{description}</p>
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        {actionUrl && (
          <Link
            to={actionUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 transition-all"
          >
            {actionLabel}
          </Link>
        )}
        {onAction && !actionUrl && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 transition-all"
          >
            {actionLabel}
          </button>
        )}
        {secondaryUrl && (
          <Link
            to={secondaryUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
