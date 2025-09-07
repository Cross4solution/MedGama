import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Calendar, Video, Shield, Lock, Eye, EyeOff } from 'lucide-react';

const ClinicLogin = () => {
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
    // Demo auth: set role and redirect to updates feed
    login({ id: 'clinic-demo-1', role: 'clinic', name: 'Demo Clinic' });
    setLoading(false);
    navigate('/updates', { replace: true });
  };

  const features = [
    { icon: Users, text: 'Manage sales reps and leads' },
    { icon: Calendar, text: 'Coordinate appointments' },
    { icon: Video, text: 'Telehealth scheduling' },
  ];

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Right gradient info */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-white/10 rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-10">
            <h2 className="text-4xl font-bold mb-4">Clinic Portal</h2>
            <p className="text-xl text-indigo-100">Operate your clinic workflows and teams efficiently.</p>
          </div>
          <div className="space-y-4 mb-10">
            {features.map((f, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <f.icon className="w-5 h-5" />
                </div>
                <span className="text-indigo-100">{f.text}</span>
              </div>
            ))}
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Left form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Login</h1>
            <p className="text-gray-600">Access the clinic management tools</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                     placeholder="clinic@example.com" required />
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { login({ id: 'clinic-demo-1', role: 'clinic', name: 'Demo Clinic' }); navigate('/updates', { replace: true }); }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              Demo Login (Clinic)
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
            <div>
              Are you a doctor?{' '}
              <a href="/doctor-login" className="text-indigo-600 hover:text-indigo-700 font-medium">Doctor Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicLogin;
