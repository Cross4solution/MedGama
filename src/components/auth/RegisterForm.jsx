import React from 'react';
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
  Chrome,
  Facebook,
  Smartphone
} from 'lucide-react';

const RegisterForm = ({ 
  formData, 
  errors, 
  showPassword, 
  showConfirmPassword,
  setShowPassword, 
  setShowConfirmPassword,
  handleInputChange, 
  handleSubmit, 
  setCurrentPage,
  setShowTermsPopup,
  setShowPrivacyPopup
}) => (
  <div className="w-full max-w-2xl mx-auto">
    <div className="text-center mb-2 sm:mb-3">
      <div className="flex items-center justify-center space-x-2 mb-1 sm:mb-2">
        <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
        <span className="text-lg sm:text-xl font-bold text-gray-900">MediTravel</span>
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Hesap Oluşturun</h1>
      <p className="text-xs sm:text-sm text-gray-600">Sağlık yolculuğunuza başlamak için kayıt olun</p>
    </div>
    <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-2 flex flex-col items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 w-full max-w-2xl">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Ad
          </label>
          <div className="relative">
            <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full pl-6 sm:pl-8 pr-4 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Adınız"
            />
          </div>
          {errors.firstName && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Soyad
          </label>
          <div className="relative">
            <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full pl-6 sm:pl-8 pr-4 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Soyadınız"
            />
          </div>
          {errors.lastName && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.lastName}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 w-full max-w-2xl">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
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
          {errors.email && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Telefon
          </label>
          <div className="relative">
            <Phone className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full pl-6 sm:pl-8 pr-4 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+90 555 123 45 67"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.phone}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 w-full max-w-2xl">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Şehir
          </label>
          <div className="relative">
            <MapPin className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full pl-6 sm:pl-8 pr-4 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Şehir seçiniz</option>
              <option value="Adana">Adana</option>
              <option value="Adıyaman">Adıyaman</option>
              <option value="Afyonkarahisar">Afyonkarahisar</option>
              <option value="Ağrı">Ağrı</option>
              <option value="Amasya">Amasya</option>
              <option value="Ankara">Ankara</option>
              <option value="Antalya">Antalya</option>
              <option value="Artvin">Artvin</option>
              <option value="Aydın">Aydın</option>
              <option value="Balıkesir">Balıkesir</option>
              <option value="Bilecik">Bilecik</option>
              <option value="Bingöl">Bingöl</option>
              <option value="Bitlis">Bitlis</option>
              <option value="Bolu">Bolu</option>
              <option value="Burdur">Burdur</option>
              <option value="Bursa">Bursa</option>
              <option value="Çanakkale">Çanakkale</option>
              <option value="Çankırı">Çankırı</option>
              <option value="Çorum">Çorum</option>
              <option value="Denizli">Denizli</option>
              <option value="Diyarbakır">Diyarbakır</option>
              <option value="Edirne">Edirne</option>
              <option value="Elazığ">Elazığ</option>
              <option value="Erzincan">Erzincan</option>
              <option value="Erzurum">Erzurum</option>
              <option value="Eskişehir">Eskişehir</option>
              <option value="Gaziantep">Gaziantep</option>
              <option value="Giresun">Giresun</option>
              <option value="Gümüşhane">Gümüşhane</option>
              <option value="Hakkari">Hakkari</option>
              <option value="Hatay">Hatay</option>
              <option value="Isparta">Isparta</option>
              <option value="Mersin">Mersin</option>
              <option value="İstanbul">İstanbul</option>
              <option value="İzmir">İzmir</option>
              <option value="Kars">Kars</option>
              <option value="Kastamonu">Kastamonu</option>
              <option value="Kayseri">Kayseri</option>
              <option value="Kırklareli">Kırklareli</option>
              <option value="Kırşehir">Kırşehir</option>
              <option value="Kocaeli">Kocaeli</option>
              <option value="Konya">Konya</option>
              <option value="Kütahya">Kütahya</option>
              <option value="Malatya">Malatya</option>
              <option value="Manisa">Manisa</option>
              <option value="Kahramanmaraş">Kahramanmaraş</option>
              <option value="Mardin">Mardin</option>
              <option value="Muğla">Muğla</option>
              <option value="Muş">Muş</option>
              <option value="Nevşehir">Nevşehir</option>
              <option value="Niğde">Niğde</option>
              <option value="Ordu">Ordu</option>
              <option value="Rize">Rize</option>
              <option value="Sakarya">Sakarya</option>
              <option value="Samsun">Samsun</option>
              <option value="Siirt">Siirt</option>
              <option value="Sinop">Sinop</option>
              <option value="Sivas">Sivas</option>
              <option value="Tekirdağ">Tekirdağ</option>
              <option value="Tokat">Tokat</option>
              <option value="Trabzon">Trabzon</option>
              <option value="Tunceli">Tunceli</option>
              <option value="Şanlıurfa">Şanlıurfa</option>
              <option value="Uşak">Uşak</option>
              <option value="Van">Van</option>
              <option value="Yozgat">Yozgat</option>
              <option value="Zonguldak">Zonguldak</option>
              <option value="Aksaray">Aksaray</option>
              <option value="Bayburt">Bayburt</option>
              <option value="Karaman">Karaman</option>
              <option value="Kırıkkale">Kırıkkale</option>
              <option value="Batman">Batman</option>
              <option value="Şırnak">Şırnak</option>
              <option value="Bartın">Bartın</option>
              <option value="Ardahan">Ardahan</option>
              <option value="Iğdır">Iğdır</option>
              <option value="Yalova">Yalova</option>
              <option value="Karabük">Karabük</option>
              <option value="Kilis">Kilis</option>
              <option value="Osmaniye">Osmaniye</option>
              <option value="Düzce">Düzce</option>
            </select>
          </div>
          {errors.city && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Doğum Tarihi
          </label>
          <div className="relative">
            <Calendar className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="w-full pl-6 sm:pl-8 pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2 w-full max-w-2xl">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Şifre
          </label>
          <div className="relative">
            <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-6 sm:pl-8 pr-8 sm:pr-10 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Şifrenizi girin"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.password}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Şifre Tekrar
          </label>
          <div className="relative">
            <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full pl-6 sm:pl-8 pr-8 sm:pr-10 py-1.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-xs sm:text-sm ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Şifrenizi tekrar girin"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.confirmPassword}</p>}
        </div>
      </div>
      <div className="space-y-1 sm:space-y-2 w-full max-w-2xl">
        <div>
          <label className="flex items-start space-x-1 sm:space-x-2 justify-center md:justify-start">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <span className="text-xs text-gray-600 text-center md:text-left leading-tight">
              <span className="text-red-500">*</span>
              {' '}
              <button
                type="button"
                onClick={() => setShowTermsPopup(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Kullanım Şartları
              </button>
              {' '}ve{' '}
              <button
                type="button"
                onClick={() => setShowPrivacyPopup(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Gizlilik Politikası
              </button>
              'nı okudum ve kabul ediyorum.
            </span>
          </label>
          {errors.acceptTerms && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.acceptTerms}</p>}
        </div>
        <label className="flex items-start space-x-1 sm:space-x-2 justify-center md:justify-start">
          <input
            type="checkbox"
            name="receiveUpdates"
            checked={formData.receiveUpdates}
            onChange={handleInputChange}
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
          />
          <span className="text-xs text-gray-600 text-center md:text-left leading-tight">
            Sağlık ipuçları, yeni hizmetler ve özel teklifler hakkında e-posta almak istiyorum.
          </span>
        </label>
      </div>
      <button
        type="submit"
        className="w-full max-w-2xl bg-green-500 text-white py-1.5 sm:py-2 px-4 rounded-lg hover:bg-green-600 focus:ring-4 focus:ring-green-200 transition-all duration-200 font-semibold text-xs sm:text-sm"
      >
        Hesap Oluştur
      </button>
      <div className="relative my-2 sm:my-3 w-full max-w-2xl">
        <div className="relative flex justify-center text-xs">
          <span className="text-gray-500">veya</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full max-w-2xl">
        <button
          type="button"
          className="flex items-center justify-center py-1 sm:py-1.5 px-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Chrome className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
        </button>
        <button
          type="button"
          className="flex items-center justify-center py-1 sm:py-1.5 px-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Facebook className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
        </button>
        <button
          type="button"
          className="flex items-center justify-center py-1 sm:py-1.5 px-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-900" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-600">
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

export default RegisterForm; 