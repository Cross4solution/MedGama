import React, { useState, useEffect } from 'react';
import { useCookieConsent } from '../context/CookieConsentContext';
import { Shield, Settings, Check, X, ChevronDown, ChevronUp, Cookie, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CATEGORIES = [
  {
    key: 'necessary',
    label: 'Strictly Necessary',
    description: 'Essential for the website to function. These cookies enable core features like security, session management, and accessibility. They cannot be disabled.',
    locked: true,
  },
  {
    key: 'functional',
    label: 'Functional',
    description: 'Enable personalized features such as remembering your preferences, language settings, and region. Disabling these may affect your user experience.',
  },
  {
    key: 'analytics',
    label: 'Analytics & Performance',
    description: 'Help us understand how visitors interact with our website by collecting anonymous usage data. This information is used to improve our services.',
  },
  {
    key: 'marketing',
    label: 'Marketing & Advertising',
    description: 'Used to deliver relevant advertisements and measure the effectiveness of marketing campaigns. These may be set by third-party partners.',
  },
];

const CookieBanner = () => {
  const {
    showBanner,
    showSettings,
    consent,
    acceptAll,
    declineAll,
    acceptSelected,
    openSettings,
    closeSettings,
  } = useCookieConsent();

  const [localConsent, setLocalConsent] = useState({ ...consent });
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Sync local state when consent changes
  useEffect(() => {
    setLocalConsent({ ...consent });
  }, [consent]);

  // Lock body scroll when banner is visible
  useEffect(() => {
    if (showBanner) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalStyles = {
        bodyOverflow: document.body.style.overflow,
        bodyPaddingRight: document.body.style.paddingRight,
        htmlOverflow: document.documentElement.style.overflow,
      };
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = 'hidden';

      const styleId = 'cookie-banner-scroll-style';
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          html {
            overflow: auto !important;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          html::-webkit-scrollbar {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }

      return () => {
        document.body.style.overflow = originalStyles.bodyOverflow;
        document.body.style.paddingRight = originalStyles.bodyPaddingRight;
        document.documentElement.style.overflow = originalStyles.htmlOverflow;
        const styleElement = document.getElementById(styleId);
        if (styleElement) styleElement.remove();
      };
    }
  }, [showBanner]);

  const handleToggle = (key) => {
    if (key === 'necessary') return;
    setLocalConsent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = () => {
    acceptSelected(localConsent);
  };

  if (!showBanner && !showSettings) return null;

  // Settings panel (detailed cookie preferences)
  if (showSettings) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <Settings className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Cookie Preferences</h2>
                  <p className="text-[11px] text-gray-400">Manage your cookie settings</p>
                </div>
              </div>
              <button
                onClick={closeSettings}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100/50">
            <p className="text-sm text-gray-600 leading-relaxed">
              We use cookies and similar technologies to provide you with the best experience. 
              Under the <strong>GDPR</strong>, you have the right to choose which cookie categories you allow. 
              Necessary cookies are always active as they are essential for the site to function.
            </p>
          </div>

          {/* Categories */}
          <div className="px-6 py-4 space-y-3">
            {COOKIE_CATEGORIES.map((cat) => {
              const isExpanded = expandedCategory === cat.key;
              const isEnabled = cat.locked ? true : localConsent[cat.key];
              return (
                <div key={cat.key} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                      {cat.locked && (
                        <span className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
                          Always Active
                        </span>
                      )}
                    </button>
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(cat.key)}
                      disabled={cat.locked}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                        cat.locked
                          ? 'bg-teal-500 cursor-not-allowed opacity-70'
                          : isEnabled
                          ? 'bg-teal-500 cursor-pointer'
                          : 'bg-gray-300 cursor-pointer'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${cat.label} cookies`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-white">
                      <p className="text-xs text-gray-500 leading-relaxed">{cat.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Links */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <Link to="/cookie-policy" onClick={closeSettings} className="hover:text-teal-600 transition-colors inline-flex items-center gap-1">
                Cookie Policy <ExternalLink className="w-3 h-3" />
              </Link>
              <Link to="/privacy-policy" onClick={closeSettings} className="hover:text-teal-600 transition-colors inline-flex items-center gap-1">
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex flex-col sm:flex-row gap-2">
            <button
              onClick={declineAll}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
            >
              Reject All
            </button>
            <button
              onClick={handleSavePreferences}
              className="flex-1 px-4 py-2.5 border border-teal-300 text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-all text-sm font-medium"
            >
              Save Preferences
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all text-sm font-semibold shadow-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main banner
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 -top-screen" />
      <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center gap-2.5 md:gap-4">
          {/* Icon + text */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-xs text-gray-300 leading-snug">
              <span className="text-white font-semibold">Your Privacy Matters</span>{' · '}
              We use cookies for essential functionality, analytics, and personalized content. Under the <strong className="text-white">GDPR</strong>, you control your data.{' '}
              <Link to="/cookie-policy" className="text-teal-400 hover:text-teal-300 font-medium underline underline-offset-2">Cookie Policy</Link>
              {' · '}
              <Link to="/privacy-policy" className="text-teal-400 hover:text-teal-300 font-medium underline underline-offset-2">Privacy Policy</Link>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openSettings}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-all text-xs font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              Customize
            </button>
            <button
              onClick={declineAll}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-all text-xs font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Reject All
            </button>
            <button
              onClick={acceptAll}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-xs font-semibold shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;