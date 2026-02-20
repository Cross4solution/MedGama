import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Heart, CheckCircle, Shield } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import TermsPopup from '../components/auth/TermsPopup';
import PrivacyPopup from '../components/auth/PrivacyPopup';

const AuthPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, registerDoctor, demoLogin } = useAuth();
  const { notify } = useToast();

  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'register', or 'forgot-password'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);

  const [formData, setFormData] = useState({
    role: 'patient',
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
    receiveUpdates: false
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (location.pathname === '/register') {
      setCurrentPage('register');
    } else if (location.pathname === '/login' || location.pathname === '/auth') {
      setCurrentPage('login');
    }
  }, [location.pathname]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'E-posta adresi gereklidir.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin.';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalıdır.';
    }

    if (currentPage === 'register') {
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Şifre tekrarı gereklidir.';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Şifreler eşleşmiyor.';
      if (!formData.acceptTerms) newErrors.acceptTerms = 'Kullanım Koşullarını kabul etmelisiniz.';
      if (!formData.acceptPrivacy) newErrors.acceptPrivacy = 'Gizlilik Politikasını kabul etmelisiniz.';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentErrors = validateForm();
    if (Object.keys(currentErrors).length) {
      const firstKey = Object.keys(currentErrors)[0];
      const msg = firstKey ? (currentErrors[firstKey] || 'Lütfen işaretli alanları düzeltin.') : 'Lütfen işaretli alanları düzeltin.';
      notify({ type: 'error', message: msg });
      return;
    }
    try {
      setSubmitting(true);
      if (currentPage === 'login') {
        const res = await login(formData.email, formData.password, !!formData.rememberMe);
        if (res?.requires_email_verification) {
          notify({ type: 'info', message: 'Lütfen e-posta adresinizi doğrulayın.' });
          navigate('/verify-email');
        } else {
          notify({ type: 'success', message: 'Giriş başarılı!' });
          navigate('/dashboard');
        }
      } else if (currentPage === 'register') {
        if (formData.role === 'clinic') {
          notify({ type: 'info', message: 'Klinik kaydı yakında aktif olacaktır. Lütfen klinik portalından giriş yapın.' });
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
        // If auto-verified (demo mode), go straight to dashboard
        const needsVerification = res?.requires_email_verification ?? res?.data?.requires_email_verification;
        if (needsVerification === false) {
          notify({ type: 'success', message: 'Kayıt başarılı! E-posta adresiniz otomatik olarak doğrulandı.' });
          navigate('/dashboard');
        } else {
          notify({ type: 'success', message: 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.' });
          navigate('/verify-email');
        }
      } else {
        notify({ type: 'info', message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
      }
    } catch (err) {
      // Extract message from various error shapes
      const status = err?.status || err?.response?.status || 0;
      const message = err?.message || err?.data?.message || err?.response?.data?.message || '';

      if (status === 401) {
        notify({ type: 'error', message: 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.' });
      } else if (status === 403) {
        notify({ type: 'error', message: 'Bu işlemi gerçekleştirme yetkiniz bulunmuyor.' });
      } else if (status === 422) {
        const backendErrors = err?.errors || err?.data?.errors || err?.response?.data?.errors;
        if (backendErrors && typeof backendErrors === 'object') {
          const fieldErrors = {};
          Object.entries(backendErrors).forEach(([field, arr]) => {
            const key = field === 'password_confirmation' ? 'confirmPassword'
              : field === 'fullname' ? 'firstName'
              : field;
            fieldErrors[key] = Array.isArray(arr) ? arr[0] : String(arr);
          });
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
        notify({ type: 'error', message: message || 'Lütfen işaretli alanları düzeltin.' });
      } else if (status === 429) {
        notify({ type: 'error', message: 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.' });
      } else if (!status || status === 0) {
        notify({ type: 'error', message: 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.' });
      } else {
        notify({ type: 'error', message: message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800" />
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />

      {/* Content */}
      <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16">

          {/* Mobile Layout */}
          <div className="flex flex-col lg:hidden w-full max-w-md mx-auto">
            <div className="w-full bg-white rounded-2xl p-5 sm:p-6 shadow-2xl">
              {currentPage === 'login' ? (
                <>
                  <LoginForm 
                    formData={formData}
                    errors={errors}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    setCurrentPage={setCurrentPage}
                    googleId="googleBtnPatientMobile"
                    submitting={submitting}
                    setShowTermsPopup={setShowTermsPopup}
                    setShowPrivacyPopup={setShowPrivacyPopup}
                  />
                  <button
                    type="button"
                    onClick={() => { demoLogin('patient'); navigate('/home-v2'); }}
                    className="w-full mt-4 bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    Try Demo
                  </button>
                </>
              ) : currentPage === 'register' ? (
                <RegisterForm 
                  formData={formData}
                  errors={errors}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowPassword={setShowPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  setCurrentPage={setCurrentPage}
                  setShowTermsPopup={setShowTermsPopup}
                  setShowPrivacyPopup={setShowPrivacyPopup}
                />
              ) : (
                <ForgotPasswordForm 
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  setCurrentPage={setCurrentPage}
                />
              )}
            </div>
            <div className="w-full px-2 mt-4 mb-4">
              <div className="flex items-center gap-6 justify-center text-white/70 text-xs">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> SSL Secure</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> GDPR Compliant</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden lg:flex w-full max-w-6xl items-center justify-center gap-16">
            {/* Left Side */}
            <div className="flex-1 max-w-md text-left">
              <div className="text-white">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                  <Heart className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-bold mb-4 leading-tight">Welcome to<br />MedaGama</h2>
                <p className="text-base text-teal-100/90 mb-10 leading-relaxed">Your trusted platform for healthcare services, expert doctors, and modern treatment methods — all in one place.</p>

                {/* Features */}
                <div className="space-y-5">
                  {[
                    { icon: CheckCircle, text: 'Expert medical team with verified credentials' },
                    { icon: Shield, text: 'Secure, encrypted & GDPR-compliant' },
                    { icon: Heart, text: '24/7 patient support & telehealth' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
                        <f.icon className="w-5 h-5 text-teal-200" />
                      </div>
                      <span className="text-white/85 text-sm">{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
                  {[{value:'500+',label:'Clinics'},{value:'50K+',label:'Patients'},{value:'98%',label:'Satisfaction'}].map((s, i) => (
                    <div key={i}>
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-teal-200/70 text-xs mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                <div className="flex gap-3 mt-8">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white/80 border border-white/10">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">SSL Secure</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white/80 border border-white/10">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">GDPR Compliant</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Form */}
            <div className="flex-1 max-w-lg">
              <div className="w-full bg-white rounded-2xl p-5 md:p-6 shadow-2xl">
                {currentPage === 'login' ? (
                  <>
                    <LoginForm 
                      formData={formData}
                      errors={errors}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      handleInputChange={handleInputChange}
                      handleSubmit={handleSubmit}
                      setCurrentPage={setCurrentPage}
                      googleId="googleBtnPatientDesktop"
                      submitting={submitting}
                      setShowTermsPopup={setShowTermsPopup}
                      setShowPrivacyPopup={setShowPrivacyPopup}
                    />
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => { demoLogin('patient'); navigate('/home-v2'); }}
                        className="w-full bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 border border-gray-200 transition-colors"
                      >
                        Try Demo
                      </button>
                    </div>
                  </>
                ) : currentPage === 'register' ? (
                  <RegisterForm 
                    formData={formData}
                    errors={errors}
                    showPassword={showPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowPassword={setShowPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    setCurrentPage={setCurrentPage}
                    setShowTermsPopup={setShowTermsPopup}
                    setShowPrivacyPopup={setShowPrivacyPopup}
                    submitting={submitting}
                  />
                ) : (
                  <ForgotPasswordForm 
                    formData={formData}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
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
  );
};

export default AuthPages; 