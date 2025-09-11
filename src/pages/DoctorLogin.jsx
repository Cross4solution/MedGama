import React, { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }
    // Demo auth: set role and redirect to patient home
    login({ id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' });
    setLoading(false);
    navigate('/patient-home', { replace: true });
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
              {/* Removed OR divider to meet design requirement */}
              <button type="button" className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="sm:hidden">Google</span>
                <span className="hidden sm:inline">Sign in with Google</span>
              </button>
              <button
                type="button"
                onClick={() => { login({ id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' }); navigate('/patient-home', { replace: true }); }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
              >
                <span className="sm:hidden">Demo</span>
                <span className="hidden sm:inline">Demo Login (Doctor)</span>
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
