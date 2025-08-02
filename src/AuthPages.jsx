import React, { useState } from 'react';
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  ArrowLeft,
  Chrome,
  Facebook,
  Smartphone
} from 'lucide-react';

const AuthPages = () => {
  const [currentPage, setCurrentPage] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
 
    if (!formData.password) {
      newErrors.password = 'Şifre gerekli';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }
 
    if (currentPage === 'register') {
      if (!formData.firstName) newErrors.firstName = 'Ad gerekli';
      if (!formData.lastName) newErrors.lastName = 'Soyad gerekli';
      if (!formData.phone) newErrors.phone = 'Telefon numarası gerekli';
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifre tekrarı gerekli';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'Kullanım şartlarını kabul etmelisiniz';
      }
    }
 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Tasarım amaçlı - direkt ana sayfaya yönlendir
    window.location.href = '/home';
  };

  const LoginForm = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4 sm:mb-8">
        <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-4">
          <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
          <span className="text-xl sm:text-2xl font-bold text-gray-900">MediTravel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tekrar Hoş Geldiniz</h1>
        <p className="text-sm sm:text-base text-gray-600">Hesabınıza giriş yapın ve sağlık yolculuğunuza devam edin</p>
      </div>
      <div className="space-y-3 sm:space-y-6 flex flex-col items-center">
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            E-posta Adresi
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-sm sm:text-base ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ornek@email.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1 text-center">{errors.email}</p>}
        </div>
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Şifre
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-sm sm:text-base ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Şifrenizi girin"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1 text-center">{errors.password}</p>}
        </div>
                <div className="flex items-center justify-between w-full max-w-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm text-gray-600">Beni hatırla</span>
          </label>
          <button
            type="button"
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Şifremi unuttum
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full max-w-sm bg-blue-600 text-white py-2 sm:py-1.5 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-sm sm:text-base"
        >
          Giriş Yap
        </button>
        <div className="relative my-6 w-full max-w-sm">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">veya</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <button
            type="button"
            className="flex items-center justify-center py-1.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Chrome className="w-5 h-5 text-red-500" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-1.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-1.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Smartphone className="w-5 h-5 text-gray-900" />
          </button>
        </div>
        <p className="text-center text-sm text-gray-600">
          Hesabınız yok mu?{' '}
          <button
            type="button"
            onClick={() => setCurrentPage('register')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Kayıt olun
          </button>
        </p>
      </div>
    </div>
  );

  const RegisterForm = () => (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-4 sm:mb-8">
        <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-4">
          <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
          <span className="text-xl sm:text-2xl font-bold text-gray-900">MediTravel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Hesap Oluşturun</h1>
        <p className="text-sm sm:text-base text-gray-600 text-center">Sağlık yolculuğunuza başlamak için kayıt olun</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6 flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 w-full max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Ad
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center md:text-left ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Adınız"
              />
            </div>
            {errors.firstName && <p className="text-red-500 text-sm mt-1 text-center md:text-left">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Soyad
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center md:text-left ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Soyadınız"
              />
            </div>
            {errors.lastName && <p className="text-red-500 text-sm mt-1 text-center md:text-left">{errors.lastName}</p>}
          </div>
        </div>
        <div className="w-full max-w-2xl">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            E-posta Adresi
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ornek@email.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1 text-center">{errors.email}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Telefon
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center md:text-left ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+90 555 123 45 67"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-sm mt-1 text-center md:text-left">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Doğum Tarihi
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center md:text-left"
              />
            </div>
          </div>
        </div>
        <div className="w-full max-w-2xl">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Şehir
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center"
            >
              <option value="">Şehir seçin</option>
              <option value="istanbul">İstanbul</option>
              <option value="ankara">Ankara</option>
              <option value="izmir">İzmir</option>
              <option value="bursa">Bursa</option>
              <option value="antalya">Antalya</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center md:text-left ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Şifrenizi girin"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1 text-center md:text-left">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Şifre Tekrar
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center md:text-left ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Şifrenizi tekrar girin"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 text-center md:text-left">{errors.confirmPassword}</p>}
          </div>
        </div>
        <div className="space-y-4 w-full max-w-2xl">
          <div>
            <label className="flex items-start space-x-3 justify-center md:justify-start">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
              />
              <span className="text-sm text-gray-600 text-center md:text-left">
                <span className="text-red-500">*</span>
                {' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Kullanım Şartları</a>
                {' '}ve{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Gizlilik Politikası</a>
                'nı okudum ve kabul ediyorum.
              </span>
            </label>
            {errors.acceptTerms && <p className="text-red-500 text-sm mt-1 text-center md:text-left">{errors.acceptTerms}</p>}
          </div>
          <label className="flex items-start space-x-3 justify-center md:justify-start">
            <input
              type="checkbox"
              name="receiveUpdates"
              checked={formData.receiveUpdates}
              onChange={handleInputChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
            />
            <span className="text-sm text-gray-600 text-center md:text-left">
              Sağlık ipuçları, yeni hizmetler ve özel teklifler hakkında e-posta almak istiyorum.
            </span>
          </label>
        </div>
        <button
          type="submit"
          className="w-full max-w-2xl bg-green-500 text-white py-1.5 px-4 rounded-lg hover:bg-green-600 focus:ring-4 focus:ring-green-200 transition-all duration-200 font-semibold"
        >
          Hesap Oluştur
        </button>
        <div className="relative my-6 w-full max-w-2xl">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">veya</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
          <button
            type="button"
            className="flex items-center justify-center py-1.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Chrome className="w-5 h-5 text-red-500" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-1.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-1.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Smartphone className="w-5 h-5 text-gray-900" />
          </button>
        </div>
        <p className="text-center text-sm text-gray-600">
          Zaten hesabınız var mı?{' '}
          <button
            type="button"
            onClick={() => setCurrentPage('login')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Giriş yapın
          </button>
        </p>
      </form>
    </div>
  );

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
      <div className="relative z-10 flex w-full min-h-screen items-center justify-center p-2 sm:p-6">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-12">
          {/* Mobile Layout: Logo (top-left) + Form + Features (below form) */}
          <div className="flex flex-col lg:hidden w-full max-w-md mx-auto">
            {/* Mobile Logo - Top Left */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="text-lg font-bold text-white">MediTravel</span>
            </div>
            
            {/* Mobile Form */}
            <div className="w-full bg-white/95 backdrop-blur-xl rounded-xl p-3 shadow-2xl border border-white/30 mb-4">
              {currentPage === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>
            
            {/* Mobile Features - Below Form */}
            <div className="text-left">
              {/* Large Heart Icon */}
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mb-3">
                <Heart className="w-10 h-10 text-teal-600" />
              </div>
              
              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-2 text-center">
                Sağlığınız Bizim Önceliğimiz
              </h2>
              
              {/* Description */}
              <p className="text-xs text-teal-100 mb-4">
                Güvenilir sağlık hizmetleri, uzman doktorlar ve modern tedavi yöntemleri ile yanınızdayız.
              </p>
              
              {/* Features List */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-teal-600" />
                  </div>
                  <span className="text-xs text-teal-100">Uzman doktor kadrosu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-teal-600" />
                  </div>
                  <span className="text-xs text-teal-100">Güvenli ve hızlı hizmet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-teal-600" />
                  </div>
                  <span className="text-xs text-teal-100">24/7 destek hizmeti</span>
                </div>
              </div>
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
                  Sağlığınız Bizim Önceliğimiz
                </h2>
                <p className="text-lg text-teal-100 mb-6">
                  Güvenilir sağlık hizmetleri, uzman doktorlar ve modern tedavi yöntemleri ile yanınızdayız.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-teal-100">Uzman doktor kadrosu</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-teal-100">Güvenli ve hızlı hizmet</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-teal-100">24/7 destek hizmeti</span>
                </div>
              </div>
            </div>
            {/* Right Side - Form */}
            <div className="flex-1 w-full">
              <div className="w-full max-w-2xl xl:max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
                {currentPage === 'login' ? <LoginForm /> : <RegisterForm />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPages; 