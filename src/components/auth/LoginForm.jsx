import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Heart, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoginForm = ({ 
  formData, 
  errors, 
  showPassword, 
  setShowPassword, 
  handleInputChange, 
  handleSubmit, 
  setCurrentPage,
  googleId = 'googleBtn',
  submitting = false
}) => {
  const { t } = useTranslation();
  const { applyApiAuth, fetchCurrentUser } = useAuth();
  const tokenClientRef = useRef(null);
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const API_BASE = process.env.REACT_APP_API_BASE || '';
    const LOGIN_GOOGLE = process.env.REACT_APP_API_LOGIN_GOOGLE || '/api/login/google';
    const mountAccessTokenFlow = () => {
      /** @type {any} */
      const google = (window).google;
      const oauthReady = !!(google && google.accounts && google.accounts.oauth2);
      const btn = document.getElementById(googleId);
      if (!oauthReady || !btn) return false;
      try {
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            try {
              const access_token = tokenResponse?.access_token;
              if (!access_token) return;
              const resp = await fetch((API_BASE + LOGIN_GOOGLE), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors',
                redirect: 'manual',
                cache: 'no-store',
                body: JSON.stringify({ access_token })
              });
              if (resp.type === 'opaqueredirect' || (resp.status >= 300 && resp.status < 400)) return;
              if (!resp.ok) return;
              const data = await resp.json().catch(() => ({}));
              if (data && data.data && data.data.access_token) { try { localStorage.setItem('access_token', data.data.access_token); } catch {} }
              else if (data && data.access_token) { try { localStorage.setItem('access_token', data.access_token); } catch {} }
              try { localStorage.setItem('google_access_token', access_token); } catch {}
              const applied = applyApiAuth?.(data);
              try {
                if (applied?.user && (applied?.access_token || localStorage.getItem('access_token'))) {
                  const token = applied.access_token || localStorage.getItem('access_token');
                  localStorage.setItem('auth_state', JSON.stringify({ user: applied.user, token, country: 'TR' }));
                  try { await fetchCurrentUser?.(token); } catch {}
                }
              } catch {}
              try { localStorage.setItem('google_user', JSON.stringify(applied?.user || data?.user || data?.data?.user || data)); } catch {}
              window.location.assign('/home-v2');
            } catch {}
          }
        });
        // Render a simple button inside placeholder
        while (btn.firstChild) btn.removeChild(btn.firstChild);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'w-full flex items-center justify-center gap-2 border rounded-full py-2 px-3 hover:bg-gray-50';
        const img = document.createElement('img');
        img.src = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
        img.alt = 'G';
        img.className = 'h-5 w-5';
        const span = document.createElement('span');
        span.className = 'text-sm font-medium';
        span.textContent = 'Continue with Google';
        b.appendChild(img);
        b.appendChild(span);
        b.addEventListener('click', () => {
          try { tokenClientRef.current?.requestAccessToken({ prompt: 'consent' }); } catch {}
        });
        btn.appendChild(b);
        return true;
      } catch { return false; }
    };

    let tries = 0;
    const tick = () => {
      if (mountAccessTokenFlow()) return;
      if (tries < 20) { tries += 1; setTimeout(tick, 250); }
    };
    tick();
  }, [googleId]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4 sm:mb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-3">
          <img src="/images/logo/crm-logo.jpg" alt="MedGama" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">MedGama</span>
        </div>
        <p className="text-sm sm:text-base text-gray-600">{t('auth.loginSubtitle')}</p>
      </div>
      <div className="space-y-3 sm:space-y-6 flex flex-col items-center">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            {t('common.email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm sm:text-base ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="name@example.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1 text-center">{errors.email}</p>}
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            {t('common.password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm sm:text-base ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1 text-center">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between w-full">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm text-gray-600">{t('auth.rememberMe')}</span>
          </label>
          <button
            type="button"
            onClick={() => window.location.href = '/forgot-password'}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('auth.forgotPassword')}
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-2 sm:py-3 px-4 rounded-xl focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
          {submitting ? t('auth.loggingIn') || 'Logging in...' : t('common.login')}
        </button>
        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
          {t('auth.gdprNotice')}
        </p>
        <div className="relative my-6 w-full">
          <div className="relative flex justify-center text-sm">
            <span className="text-gray-500">{t('auth.or')}</span>
          </div>
        </div>
        <div className="w-full">
          <div id={googleId} className="w-full flex items-center justify-center"></div>
        </div>
        <p className="text-center text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <button
            type="button"
            onClick={() => setCurrentPage('register')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            {t('auth.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
