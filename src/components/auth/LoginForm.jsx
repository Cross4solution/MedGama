import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Heart, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const LoginForm = ({ 
  formData, 
  errors, 
  showPassword, 
  setShowPassword, 
  handleInputChange, 
  handleSubmit, 
  setCurrentPage,
  googleId = 'googleBtn'
}) => {
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
          <img src="/images/logo/crm-logo.jpg" alt="MedGama" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">MedGama</span>
        </div>
        <p className="text-sm sm:text-base text-gray-600">Log in to your account and continue your health journey</p>
      </div>
      <div className="space-y-3 sm:space-y-6 flex flex-col items-center">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Email
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
            Password
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
            <span className="text-xs sm:text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => setCurrentPage('forgot-password')}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot password
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm hover:shadow-md"
        >
          Login
        </button>
        <div className="relative my-6 w-full">
          <div className="relative flex justify-center text-sm">
            <span className="text-gray-500">or</span>
          </div>
        </div>
        <div className="w-full">
          <div id={googleId} className="w-full flex items-center justify-center"></div>
        </div>
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setCurrentPage('register')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
