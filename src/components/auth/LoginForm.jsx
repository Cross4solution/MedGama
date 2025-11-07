import React, { useEffect } from 'react';
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
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const API_BASE = process.env.REACT_APP_API_BASE || '';
    const LOGIN_GOOGLE = process.env.REACT_APP_API_LOGIN_GOOGLE || '/api/login/google';
    const CSRF_PATH = process.env.REACT_APP_API_CSRF_PATH || '/sanctum/csrf-cookie';

    const ensureCsrf = async () => {
      try {
        await fetch((API_BASE + CSRF_PATH), { method: 'GET', credentials: 'include' });
      } catch {}
    };

    const handleCredentialResponse = async ({ credential }) => {
      try {
        await ensureCsrf();
        const resp = await fetch((API_BASE + LOGIN_GOOGLE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_token: credential })
        });
        if (!resp.ok) return;
        const data = await resp.json().catch(() => ({}));
        try { localStorage.setItem('google_id_token', credential); } catch {}
        try { localStorage.setItem('google_user', JSON.stringify(data?.user || data)); } catch {}
        window.location.assign('/home-v2');
      } catch (e) {}
    };

    let tries = 0;
    const mountGoogle = () => {
      /** @type {any} */
      const google = (window).google;
      const ready = !!(google && google.accounts && google.accounts.id);
      const btn = document.getElementById(googleId);
      if (ready && btn) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            use_fedcm_for_prompt: false
          });
          google.accounts.id.renderButton(btn, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 360
          });
        } catch {}
        return;
      }
      if (tries < 20) {
        tries += 1;
        setTimeout(mountGoogle, 250);
      }
    };
    mountGoogle();
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
