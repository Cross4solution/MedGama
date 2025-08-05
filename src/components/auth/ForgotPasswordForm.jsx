import React from 'react';
import {
  Heart,
  Mail
} from 'lucide-react';

const ForgotPasswordForm = ({ 
  formData, 
  errors, 
  handleInputChange, 
  handleSubmit, 
  setCurrentPage 
}) => (
  <div className="w-full max-w-lg mx-auto">
    <div className="text-center mb-2 sm:mb-3">
      <div className="flex items-center justify-center space-x-2 mb-1 sm:mb-2">
        <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
        <span className="text-lg sm:text-xl font-bold text-gray-900">MediTravel</span>
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Şifre Sıfırlama</h1>
      <p className="text-xs sm:text-sm text-gray-600">E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim</p>
    </div>
    <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-2 flex flex-col items-center">
      <div className="w-full max-w-md">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center">
          E-posta Adresi
        </label>
        <div className="relative">
          <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full pl-6 sm:pl-8 pr-4 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="ornek@email.com"
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1 text-center">{errors.email}</p>}
      </div>
      <button
        type="submit"
                  className="w-full max-w-md bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md"
      >
        Şifre Sıfırlama Bağlantısı Gönder
      </button>
      <p className="text-center text-xs text-gray-600">
        Giriş sayfasına dönmek için{' '}
        <button
          type="button"
          onClick={() => setCurrentPage('login')}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          tıklayın
        </button>
      </p>
    </form>
  </div>
);

export default ForgotPasswordForm; 