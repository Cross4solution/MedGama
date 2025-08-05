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
  <div className="w-full max-w-sm mx-auto">
    <div className="text-center mb-4 sm:mb-8">
      <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-4">
        <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
        <span className="text-xl sm:text-2xl font-bold text-gray-900">MediTravel</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tekrar Hoş Geldiniz</h1>
      <p className="text-sm sm:text-base text-gray-600">Hesabınıza giriş yapın ve sağlık yolculuğunuza devam edin</p>
    </div>
    <div className="space-y-3 sm:space-y-6 flex flex-col items-center">
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
          E-posta
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
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
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
      <div className="flex items-center justify-between w-full">
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
                  className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm hover:shadow-md"
      >
        Giriş Yap
      </button>
      <div className="relative my-6 w-full">
        <div className="relative flex justify-center text-sm">
          <span className="text-gray-500">veya</span>
        </div>
      </div>
      <div className="w-full">
        <button
          type="button"
          className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">Google ile Devam Et</span>
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