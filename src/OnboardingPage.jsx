import React, { useState } from 'react';
import { Users, Calendar, Video, Plane, Eye, EyeOff, ArrowRight, Shield, Lock } from 'lucide-react';

const OnboardingPage = ({ onComplete }) => {
  const [email, setEmail] = useState('doktor@example.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const features = [
    { icon: Users, text: 'Hasta yönetimi ve takibi' },
    { icon: Calendar, text: 'Akıllı randevu sistemi' },
    { icon: Video, text: 'Entegre telehealth çözümü' },
    { icon: Plane, text: 'Medikal turizm yönetimi' }
  ];

  const stats = [
    { value: '1.2K+', label: 'Aktif Doktor' },
    { value: '50K+', label: 'Hasta Takibi' },
    { value: '98%', label: 'Memnuniyet' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)'
      }}>
        {/* Floating circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-white/15 rounded-full blur-xl animate-pulse delay-700"></div>

        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-10 w-4 h-4 bg-white/20 rotate-45 animate-bounce delay-300"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-white/25 rotate-12 animate-bounce delay-500"></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-white/30 rotate-45 animate-bounce delay-700"></div>
        <div className="absolute bottom-1/4 right-12 w-3 h-3 bg-white/35 rotate-12 animate-bounce delay-900"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      <div className="relative z-10 flex w-full">
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col justify-center px-12 lg:px-20 text-white">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <h1 className="text-3xl font-bold">MediTravel</h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-lg">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Doktor Paneline<br />
              <span className="bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">
                Hoş Geldiniz
              </span>
            </h2>
            <p className="text-xl mb-12 text-white/90 leading-relaxed">
              Hastalarınızı yönetin, randevularınızı takip edin ve
              telehealth hizmetlerinizi tek platformdan kontrol edin.
            </p>

            {/* Features */}
            <div className="space-y-6 mb-16">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-white/25 transition-all duration-300">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg text-white/90 group-hover:text-white transition-colors duration-300">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/80 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Security badges */}
            <div className="flex items-center gap-6 mt-12">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm text-white/90">SSL Güvenli</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Lock className="w-4 h-4 text-white" />
                <span className="text-sm text-white/90">KVKK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md flex items-center justify-center p-8">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Hesabınıza Giriş Yapın</h3>
              <p className="text-gray-600">Doktor panelinize erişmek için bilgilerinizi girin</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    placeholder="doktor@example.com"
                  />
                  <div className="absolute left-3 top-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-10 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                  />
                  <div className="absolute left-3 top-3">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
                </label>
                <a href="#" className="text-sm text-teal-600 hover:text-teal-500 font-medium">
                  Şifremi unuttum?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-6 rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                Giriş Yap
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              <div className="text-center text-gray-500 text-sm">veya</div>

              {/* Google Login */}
              <button
                type="button"
                className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Giriş Yap
              </button>

              {/* Sign up link */}
              <div className="text-center">
                <span className="text-gray-600 text-sm">Hesabınız yok mu? </span>
                <a href="#" className="text-teal-600 hover:text-teal-500 font-medium text-sm">
                  Ücretsiz Kayıt Olun
                </a>
              </div>

              {/* Demo account */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Demo hesabı ile hızlı erişim:</p>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-500 font-medium"
                >
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  Demo Hesabı Kullan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;