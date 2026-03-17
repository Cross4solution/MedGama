import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HeartbeatIllustration = () => (
  <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
    <circle cx="90" cy="90" r="85" fill="url(#grad500)" opacity="0.06" />
    <circle cx="90" cy="90" r="65" fill="url(#grad500)" opacity="0.04" />
    {/* Heart shape */}
    <path d="M90 135 C90 135, 45 105, 45 75 C45 60, 55 50, 67.5 50 C77 50, 85 56, 90 65 C95 56, 103 50, 112.5 50 C125 50, 135 60, 135 75 C135 105, 90 135, 90 135Z"
      fill="#0d9488" opacity="0.1" stroke="#0d9488" strokeWidth="2.5" />
    {/* Flatline / interrupted pulse */}
    <path d="M25 90 L55 90 L65 75 L75 105 L85 82 L90 90 L95 90"
      stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5">
      <animate attributeName="stroke-dashoffset" from="150" to="0" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="stroke-dasharray" values="0 150;80 150;0 150" dur="1.5s" repeatCount="indefinite" />
    </path>
    {/* Broken / gap */}
    <path d="M100 90 L105 90" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <path d="M115 90 L155 90"
      stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.3" strokeDasharray="4 6" />
    {/* Cross / error indicator */}
    <circle cx="108" cy="90" r="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />
    <path d="M104.5 86.5 L111.5 93.5 M111.5 86.5 L104.5 93.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    {/* 500 text */}
    <text x="90" y="160" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0d9488" opacity="0.35">500</text>
    <defs>
      <linearGradient id="grad500" x1="0" y1="0" x2="180" y2="180">
        <stop offset="0%" stopColor="#0d9488" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

const ServerErrorPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="text-center max-w-lg">
        <HeartbeatIllustration />

        <h1 className="text-6xl sm:text-7xl font-extrabold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent mb-3 mt-2">
          500
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          {t('errors.serverError_title', 'Server Error')}
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm sm:text-base max-w-md mx-auto">
          {t('errors.serverError_desc', 'Something went wrong on our end. Our team has been notified. Please try again in a few minutes.')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            {t('errors.tryAgain', 'Try Again')}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            {t('errors.goHome', 'Go to Homepage')}
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-400">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>{t('errors.teamNotified', 'Our technical team has been automatically notified.')}</span>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
