import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Video, Plane, Shield, Lock, Stethoscope, Eye, EyeOff } from 'lucide-react';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Google Identity Services - render Google Sign-In button and handle credential
  console.log('GIS clientId in runtime:', process.env.REACT_APP_GOOGLE_CLIENT_ID, 'origin:', window.location.origin);
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
        const parts = (credential || '').split('.');
        const payload = parts[1] ? JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
        console.log('Google ID Token length:', credential?.length, 'payload:', payload);
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
        navigate('/explore', { replace: true });
      } catch (e) {}
    };

    let tries = 0;
    const mountGoogle = () => {
      /** @type {any} */
      const google = (window).google;
      const ready = !!(google && google.accounts && google.accounts.id);
      const btn = document.getElementById('googleBtnDoctor');
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
  }, [navigate]);

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }
    try {
      const res = await login(formData.email, formData.password);
      const apiUser = res?.data?.user;
      const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser);
      navigate(isDoctor ? '/explore' : '/home-v2', { replace: true });
    } catch (err) {
      if (err?.status === 401) setError(err?.data?.message || 'Invalid credentials');
      else if (err?.status === 422) setError(err?.data?.message || 'Validation error');
      else setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, text: 'Patient management and tracking' },
    { icon: Calendar, text: 'Smart appointment system' },
    { icon: Video, text: 'Integrated telehealth solution' },
    { icon: Plane, text: 'Medical tourism management' },
  ];

  const stats = [
    { value: '1.2K+', label: 'Active Doctors' },
    { value: '50K+', label: 'Patients Tracked' },
    { value: '98%', label: 'Satisfaction' },
  ];

  return (
    <div className="h-screen w-full flex relative overflow-hidden">
      {/* Left: Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      <div className="relative z-10 flex w-full h-screen flex-col lg:flex-row overflow-y-hidden">
        {/* Info column */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-10 py-6">
          <div className="max-w-lg text-white">
            <div className="w-28 h-28 bg-white/15 rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-bold mb-3">Welcome to the Doctor Portal</h2>
            <p className="text-base text-teal-100 mb-6">Manage your patients, track appointments, and control telehealth services from a single platform.</p>
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="text-white/90">{f.text}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-teal-100 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex space-x-4 mt-6">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">SSL Secure</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">KVKK (GDPR) Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form column */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 gap-3">
          <div className="w-full max-w-md lg:max-w-lg bg-white/95 backdrop-blur-xl rounded-xl p-5 lg:p-6 shadow-2xl border border-white/30">
            <div className="text-center mb-5">
              <img src="/images/logo/crm-logo.jpg" alt="MediTravel" className="h-12 w-auto mx-auto mb-3 rounded mix-blend-multiply" />
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1.5">
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Sign in to your account</span>
              </h1>
              <p className="text-gray-600 text-sm lg:text-base">
                <span className="sm:hidden">Access portal</span>
                <span className="hidden sm:inline">Sign in to access the doctor portal</span>
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="sm:hidden">Email</span>
                  <span className="hidden sm:inline">Email Address</span>
                </label>
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                       placeholder="doctor@example.com" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  Remember me
                </label>
                <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
                  <span className="sm:hidden">Forgot?</span>
                  <span className="hidden sm:inline">Forgot password?</span>
                </a>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              {/* Google Sign-In Button (GIS) */}
              <div id="googleBtnDoctor" className="w-full flex items-center justify-center"></div>
              
              <button
                type="button"
                onClick={() => { login({ id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' }); navigate('/explore', { replace: true }); }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
              >
                Demo Login (Doctor)
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
              <div>
                <span className="sm:hidden">New here?</span>
                <span className="hidden sm:inline">Don't have an account?</span>{' '}
                <a href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
                  <span className="sm:hidden">Sign up</span>
                  <span className="hidden sm:inline">Sign up for free</span>
                </a>
              </div>
            </div>
          </div>
          {/* Mobile compact info moved below the form card (no background/blur) */}
          <div className="lg:hidden w-full max-w-md px-1 text-white">
            <div className="px-1">
              <div className="text-sm font-semibold">Doctor Portal</div>
              <div className="text-xs text-teal-50">Manage patients & telehealth in one place.</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <f.icon className="w-4 h-4" />
                    <span className="text-[11px] leading-3 text-white/90 truncate">{f.text}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-base font-bold leading-4">{s.value}</div>
                    <div className="text-[10px] text-teal-50 leading-3 truncate">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>GDPR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
