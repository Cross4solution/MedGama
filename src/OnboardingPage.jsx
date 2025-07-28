import React, { useState } from 'react';
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  MapPin,
  Stethoscope,
  Shield,
  Star,
  Clock,
  Smartphone,
  Video,
  Calendar,
  Award,
  Brain,
  Eye,
  Smile
} from 'lucide-react';

const OnboardingPage = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [userType, setUserType] = useState('');

  const steps = [
    {
      id: 0,
      title: "MediTravel'e Hoş Geldiniz",
      subtitle: "Sağlık yolculuğunuzda size yardımcı olmaya hazırız",
      content: (
        <div className="text-center space-y-6">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
            <Heart className="w-16 h-16 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sağlığınız Bizim Önceliğimiz</h2>
            <p className="text-gray-600 text-lg">
              Güvenilir sağlık hizmetleri, uzman doktorlar ve modern tedavi yöntemleri ile yanınızdayız.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700">Uzman Doktorlar</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="text-gray-700">Güvenli Hizmet</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
              <span className="text-gray-700">24/7 Destek</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Hangi tür kullanıcısınız?",
      subtitle: "Size en uygun hizmetleri sunabilmek için seçin",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setUserType('patient')}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                userType === 'patient'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Users className="w-8 h-8 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Hasta</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Sağlık hizmetleri arıyorum, doktor randevusu almak istiyorum
              </p>
            </button>
            <button
              onClick={() => setUserType('medical-tourism')}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                userType === 'medical-tourism'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <MapPin className="w-8 h-8 text-green-600" />
                <h3 className="font-semibold text-gray-900">Sağlık Turizmi</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Yurtdışından tedavi için Türkiye'ye gelmek istiyorum
              </p>
            </button>
            <button
              onClick={() => setUserType('telehealth')}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                userType === 'telehealth'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Video className="w-8 h-8 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Telehealth</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Online konsültasyon ve uzaktan sağlık hizmetleri arıyorum
              </p>
            </button>
            <button
              onClick={() => setUserType('doctor')}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                userType === 'doctor'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Stethoscope className="w-8 h-8 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Doktor</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Sağlık profesyoneli olarak platforma katılmak istiyorum
              </p>
            </button>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "İlgi alanlarınızı seçin",
      subtitle: "Size özel içerik ve öneriler sunabilmek için",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: 'cardiology', label: 'Kardiyoloji', icon: <Heart className="w-5 h-5" /> },
              { id: 'oncology', label: 'Onkoloji', icon: <Stethoscope className="w-5 h-5" /> },
              { id: 'neurology', label: 'Nöroloji', icon: <Brain className="w-5 h-5" /> },
              { id: 'orthopedics', label: 'Ortopedi', icon: <Users className="w-5 h-5" /> },
              { id: 'dermatology', label: 'Dermatoloji', icon: <Shield className="w-5 h-5" /> },
              { id: 'pediatrics', label: 'Pediatri', icon: <Heart className="w-5 h-5" /> },
              { id: 'psychiatry', label: 'Psikiyatri', icon: <Brain className="w-5 h-5" /> },
              { id: 'ophthalmology', label: 'Göz Hastalıkları', icon: <Eye className="w-5 h-5" /> },
              { id: 'dental', label: 'Diş Sağlığı', icon: <Smile className="w-5 h-5" /> }
            ].map((interest) => (
              <button
                key={interest.id}
                onClick={() => {
                  if (selectedInterests.includes(interest.id)) {
                    setSelectedInterests(selectedInterests.filter(id => id !== interest.id));
                  } else {
                    setSelectedInterests([...selectedInterests, interest.id]);
                  }
                }}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedInterests.includes(interest.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {interest.icon}
                  <span className="text-sm font-medium">{interest.label}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center">
            En az 1 ilgi alanı seçin (daha sonra değiştirebilirsiniz)
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "Hızlı başlangıç",
      subtitle: "MediTravel'i keşfetmeye başlayın",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Randevu Alın</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Uzman doktorlarla hızlıca randevu alın
              </p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Randevu Al
              </button>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Video className="w-8 h-8 text-green-600" />
                <h3 className="font-semibold text-gray-900">Telehealth</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Online konsültasyon ile evden tedavi
              </p>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Online Konsültasyon
              </button>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-8 h-8 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Klinik Bulun</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Size en yakın kaliteli klinikleri keşfedin
              </p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                Klinik Ara
              </button>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Star className="w-8 h-8 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Değerlendirmeler</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Diğer hastaların deneyimlerini okuyun
              </p>
              <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                Değerlendirmeleri Gör
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding tamamlandı, callback'i çağır
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return userType;
    if (currentStep === 2) return selectedInterests.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-green-500" />
              <span className="text-xl font-bold text-gray-900">MediTravel</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentStep + 1} / {steps.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          {/* Step Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-lg text-gray-600">
              {steps[currentStep].subtitle}
            </p>
          </div>

          <div className="mb-8">
            {steps[currentStep].content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Geri</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>{currentStep === steps.length - 1 ? 'Başla' : 'İleri'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage; 