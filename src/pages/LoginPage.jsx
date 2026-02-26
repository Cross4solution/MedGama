import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Helmet } from 'react-helmet-async';
import {
  Heart, Stethoscope, Building2, CheckCircle, Shield, Lock,
  Users, Calendar, Video, Plane, Eye, EyeOff, Mail
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import TermsPopup from '../components/auth/TermsPopup';
import PrivacyPopup from '../components/auth/PrivacyPopup';

/* ─── Role-specific configuration ─────────────────────────────── */
const ROLE_CONFIG = {
  patient: {
    icon: Heart,
    gradient: 'from-teal-600 via-teal-700 to-cyan-800',
    accentColor: 'teal',
    ringColor: 'focus:ring-teal-200',
    btnBg: 'bg-teal-600 hover:bg-teal-700',
    btnFocus: 'focus:ring-teal-200',
    linkColor: 'text-teal-600 hover:text-teal-700',
    linkColorLight: 'text-teal-500 hover:text-teal-600',
    featureIconColor: 'text-teal-200',
    inputFocus: 'focus:ring-teal-500',
    checkboxColor: 'text-teal-600 focus:ring-teal-500',
    titleKey: 'auth.patientSignIn',
    subtitleKey: 'auth.accessPatientPortal',
    welcomeKey: 'auth.welcomePatientPortal',
    descKey: 'auth.patientPortalDesc',
    metaTitleKey: 'auth.metaPatientLogin',
    metaDescKey: 'auth.metaPatientLoginDesc',
    featuresKeys: [
      { icon: CheckCircle, textKey: 'auth.featureVerifiedDoctors' },
      { icon: Shield, textKey: 'auth.featureSecureGDPR' },
      { icon: Heart, textKey: 'auth.featurePatientSupport' },
    ],
    showStats: true,
    showGoogleLogin: true,
    googleBtnId: 'googleBtnPatient',
    redirectAfterLogin: '/dashboard',
    placeholder: 'name@example.com',
    otherLogins: [
      { href: '/doctor-login', labelKey: 'nav.doctorLogin' },
      { href: '/clinic-login', labelKey: 'nav.clinicLogin' },
    ],
  },
  doctor: {
    icon: Stethoscope,
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    accentColor: 'blue',
    ringColor: 'focus:ring-blue-200',
    btnBg: 'bg-blue-600 hover:bg-blue-700',
    btnFocus: 'focus:ring-blue-200',
    linkColor: 'text-blue-600 hover:text-blue-700',
    linkColorLight: 'text-blue-500 hover:text-blue-600',
    featureIconColor: 'text-blue-200',
    inputFocus: 'focus:ring-blue-500',
    checkboxColor: 'text-blue-600 focus:ring-blue-500',
    titleKey: 'auth.doctorSignIn',
    subtitleKey: 'auth.accessDoctorPortal',
    welcomeKey: 'auth.welcomeDoctorPortal',
    descKey: 'auth.doctorPortalDesc',
    metaTitleKey: 'auth.metaDoctorLogin',
    metaDescKey: 'auth.metaDoctorLoginDesc',
    featuresKeys: [
      { icon: Users, textKey: 'auth.featurePatientMgmt' },
      { icon: Calendar, textKey: 'auth.featureAppointment' },
      { icon: Video, textKey: 'auth.featureTelehealth' },
      { icon: Plane, textKey: 'auth.featureTourism' },
    ],
    showStats: true,
    showGoogleLogin: true,
    googleBtnId: 'googleBtnDoctor',
    redirectAfterLogin: '/explore',
    placeholder: 'doctor@example.com',
    otherLogins: [
      { href: '/clinic-login', labelKey: 'nav.clinicLogin' },
      { href: '/login', labelKey: 'nav.patientLogin' },
    ],
  },
  clinic: {
    icon: Building2,
    gradient: 'from-purple-600 via-purple-700 to-violet-800',
    accentColor: 'purple',
    ringColor: 'focus:ring-purple-200',
    btnBg: 'bg-purple-600 hover:bg-purple-700',
    btnFocus: 'focus:ring-purple-200',
    linkColor: 'text-purple-600 hover:text-purple-700',
    linkColorLight: 'text-purple-500 hover:text-purple-600',
    featureIconColor: 'text-purple-200',
    inputFocus: 'focus:ring-purple-500',
    checkboxColor: 'text-purple-600 focus:ring-purple-500',
    titleKey: 'auth.clinicSignIn',
    subtitleKey: 'auth.accessClinicPortal',
    welcomeKey: 'auth.welcomeClinicPortal',
    descKey: 'auth.clinicPortalDesc',
    metaTitleKey: 'auth.metaClinicLogin',
    metaDescKey: 'auth.metaClinicLoginDesc',
    featuresKeys: [
      { icon: Users, textKey: 'auth.featureManageReps' },
      { icon: Calendar, textKey: 'auth.featureCoordinate' },
      { icon: Video, textKey: 'auth.featureTelehealthSchedule' },
    ],
    showStats: false,
    showGoogleLogin: false,
    googleBtnId: 'googleBtnClinic',
    redirectAfterLogin: '/explore',
    placeholder: 'clinic@example.com',
    otherLogins: [
      { href: '/doctor-login', labelKey: 'nav.doctorLogin' },
      { href: '/login', labelKey: 'nav.patientLogin' },
    ],
  },
};

const SVG_PATTERN = 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")';

/* ─── Main Component ──────────────────────────────────────────── */
const LoginPage = ({ role = 'patient' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, registerDoctor, applyApiAuth, fetchCurrentUser } = useAuth();
  const { notify } = useToast();
  const { t } = useTranslation();
  const tokenClientRef = useRef(null);

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.patient;
  const IconComponent = config.icon;

  const [currentPage, setCurrentPage] = useState(
    location.pathname === '/register' ? 'register' : 'login'
  );

  useEffect(() => {
    if (location.pathname === '/register') setCurrentPage('register');
    else if (location.pathname === '/login' || location.pathname === '/auth') setCurrentPage('login');
  }, [location.pathname]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);

  const [formData, setFormData] = useState({
    role: role === 'clinic' ? 'clinic' : role === 'doctor' ? 'doctor' : 'patient',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneCode: '+90',
    phone: '',
    birthDate: '',
    city: '',
    medicalHistory: '',
    acceptTerms: false,
    acceptPrivacy: false,
    acceptHealthData: false,
    receiveUpdates: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Google OAuth setup
  useEffect(() => {
    if (!config.showGoogleLogin) return;
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const API_BASE = (() => { const h = window.location.hostname; if (h.endsWith('.vercel.app') || h === 'medagama.com') return '/api'; return process.env.REACT_APP_API_BASE || ''; })();
    const LOGIN_GOOGLE = process.env.REACT_APP_API_LOGIN_GOOGLE || '/api/login/google';

    const mountAccessTokenFlow = () => {
      const google = (window).google;
      const oauthReady = !!(google && google.accounts && google.accounts.oauth2);
      const btn = document.getElementById(config.googleBtnId);
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
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                mode: 'cors', redirect: 'manual', cache: 'no-store',
                body: JSON.stringify({ access_token }),
              });
              if (resp.type === 'opaqueredirect' || (resp.status >= 300 && resp.status < 400)) return;
              if (!resp.ok) return;
              const data = await resp.json().catch(() => ({}));
              if (data?.data?.access_token) { try { localStorage.setItem('access_token', data.data.access_token); } catch {} }
              else if (data?.access_token) { try { localStorage.setItem('access_token', data.access_token); } catch {} }
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
              navigate(config.redirectAfterLogin, { replace: true });
            } catch {}
          },
        });
        while (btn.firstChild) btn.removeChild(btn.firstChild);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'w-full flex items-center justify-center gap-2 border rounded-full py-2 px-3 hover:bg-gray-50';
        const img = document.createElement('img');
        img.src = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
        img.alt = 'G'; img.className = 'h-5 w-5';
        const span = document.createElement('span');
        span.className = 'text-sm font-medium';
        span.textContent = t('auth.continueWithGoogle');
        b.appendChild(img); b.appendChild(span);
        b.addEventListener('click', () => { try { tokenClientRef.current?.requestAccessToken({ prompt: 'consent' }); } catch {} });
        btn.appendChild(b);
        return true;
      } catch { return false; }
    };

    let tries = 0;
    const tick = () => { if (mountAccessTokenFlow()) return; if (tries < 20) { tries += 1; setTimeout(tick, 250); } };
    tick();
  }, [config.googleBtnId, config.showGoogleLogin, config.redirectAfterLogin, navigate, t]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (currentPage === 'register') {
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the Terms of Use';
      if (!formData.acceptPrivacy) newErrors.acceptPrivacy = 'You must accept the Privacy Policy to proceed';
    }
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const currentErrors = validateForm();
    if (Object.keys(currentErrors).length) {
      const firstKey = Object.keys(currentErrors)[0];
      notify({ type: 'error', message: currentErrors[firstKey] || 'Please correct the highlighted fields' });
      return;
    }
    try {
      setSubmitting(true);
      if (currentPage === 'login') {
        const res = await login(formData.email, formData.password);
        if (res?.requires_email_verification) {
          notify({ type: 'info', message: 'Please verify your email address.' });
          navigate('/verify-email');
        } else {
          notify({ type: 'success', message: 'Login successful' });
          navigate(config.redirectAfterLogin);
        }
      } else if (currentPage === 'register') {
        if (formData.role === 'clinic') {
          notify({ type: 'info', message: 'Clinic registration will be available soon. Please sign in via clinic portal.' });
          setSubmitting(false);
          navigate('/clinic-login');
          return;
        }
        const doRegister = formData.role === 'doctor' ? registerDoctor : register;
        const res = await doRegister({
          email: formData.email,
          password: formData.password,
          fullname: `${formData.firstName} ${formData.lastName}`.trim() || formData.email,
          mobile: formData.phone ? `${formData.phoneCode}${formData.phone}`.replace(/\s/g, '') : undefined,
          city_id: formData.city ? parseInt(formData.city) : undefined,
          date_of_birth: formData.birthDate || undefined,
        });
        try {
          if ((formData.role || 'patient') === 'patient' && formData.email) {
            const key = `patient_profile_extra_${formData.email}`;
            const extras = { medicalHistory: String(formData.medicalHistory || '').trim() };
            localStorage.setItem(key, JSON.stringify(extras));
          }
        } catch {}
        const needsVerification = res?.requires_email_verification ?? res?.data?.requires_email_verification;
        if (needsVerification === false) {
          notify({ type: 'success', message: res?.message || res?.data?.message || 'Registration successful!' });
          navigate(config.redirectAfterLogin);
        } else {
          notify({ type: 'success', message: 'Registration successful! Please verify your email.' });
          navigate('/verify-email');
        }
      } else {
        notify({ type: 'info', message: 'Password reset link sent if the email exists.' });
      }
    } catch (err) {
      const status = err?.status || err?.response?.status || 0;
      const message = err?.message || err?.data?.message || err?.response?.data?.message || '';
      if (status === 401) notify({ type: 'error', message: message || 'Invalid credentials. Please check your email and password.' });
      else if (status === 403) notify({ type: 'error', message: message || 'You do not have permission to perform this action.' });
      else if (status === 422) {
        const backendErrors = err?.errors || err?.data?.errors || err?.response?.data?.errors;
        let firstFieldMsg = '';
        if (backendErrors && typeof backendErrors === 'object') {
          const fieldErrors = {};
          Object.entries(backendErrors).forEach(([field, arr]) => {
            const key = field === 'password_confirmation' ? 'confirmPassword' : field === 'fullname' ? 'firstName' : field;
            const msg = Array.isArray(arr) ? arr[0] : String(arr);
            fieldErrors[key] = msg;
            if (!firstFieldMsg) firstFieldMsg = msg;
          });
          setErrors(prev => ({ ...prev, ...fieldErrors }));
        }
        notify({ type: 'error', message: firstFieldMsg || message || 'Please correct the highlighted fields.' });
      } else if (status === 429) notify({ type: 'error', message: 'Too many attempts. Please wait a moment and try again.' });
      else if (!status || status === 0) notify({ type: 'error', message: message || 'Unable to reach the server. Please check your internet connection.' });
      else notify({ type: 'error', message: message || 'An unexpected error occurred. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Login Form (inline, standardized) ─────────────────────── */
  const renderLoginForm = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center mb-1 sm:mb-2">
          <img src="/images/logo/logo.svg" alt="MedaGama" className="h-10 sm:h-12 w-auto object-contain" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-0.5">{t(config.titleKey)}</h1>
        <p className="text-xs text-gray-500">{t(config.subtitleKey)}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('auth.emailAddress')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
              className={`w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-xl ${config.inputFocus} focus:ring-2 focus:border-transparent transition-colors text-left text-sm sm:text-base ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={config.placeholder} required
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange}
              className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-xl ${config.inputFocus} focus:ring-2 focus:border-transparent transition-colors text-left text-sm sm:text-base ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••" required
            />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-1.5 text-gray-500">
            <input type="checkbox" className={`rounded border-gray-300 ${config.checkboxColor} w-3.5 h-3.5`} />
            {t('auth.rememberMe')}
          </label>
          <a href="/forgot-password" className={`${config.linkColor} font-medium`}>{t('auth.forgotPassword')}</a>
        </div>
        <button type="submit" disabled={submitting}
          className={`w-full py-2.5 sm:py-3 px-4 rounded-xl focus:ring-4 ${config.btnFocus} transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${submitting ? 'opacity-60 cursor-not-allowed' : ''} ${config.btnBg} text-white`}>
          {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-1">
          {t('auth.gdprNotice').split(t('auth.termsOfService'))[0]}
          <button type="button" onClick={() => setShowTermsPopup(true)} className={`${config.linkColorLight} underline underline-offset-2`}>{t('auth.termsOfService')}</button>{' '}
          <button type="button" onClick={() => setShowPrivacyPopup(true)} className={`${config.linkColorLight} underline underline-offset-2`}>{t('auth.privacyPolicy')}</button>
        </p>
        {config.showGoogleLogin && (
          <>
            <div className="relative my-4 w-full">
              <div className="relative flex justify-center text-sm">
                <span className="text-gray-500">{t('auth.or')}</span>
              </div>
            </div>
            <div id={config.googleBtnId} className="w-full flex items-center justify-center"></div>
          </>
        )}
      </form>
      <div className="mt-4 text-center text-xs text-gray-500">
        {t('auth.dontHaveAccount')}{' '}
        <button type="button" onClick={() => setCurrentPage('register')} className={`${config.linkColor} font-semibold`}>{t('auth.signUp')}</button>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center mb-2.5 font-medium">{t('auth.signInAsDifferentRole', 'Sign in as a different role')}</p>
        <div className="flex gap-2">
          {config.otherLogins.map((link) => {
            const isDoctor = link.href === '/doctor-login';
            const isClinic = link.href === '/clinic-login';
            const isPatient = link.href === '/login';
            const Icon = isDoctor ? Stethoscope : isClinic ? Building2 : Heart;
            const colors = isDoctor
              ? 'border-teal-200 bg-teal-50/60 hover:bg-teal-100 hover:border-teal-400 text-teal-700'
              : isClinic
              ? 'border-purple-200 bg-purple-50/60 hover:bg-purple-100 hover:border-purple-400 text-purple-700'
              : 'border-rose-200 bg-rose-50/60 hover:bg-rose-100 hover:border-rose-400 text-rose-700';
            return (
              <a key={link.href} href={link.href}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 ${colors} text-sm font-semibold transition-all`}>
                <Icon className="w-4 h-4" />
                {t(link.labelKey)}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ─── Left Side Panel ───────────────────────────────────────── */
  const renderLeftSide = () => (
    <div className="text-white">
      <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
        <IconComponent className="w-10 h-10" />
      </div>
      <h2 className="text-4xl font-bold mb-4 leading-tight whitespace-pre-line">{t(config.welcomeKey)}</h2>
      <p className="text-base text-white/80 mb-10 leading-relaxed">{t(config.descKey)}</p>
      <div className="space-y-5">
        {config.featuresKeys.map((f, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
              <f.icon className={`w-5 h-5 ${config.featureIconColor}`} />
            </div>
            <span className="text-white/85 text-sm">{t(f.textKey)}</span>
          </div>
        ))}
      </div>
      {config.showStats && (
        <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
          {[
            { value: '500+', labelKey: 'auth.statClinics' },
            { value: '50K+', labelKey: 'auth.statPatients' },
            { value: '98%', labelKey: 'auth.statSatisfaction' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-white/50 text-xs mt-0.5">{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3 mt-8">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white/80 border border-white/10">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{t('auth.sslSecure')}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white/80 border border-white/10">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{t('auth.gdprCompliant')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{t(config.metaTitleKey)}</title>
        <meta name="description" content={t(config.metaDescKey)} />
        <meta property="og:title" content={t(config.metaTitleKey)} />
        <meta property="og:description" content={t(config.metaDescKey)} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://medagama.com${role === 'patient' ? '/login' : role === 'doctor' ? '/doctor-login' : '/clinic-login'}`} />
      </Helmet>

      <div className="min-h-screen w-full flex relative overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: SVG_PATTERN }} />

        {/* Content */}
        <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16">

            {/* Mobile Layout */}
            <div className="flex flex-col lg:hidden w-full max-w-md mx-auto">
              <div className="w-full bg-white rounded-2xl p-5 sm:p-6 shadow-2xl">
                {currentPage === 'login' ? renderLoginForm() : currentPage === 'register' ? (
                  <RegisterForm
                    formData={formData} errors={errors}
                    showPassword={showPassword} showConfirmPassword={showConfirmPassword}
                    setShowPassword={setShowPassword} setShowConfirmPassword={setShowConfirmPassword}
                    handleInputChange={handleInputChange} handleSubmit={handleSubmit}
                    setCurrentPage={setCurrentPage}
                    setShowTermsPopup={setShowTermsPopup} setShowPrivacyPopup={setShowPrivacyPopup}
                    submitting={submitting}
                  />
                ) : (
                  <ForgotPasswordForm
                    formData={formData} errors={errors}
                    handleInputChange={handleInputChange} handleSubmit={handleSubmit}
                    setCurrentPage={setCurrentPage}
                  />
                )}
              </div>
              <div className="w-full px-2 mt-4 mb-4">
                <div className="flex items-center gap-6 justify-center text-white/70 text-xs">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {t('auth.sslSecure')}</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> {t('auth.gdprCompliant')}</span>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex w-full max-w-6xl items-center justify-center gap-16">
              {/* Left Side */}
              <div className="flex-1 max-w-md text-left">
                {renderLeftSide()}
              </div>
              {/* Right Side - Form */}
              <div className="flex-1 max-w-lg">
                <div className="w-full bg-white rounded-2xl p-5 md:p-6 shadow-2xl">
                  {currentPage === 'login' ? renderLoginForm() : currentPage === 'register' ? (
                    <RegisterForm
                      formData={formData} errors={errors}
                      showPassword={showPassword} showConfirmPassword={showConfirmPassword}
                      setShowPassword={setShowPassword} setShowConfirmPassword={setShowConfirmPassword}
                      handleInputChange={handleInputChange} handleSubmit={handleSubmit}
                      setCurrentPage={setCurrentPage}
                      setShowTermsPopup={setShowTermsPopup} setShowPrivacyPopup={setShowPrivacyPopup}
                      submitting={submitting}
                    />
                  ) : (
                    <ForgotPasswordForm
                      formData={formData} errors={errors}
                      handleInputChange={handleInputChange} handleSubmit={handleSubmit}
                      setCurrentPage={setCurrentPage}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popups */}
        {showTermsPopup && <TermsPopup setShowTermsPopup={setShowTermsPopup} />}
        {showPrivacyPopup && <PrivacyPopup setShowPrivacyPopup={setShowPrivacyPopup} />}
      </div>
    </>
  );
};

export default LoginPage;
