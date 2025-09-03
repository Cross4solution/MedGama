import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Video, Plane, Shield, Lock, Stethoscope } from 'lucide-react';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
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
    login({ id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' });
    setLoading(false);
    navigate('/updates', { replace: true });
  };

  const features = [
    { icon: Users, text: 'Patient management and tracking' },
    { icon: Calendar, text: 'Smart appointment scheduling' },
    { icon: Video, text: 'Integrated telehealth solution' },
    { icon: Plane, text: 'Medical tourism workflows' },
  ];

  const stats = [
    { value: '1.2K+', label: 'Active Doctors' },
    { value: '50K+', label: 'Patients Managed' },
    { value: '98%', label: 'Satisfaction' },
  ];

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Left: Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      <div className="relative z-10 flex w-full min-h-screen flex-col lg:flex-row">
        {/* Info column */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-10">
          <div className="max-w-lg text-white">
            <div className="w-32 h-32 bg-white/15 rounded-full flex items-center justify-center mb-6">
              <Stethoscope className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Doctor Portal</h2>
            <p className="text-lg text-teal-100 mb-8">Manage your appointments, patients and tele-consults in one place.</p>
            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="text-white/90">{f.text}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6 mt-10">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-teal-100 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex space-x-4 mt-8">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">256-bit Encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form column */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-2xl border border-white/30">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Login</h1>
              <p className="text-gray-600">Access your professional tools</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                       placeholder="doctor@example.com" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                       placeholder="••••••••" required />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { login({ id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' }); navigate('/updates', { replace: true }); }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
              >
                Demo Login (Doctor)
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
              <div>
                Are you a clinic?{' '}
                <a href="/clinic-login" className="text-teal-600 hover:text-teal-700 font-medium">Clinic Login</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
