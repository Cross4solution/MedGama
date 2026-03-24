import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

/**
 * PremiumGate — CRM Paywall / Blur overlay component.
 *
 * Wraps CRM page content. If the user does NOT have an active CRM subscription
 * (has_crm_subscription === false), it renders a blurred overlay with an upgrade CTA.
 *
 * Usage:
 *   <PremiumGate>
 *     <CRMDashboard />
 *   </PremiumGate>
 *
 * Props:
 *   - children: The CRM page content to render or blur.
 *   - featureName: Optional label for the locked feature (e.g. "Smart Calendar").
 */
export default function PremiumGate({ children, featureName }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const hasCrm = user?.has_crm_subscription;

  // Admins always pass through
  const isAdmin = ['superAdmin', 'saasAdmin'].includes(user?.role_id);
  if (isAdmin || hasCrm) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none filter blur-[6px] opacity-50 overflow-hidden max-h-[70vh]">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/60 via-white/80 to-white/95 dark:from-gray-900/60 dark:via-gray-900/80 dark:to-gray-900/95 z-10">
        <div className="max-w-md mx-auto text-center px-6 py-10">
          {/* Lock icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('crm.premiumGate.title', 'Premium Feature')}
          </h2>

          {/* Feature name badge */}
          {featureName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {featureName}
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {t('crm.premiumGate.description', 'This feature is part of MedaGama CRM — our premium practice management suite. Upgrade to unlock advanced dashboards, AI assistant, detailed patient management, and more.')}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/crm/billing')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            {t('crm.premiumGate.upgrade', 'Upgrade to CRM Pro')}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Subtle info */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            {t('crm.premiumGate.hint', 'You can continue using platform features (appointments, telehealth, profile) without a CRM subscription.')}
          </p>
        </div>
      </div>
    </div>
  );
}
