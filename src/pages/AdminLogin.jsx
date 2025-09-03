import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, Lock, BarChart3, Settings, Users } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitToCRM = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // simple validation
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }
    // Demo auth: set admin role and go to updates feed
    login({ id: 'admin-demo-1', role: 'admin', name: 'Demo Admin' });
    setLoading(false);
    navigate('/updates', { replace: true });
  };

  const features = [
    { icon: Building2, text: 'Clinic management and control' },
    { icon: Users, text: 'View all vendors and patients' },
    { icon: BarChart3, text: 'Advanced reporting and analytics' },
    { icon: Settings, text: 'System configuration and governance' },
  ];

  const stats = [
    { value: '15+', label: 'Active Clinics' },
    { value: '500+', label: 'Sales Reps' },
    { value: '50K+', label: 'Patients' },
    { value: '99%', label: 'System Uptime' },
  ];

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Right Side - Gradient Info */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-white/10 rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-4">Hospital Admin Panel</h2>
            <p className="text-xl text-blue-100">Manage clinics, track performance, and get detailed reports from one place.</p>
          </div>
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Key Features</h3>
            <div className="grid grid-cols-1 gap-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="text-blue-100">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-6">System Stats</h3>
            <div className="grid grid-cols-2 gap-6">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-blue-100 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-8 flex space-x-4">
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

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Access the hospital administration portal</p>
          </div>

          <form onSubmit={submitToCRM} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                     placeholder="admin@hospital.com" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input id="password" name="password" type="password" value={formData.password} onChange={handleChange}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                     placeholder="••••••••" required />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { login({ id: 'admin-demo-1', role: 'admin', name: 'Demo Admin' }); navigate('/updates', { replace: true }); }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              Demo Login (Admin)
            </button>
          </form>

          <div className="mt-8 text-center space-y-2 text-sm text-gray-600">
            <div>
              Looking for a different account type?{' '}
              <a href="/doctor-login" className="text-blue-600 hover:text-blue-700 font-medium">Doctor Login</a>
            </div>
            <div>
              Are you a clinic?{' '}
              <a href="/clinic-login" className="text-blue-600 hover:text-blue-700 font-medium">Clinic Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
