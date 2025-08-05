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
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
            Şehir
          </label>
          <div className="relative group">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 z-10" />
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-left text-sm font-medium appearance-none cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400 ${
                errors.city 
                  ? 'border-red-300 focus:ring-red-100 focus:border-red-500' 
                  : 'border-gray-200'
              } ${formData.city ? 'text-gray-900' : 'text-gray-500'}`}
            >
              <option value="" className="text-gray-500">Şehir seçiniz</option>
              <option value="Adana" className="py-2">Adana</option>
              <option value="Adıyaman" className="py-2">Adıyaman</option>
              <option value="Afyonkarahisar" className="py-2">Afyonkarahisar</option>
              <option value="Ağrı" className="py-2">Ağrı</option>
              <option value="Amasya" className="py-2">Amasya</option>
              <option value="Ankara" className="py-2">Ankara</option>
              <option value="Antalya" className="py-2">Antalya</option>
              <option value="Artvin" className="py-2">Artvin</option>
              <option value="Aydın" className="py-2">Aydın</option>
              <option value="Balıkesir" className="py-2">Balıkesir</option>
              <option value="Bilecik" className="py-2">Bilecik</option>
              <option value="Bingöl" className="py-2">Bingöl</option>
              <option value="Bitlis" className="py-2">Bitlis</option>
              <option value="Bolu" className="py-2">Bolu</option>
              <option value="Burdur" className="py-2">Burdur</option>
              <option value="Bursa" className="py-2">Bursa</option>
              <option value="Çanakkale" className="py-2">Çanakkale</option>
              <option value="Çankırı" className="py-2">Çankırı</option>
              <option value="Çorum" className="py-2">Çorum</option>
              <option value="Denizli" className="py-2">Denizli</option>
              <option value="Diyarbakır" className="py-2">Diyarbakır</option>
              <option value="Edirne" className="py-2">Edirne</option>
              <option value="Elazığ" className="py-2">Elazığ</option>
              <option value="Erzincan" className="py-2">Erzincan</option>
              <option value="Erzurum" className="py-2">Erzurum</option>
              <option value="Eskişehir" className="py-2">Eskişehir</option>
              <option value="Gaziantep" className="py-2">Gaziantep</option>
              <option value="Giresun" className="py-2">Giresun</option>
              <option value="Gümüşhane" className="py-2">Gümüşhane</option>
              <option value="Hakkari" className="py-2">Hakkari</option>
              <option value="Hatay" className="py-2">Hatay</option>
              <option value="Isparta" className="py-2">Isparta</option>
              <option value="Mersin" className="py-2">Mersin</option>
              <option value="İstanbul" className="py-2">İstanbul</option>
              <option value="İzmir" className="py-2">İzmir</option>
              <option value="Kars" className="py-2">Kars</option>
              <option value="Kastamonu" className="py-2">Kastamonu</option>
              <option value="Kayseri" className="py-2">Kayseri</option>
              <option value="Kırklareli" className="py-2">Kırklareli</option>
              <option value="Kırşehir" className="py-2">Kırşehir</option>
              <option value="Kocaeli" className="py-2">Kocaeli</option>
              <option value="Konya" className="py-2">Konya</option>
              <option value="Kütahya" className="py-2">Kütahya</option>
              <option value="Malatya" className="py-2">Malatya</option>
              <option value="Manisa" className="py-2">Manisa</option>
              <option value="Kahramanmaraş" className="py-2">Kahramanmaraş</option>
              <option value="Mardin" className="py-2">Mardin</option>
              <option value="Muğla" className="py-2">Muğla</option>
              <option value="Muş" className="py-2">Muş</option>
              <option value="Nevşehir" className="py-2">Nevşehir</option>
              <option value="Niğde" className="py-2">Niğde</option>
              <option value="Ordu" className="py-2">Ordu</option>
              <option value="Rize" className="py-2">Rize</option>
              <option value="Sakarya" className="py-2">Sakarya</option>
              <option value="Samsun" className="py-2">Samsun</option>
              <option value="Siirt" className="py-2">Siirt</option>
              <option value="Sinop" className="py-2">Sinop</option>
              <option value="Sivas" className="py-2">Sivas</option>
              <option value="Tekirdağ" className="py-2">Tekirdağ</option>
              <option value="Tokat" className="py-2">Tokat</option>
              <option value="Trabzon" className="py-2">Trabzon</option>
              <option value="Tunceli" className="py-2">Tunceli</option>
              <option value="Şanlıurfa" className="py-2">Şanlıurfa</option>
              <option value="Uşak" className="py-2">Uşak</option>
              <option value="Van" className="py-2">Van</option>
              <option value="Yozgat" className="py-2">Yozgat</option>
              <option value="Zonguldak" className="py-2">Zonguldak</option>
              <option value="Aksaray" className="py-2">Aksaray</option>
              <option value="Bayburt" className="py-2">Bayburt</option>
              <option value="Karaman" className="py-2">Karaman</option>
              <option value="Kırıkkale" className="py-2">Kırıkkale</option>
              <option value="Batman" className="py-2">Batman</option>
              <option value="Şırnak" className="py-2">Şırnak</option>
              <option value="Bartın" className="py-2">Bartın</option>
              <option value="Ardahan" className="py-2">Ardahan</option>
              <option value="Iğdır" className="py-2">Iğdır</option>
              <option value="Yalova" className="py-2">Yalova</option>
              <option value="Karabük" className="py-2">Karabük</option>
              <option value="Kilis" className="py-2">Kilis</option>
              <option value="Osmaniye" className="py-2">Osmaniye</option>
              <option value="Düzce" className="py-2">Düzce</option>
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg 
                className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {/* Subtle shadow on focus */}
            <div className="absolute inset-0 rounded-xl shadow-sm group-hover:shadow-md group-focus-within:shadow-lg transition-shadow duration-300 pointer-events-none"></div>
          </div>
          {errors.city && (
            <div className="flex items-center mt-2 text-red-500 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-center md:text-left">{errors.city}</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
            Doğum Tarihi
          </label>
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 z-10" />
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-sm font-medium bg-white hover:bg-gray-50 hover:border-gray-400"
            />
            {/* Subtle shadow on focus */}
            <div className="absolute inset-0 rounded-xl shadow-sm group-hover:shadow-md group-focus-within:shadow-lg transition-shadow duration-300 pointer-events-none"></div>
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
      
      <div className="space-y-3 sm:space-y-4 w-full max-w-2xl mt-4 sm:mt-6">
         <div>
           <label className="flex items-start space-x-2 sm:space-x-3 justify-center md:justify-start">
             <input
               type="checkbox"
               name="acceptTerms"
               checked={formData.acceptTerms}
               onChange={handleInputChange}
               className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
             />
             <span className="text-sm text-gray-600 text-center md:text-left leading-relaxed">
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
         <label className="flex items-start space-x-2 sm:space-x-3 justify-center md:justify-start">
           <input
             type="checkbox"
             name="receiveUpdates"
             checked={formData.receiveUpdates}
             onChange={handleInputChange}
             className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
           />
           <span className="text-sm text-gray-600 text-center md:text-left leading-relaxed">
             Sağlık ipuçları, yeni hizmetler ve özel teklifler hakkında e-posta almak istiyorum.
           </span>
         </label>
       </div>
      
      <button
        type="submit"
        className="w-full max-w-2xl bg-green-500 text-white py-2 sm:py-3 px-4 rounded-xl hover:bg-green-600 focus:ring-4 focus:ring-green-200 transition-all duration-200 font-semibold text-xs sm:text-sm mt-4 sm:mt-6 shadow-sm hover:shadow-md"
      >
        Hesap Oluştur
      </button>
      <div className="relative my-2 sm:my-3 w-full max-w-2xl">
        <div className="relative flex justify-center text-xs">
          <span className="text-gray-500">veya</span>
        </div>
      </div>
      <div className="w-full max-w-2xl">
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