import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StethoscopeIllustration = () => (
  <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
    {/* Background circle */}
    <circle cx="90" cy="90" r="85" fill="url(#grad404)" opacity="0.08" />
    <circle cx="90" cy="90" r="65" fill="url(#grad404)" opacity="0.05" />
    {/* Stethoscope body */}
    <path d="M60 55 C60 55, 55 80, 55 95 C55 115, 70 125, 90 125 C110 125, 125 115, 125 95 C125 80, 120 55, 120 55"
      stroke="#0d9488" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
    {/* Ear tips */}
    <circle cx="60" cy="50" r="6" fill="#0d9488" opacity="0.8" />
    <circle cx="120" cy="50" r="6" fill="#0d9488" opacity="0.8" />
    {/* Y connector */}
    <path d="M60 55 L90 75 L120 55" stroke="#0d9488" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
    {/* Tube down */}
    <path d="M90 75 L90 105" stroke="#0d9488" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6" />
    {/* Chest piece */}
    <circle cx="90" cy="115" r="14" fill="#0d9488" opacity="0.15" stroke="#0d9488" strokeWidth="3" />
    <circle cx="90" cy="115" r="7" fill="#0d9488" opacity="0.3" />
    {/* 404 text inside */}
    <text x="90" y="155" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0d9488" opacity="0.4">404</text>
    {/* Pulse line */}
    <path d="M30 90 L50 90 L58 78 L66 102 L74 85 L80 90 L150 90"
      stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.2">
      <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" repeatCount="indefinite" />
      <animate attributeName="stroke-dasharray" values="0 200;120 200;0 200" dur="2s" repeatCount="indefinite" />
    </path>
    <defs>
      <linearGradient id="grad404" x1="0" y1="0" x2="180" y2="180">
        <stop offset="0%" stopColor="#0d9488" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="text-center max-w-lg">
        <StethoscopeIllustration />

        <h1 className="text-6xl sm:text-7xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent mb-3 mt-2">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          {t('errors.notFound_title', 'Page Not Found')}
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm sm:text-base max-w-md mx-auto">
          {t('errors.notFound_desc', 'The page you are looking for may have been moved, deleted, or never existed. Please check the URL or return to the homepage.')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            {t('errors.goHome', 'Go to Homepage')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('errors.goBack', 'Go Back')}
          </button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Search className="w-3.5 h-3.5" />
          <span>{t('errors.needHelp', 'Need help?')}</span>
          <Link to="/contact" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
            {t('errors.contactUs', 'Contact us')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
