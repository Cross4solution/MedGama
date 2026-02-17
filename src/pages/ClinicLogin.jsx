import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Calendar, Video, Shield, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import PhoneVerification from '../components/auth/PhoneVerification';
import { useTranslation } from 'react-i18next';

const ClinicLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const { t } = useTranslation();

  // If user is already logged in (doctor/clinic), skip login form
  useEffect(() => {
    if (user) {
      if (user.role !== 'clinic') {
        // Switch role to clinic (e.g. doctor → clinic)
        login({ ...user, id: user.id || 'clinic-1', role: 'clinic', name: user.name || 'Clinic' });
      }
      navigate('/clinic-edit', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try {
      await login(formData.email, formData.password);
      navigate('/home-v2', { replace: true });
    } catch (err) {
      if (err?.status === 401) setError(err?.data?.message || 'Invalid credentials');
      else if (err?.status === 422) setError(err?.data?.message || 'Validation error');
      else setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, text: t('auth.featureManageReps') },
    { icon: Calendar, text: t('auth.featureCoordinate') },
    { icon: Video, text: t('auth.featureTelehealthSchedule') },
  ];

  const handlePhoneVerified = (verifiedPhone) => {
    navigate('/crm', { replace: true });
  };

  const handlePhoneSkip = () => {
    navigate('/crm', { replace: true });
  };

  // Phone verification screen
  if (showPhoneVerification) {
    return (
      <div className="min-h-screen w-full flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800" />
        <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xl">
              <PhoneVerification
                onVerified={handlePhoneVerified}
                onSkip={handlePhoneSkip}
                title={t('auth.clinicPhoneVerification')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800" />
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />

      <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16">

          {/* Left Side - Info (Desktop) */}
          <div className="hidden lg:block flex-1 max-w-md text-left">
            <div className="text-white">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                <Building2 className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">{t('auth.welcomeClinicPortal')}</h2>
              <p className="text-base text-teal-100/90 mb-10 leading-relaxed">{t('auth.clinicPortalDesc')}</p>
              <div className="space-y-5">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
                      <f.icon className="w-5 h-5 text-teal-200" />
                    </div>
                    <span className="text-white/85 text-sm">{f.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-10 text-white/60 text-xs">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {t('auth.sslSecure')}</span>
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {t('auth.hipaaCompliant')}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xl">
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                  <img src="/images/logo/crm-logo.jpg" alt="MedGama" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">MedGama</span>
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-0.5">{t('auth.clinicSignIn')}</h1>
                <p className="text-xs text-gray-500">{t('auth.accessClinicPortal')}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('auth.emailAddress')}</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                         className="w-full h-10 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors text-sm"
                         placeholder="clinic@example.com" required />
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                  <div className="relative">
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                           className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors text-sm"
                           placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide' : 'Show'}>
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-1.5 text-gray-500">
                    <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5" />
                    {t('auth.rememberMe')}
                  </label>
                  <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">{t('auth.forgotPassword')}</a>
                </div>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">{error}</div>}
                <button type="submit" disabled={loading}
                        className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all disabled:opacity-50">
                  {loading ? t('auth.signingIn') : t('auth.signIn')}
                </button>
                <p className="text-[11px] text-gray-400 text-center leading-relaxed px-1">
                  {t('auth.gdprNotice').split(t('auth.termsOfService'))[0]}
                  <a href="/terms-of-service" className="text-teal-500 hover:text-teal-600 underline underline-offset-2">{t('auth.termsOfService')}</a>{' '}
                  <a href="/privacy-policy" className="text-teal-500 hover:text-teal-600 underline underline-offset-2">{t('auth.privacyPolicy')}</a>
                </p>
                <button type="button"
                        onClick={() => { login({ id: 'clinic-demo-1', role: 'clinic', name: 'Demo Clinic' }); navigate('/crm', { replace: true }); }}
                        className="w-full bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 border border-gray-200 transition-colors">
                  {t('auth.tryDemoClinic')}
                </button>
              </form>
              <div className="mt-4 text-center text-xs text-gray-500">
                {t('auth.dontHaveAccount')}{' '}
                <a href="/register" className="text-teal-600 hover:text-teal-700 font-semibold">{t('auth.signUp')}</a>
              </div>
              <div className="mt-2 text-center text-xs text-gray-400">
                <a href="/doctor-login" className="hover:text-gray-600 transition-colors">{t('nav.doctorLogin')}</a>
                <span className="mx-2">·</span>
                <a href="/login" className="hover:text-gray-600 transition-colors">{t('nav.patientLogin')}</a>
              </div>
            </div>
            {/* Mobile info */}
            <div className="lg:hidden w-full px-2 mt-4 mb-4">
              <div className="flex items-center gap-6 justify-center text-white/70 text-xs">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {t('auth.sslSecure')}</span>
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {t('auth.hipaaCompliant')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicLogin;
