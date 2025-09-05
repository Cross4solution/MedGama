import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  CheckCircle,
  Shield
} from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import TermsPopup from '../components/auth/TermsPopup';
import PrivacyPopup from '../components/auth/PrivacyPopup';

const AuthPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
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
    phone: '',
    birthDate: '',
    city: '',
    acceptTerms: false,
    receiveUpdates: false
  });
  const [errors, setErrors] = useState({});

  // Sync current page with route so /register opens Register form by default
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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
 
    if (currentPage === 'register') {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'You must accept the Terms of Use';
      }
    }
 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo: mock login ve patient-home'a yönlendir
    login();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)'
      }}>
        {/* Floating circles */}
        <div className="absolute top-10 left-10 w-24 h-24 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-4 sm:right-16 lg:right-32 w-32 h-32 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-16 left-1/4 w-28 h-28 sm:w-56 sm:h-56 lg:w-72 lg:h-72 bg-white/10 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute bottom-8 right-4 sm:right-12 lg:right-20 w-20 h-20 sm:w-40 sm:h-40 lg:w-56 lg:h-56 bg-white/15 rounded-full blur-xl animate-pulse delay-700"></div>

        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-2 sm:left-6 lg:left-10 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-white/20 rotate-45 animate-bounce delay-300"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-white/25 rotate-12 animate-bounce delay-500"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 sm:w-3 sm:h-3 lg:w-5 lg:h-5 bg-white/30 rotate-45 animate-bounce delay-700"></div>
        <div className="absolute bottom-1/4 right-3 sm:right-6 lg:right-12 w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-white/35 rotate-12 animate-bounce delay-900"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      {/* Form Container */}
      <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-4">
          {/* Mobile Layout: Form + Info Texts */}
          <div className="flex flex-col lg:hidden w-full max-w-md mx-auto py-3">
            {/* Mobile Form */}
            <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl p-3 sm:p-5 shadow-2xl border border-white/30 mb-4">
              {currentPage === 'login' ? (
                <LoginForm 
                  formData={formData}
                  errors={errors}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  setCurrentPage={setCurrentPage}
                />
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
              <h2 className="text-base font-semibold text-white mb-1">Your Health is Our Priority</h2>
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
              <div className="mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-16 h-16 text-teal-600" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Your Health is Our Priority
                </h2>
                <p className="text-lg text-teal-100 mb-8">
                  We are here with trusted healthcare services, expert doctors, and modern treatment methods.
                </p>
                
                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-white">Expert medical team</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-white">Safe and fast service</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-white">24/7 patient support</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Form */}
            <div className="flex-1 max-w-3xl">
              <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-white/30">
                {currentPage === 'login' ? (
                  <LoginForm 
                    formData={formData}
                    errors={errors}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    setCurrentPage={setCurrentPage}
                  />
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