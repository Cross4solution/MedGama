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
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Handle form submission
    }
  };

  const LoginForm = () => (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Heart className="w-10 h-10 text-green-500" />
          <span className="text-2xl font-bold text-gray-900">MediTravel</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tekrar Hoş Geldiniz</h1>
        <p className="text-gray-600">Hesabınıza giriş yapın ve sağlık yolculuğunuza devam edin</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-posta Adresi
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ornek@email.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Şifre
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Beni hatırla</span>
          </label>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Şifremi unuttum
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold"
        >
          Giriş Yap
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">veya</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Chrome className="w-5 h-5 text-red-500" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Heart className="w-10 h-10 text-green-500" />
          <span className="text-2xl font-bold text-gray-900">MediTravel</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hesap Oluşturun</h1>
        <p className="text-gray-600">Sağlık yolculuğunuza başlamak için kayıt olun</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Adınız"
              />
            </div>
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soyad
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Soyadınız"
              />
            </div>
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-posta Adresi
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ornek@email.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+90 555 123 45 67"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doğum Tarihi
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Şehir
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre Tekrar
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
              />
              <span className="text-sm text-gray-600">
                <span className="text-red-500">*</span>
                {' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Kullanım Şartları</a>
                {' '}ve{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Gizlilik Politikası</a>
                'nı okudum ve kabul ediyorum.
              </span>
            </label>
            {errors.acceptTerms && <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>}
          </div>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              name="receiveUpdates"
              checked={formData.receiveUpdates}
              onChange={handleInputChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
            />
            <span className="text-sm text-gray-600">
              Sağlık ipuçları, yeni hizmetler ve özel teklifler hakkında e-posta almak istiyorum.
            </span>
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 focus:ring-4 focus:ring-green-200 transition-all duration-200 font-semibold"
        >
          Hesap Oluştur
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">veya</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Chrome className="w-5 h-5 text-red-500" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left Side - Illustration/Info */}
        <div className="flex-1 max-w-lg text-center lg:text-left">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto lg:mx-0 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Sağlığınız Bizim Önceliğimiz
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Güvenilir sağlık hizmetleri, uzman doktorlar ve modern tedavi yöntemleri ile yanınızdayız.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-700">Uzman doktor kadrosu</span>
            </div>
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-700">Güvenli ve hızlı hizmet</span>
            </div>
            <div className="flex items-center space-x-3 justify-center lg:justify-start">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-700">24/7 destek hizmeti</span>
            </div>
          </div>
        </div>
        {/* Right Side - Form */}
        <div className="flex-1 w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
            {currentPage === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
      {/* Back to Home */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-6 left-6 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
    </div>
  );
};

export default AuthPages; 