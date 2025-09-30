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
  const { login, register, demoLogin } = useAuth();
  const { notify } = useToast();

  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'register', or 'forgot-password'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneCode: '+90',
    phone: '',
    birthDate: '',
    city: '',
    acceptTerms: false,
    receiveUpdates: false
  });
  const [errors, setErrors] = useState({});

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
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (currentPage === 'register') {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (formData.phone && !/^\s*\+\d{1,3}[\s\d()-]*$/.test(formData.phone)) {
        newErrors.phone = 'Ülke kodunuzu giriniz (örn. +90 555 123 45 67)';
      }
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the Terms of Use';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = validateForm();
    if (!ok) return;
    try {
      if (currentPage === 'login') {
        const res = await login(formData.email, formData.password);
        notify({ type: 'success', message: res?.message || 'Login successful' });
        navigate('/home-v2');
      } else if (currentPage === 'register') {
        const res = await register(formData.email, formData.password, formData.confirmPassword);
        notify({ type: 'success', message: res?.message || 'Registration successful. Please login.' });
        navigate('/login');
      } else {
        notify({ type: 'info', message: 'Password reset link sent if the email exists.' });
      }
    } catch (err) {
      if (err?.status === 401) {
        notify({ type: 'error', message: err?.data?.message || 'Invalid credentials' });
      } else if (err?.status === 422 && err?.data?.errors) {
        const fieldErrors = {};
        Object.entries(err.data.errors).forEach(([field, arr]) => {
          fieldErrors[field] = Array.isArray(arr) ? arr[0] : String(arr);
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        notify({ type: 'error', message: err?.data?.message || 'Validation error' });
      } else {
        notify({ type: 'error', message: err?.message || 'Unexpected error' });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700" />

      {/* Form Container */}
      <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-4">
          {/* Mobile Layout: Form + Info Texts */}
          <div className="flex flex-col lg:hidden w-full max-w-md mx-auto py-3">
            {/* Mobile Form */}
            <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl p-3 sm:p-5 shadow-2xl border border-white/30 mb-4">
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
                  />
                  <button
                    type="button"
                    onClick={() => { demoLogin('patient'); navigate('/home-v2'); }}
                    className="w-full mt-3 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Demo Login (Patient)
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
            {/* Info texts under the form (mobile) */}
            <div className="w-full px-3 mt-1">
              <h2 className="text-base font-semibold text-white mb-1">Welcome to Medigama</h2>
              <p className="text-xs text-teal-100 mb-2">Trusted healthcare services with expert doctors and modern treatments.</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li className="text-teal-50">Expert medical team</li>
                <li className="text-teal-50">Safe and fast service</li>
                <li className="text-teal-50">24/7 patient support</li>
              </ul>
            </div>
            

          </div>
          
          {/* Desktop Layout: Side by Side */}
          <div className="hidden lg:flex w-full max-w-6xl items-center justify-center gap-12">
            {/* Left Side - Illustration/Info */}
            <div className="flex-1 max-w-lg text-left">
              <div className="mb-8 text-white">
                <div className="w-28 h-28 bg-white/15 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-16 h-16" />
                </div>
                <h2 className="text-4xl font-bold mb-3">Welcome to Medigama</h2>
                <p className="text-lg text-teal-100 mb-8">Discover trusted healthcare services, expert doctors and modern treatment methods in one place.</p>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-white/90">Expert medical team</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-white/90">Secure and fast service</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                    <span className="text-white/90">24/7 patient support</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[{value:'500+',label:'Clinics'},{value:'50K+',label:'Patients'},{value:'98%',label:'Satisfaction'}].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl font-bold">{s.value}</div>
                      <div className="text-teal-100 text-sm">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                <div className="flex space-x-4 mt-6">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">SSL Secure</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Form */}
            <div className="flex-1 max-w-3xl">
              <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-white/30">
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
                    />
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => { demoLogin('patient'); navigate('/home-v2'); }}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
                      >
                        Demo Login (Patient)
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