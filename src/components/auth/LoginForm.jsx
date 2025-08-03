import React from 'react';
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Chrome,
  Facebook,
  Smartphone
} from 'lucide-react';

const LoginForm = ({ 
  formData, 
  errors, 
  showPassword, 
  setShowPassword, 
  handleInputChange, 
  handleSubmit, 
  setCurrentPage 
}) => (
  <div className="w-full max-w-lg mx-auto">
    <div className="text-center mb-4 sm:mb-8">
      <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-4">
        <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
        <span className="text-xl sm:text-2xl font-bold text-gray-900">MediTravel</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tekrar Hoş Geldiniz</h1>
      <p className="text-sm sm:text-base text-gray-600">Hesabınıza giriş yapın ve sağlık yolculuğunuza devam edin</p>
    </div>
    <div className="space-y-3 sm:space-y-6 flex flex-col items-center">
      <div className="w-full max-w-md">
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
            className={`w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm sm:text-base ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="ornek@email.com"
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1 text-center">{errors.email}</p>}
      </div>
      <div className="w-full max-w-md">
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
            className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm sm:text-base ${
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
      <div className="flex items-center justify-between w-full max-w-md">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-xs sm:text-sm text-gray-600">Beni hatırla</span>
        </label>
        <button
          type="button"
          onClick={() => setCurrentPage('forgot-password')}
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Şifremi unuttum
        </button>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full max-w-md bg-blue-600 text-white py-2 sm:py-1.5 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-sm sm:text-base"
      >
        Giriş Yap
      </button>
      <div className="relative my-6 w-full max-w-md">
        <div className="relative flex justify-center text-sm">
          <span className="text-gray-500">veya</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
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

export default LoginForm; 