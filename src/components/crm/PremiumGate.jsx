import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * PremiumGate — Wraps content with a blur overlay when locked.
 * Props:
 *   locked  — boolean, if true content is blurred with an overlay
 *   message — overlay message text
 */
const PremiumGate = ({ locked, message, children }) => {
  const { t } = useTranslation();

  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.45 }}>
        {children}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl z-10 pb-6">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700 text-center px-6 mb-3 max-w-xs leading-relaxed">
          {message || t('premium.defaultLockMessage', 'Bu özelliği kullanmak için Premium\'a geçin')}
        </p>
        <Link
          to="/crm/billing"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl text-xs font-bold hover:from-teal-700 hover:to-emerald-600 transition-all shadow-lg shadow-teal-200/50"
        >
          <Crown className="w-3.5 h-3.5" />
          {t('pro.teaser.upgradeCta', 'Premium\'a Geç')}
        </Link>
      </div>
    </div>
  );
};

export default PremiumGate;
