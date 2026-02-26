import React from 'react';
import {
  Heart,
  Mail
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForgotPasswordForm = ({ 
  formData, 
  errors, 
  handleInputChange, 
  handleSubmit, 
  setCurrentPage 
}) => {
  const { t } = useTranslation();
  return (
  <div className="w-full max-w-lg mx-auto">
    <div className="text-center mb-2 sm:mb-3">
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
        <img src="/images/logo/logo.svg" alt="MedaGama" className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">MedaGama</span>
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{t('auth.passwordReset')}</h1>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-5">{t('auth.passwordResetDesc')}</p>
    </div>
    <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-3 flex flex-col items-center">
      <div className="w-full max-w-md">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center">
          {t('common.email')}
        </label>
        <div className="relative">
          <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full pl-6 sm:pl-8 pr-4 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="name@example.com"
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1 text-center">{errors.email}</p>}
        {!errors.email && (
          <p className="text-[11px] sm:text-xs text-gray-500 mt-3 mb-3 text-center">{t('auth.resetLinkNotice')}</p>
        )}
      </div>
      <button
        type="submit"
                  className="w-full max-w-md bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md"
      >
        {t('auth.sendResetLink')}
      </button>
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => setCurrentPage('login')}
          className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-50 transition-all duration-200 text-xs sm:text-sm"
        >
          {t('auth.backToLogin')}
        </button>
      </div>
    </form>
  </div>
  );
};

export default ForgotPasswordForm; 