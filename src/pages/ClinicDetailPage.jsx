import React, { useState } from 'react';
import {
  Heart,
  Plus,
  MapPin,
  Star,
  Users,
  Clock,
  Shield,
  Award,
  Video,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  Activity,
  Brain,
  Scissors,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import Header from '../components/Header';

const ClinicDetailPage = () => {
  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const tabs = [
    { id: 'genel-bakis', label: 'Genel Bakış' },
    { id: 'hizmetler', label: 'Hizmetler' },
    { id: 'doktorlar', label: 'Doktorlar' },
    { id: 'degerlendirmeler', label: 'Değerlendirmeler' },
    { id: 'galeri', label: 'Galeri' },
    { id: 'konum', label: 'Konum' }
  ];

  const services = [
    {
      name: 'Kalp Cerrahisi',
      icon: <Activity className="w-5 h-5" />,
      description: 'Bypass, kapak replasmanı, arytoplasti'
    },
    {
      name: 'Onkoloji',
      icon: <Stethoscope className="w-5 h-5" />,
      description: 'Kanser tanısı, kemoterapi, radyoterapi'
    },
    {
      name: 'Nöroloji',
      icon: <Brain className="w-5 h-5" />,
      description: 'Beyin cerrahisi, epilepsi tedavisi'
    },
    {
      name: 'Plastik Cerrahi',
      icon: <Scissors className="w-5 h-5" />,
      description: 'Estetik ve rekonstrüktif cerrahi'
    }
  ];

  const reviews = [
    {
      id: 1,
      name: 'Ayşe K.',
      rating: 5,
      service: 'Kalp Cerrahisi',
      date: '2 hafta önce',
      comment: 'Doktorlar çok ilgili ve profesyonel. Ameliyat sürecini çok iyi yönettiler. Kesinlikle tavsiye ederim.',
      helpful: 15,
      verified: true
    },
    {
      id: 2,
      name: 'Mehmet S.',
      rating: 4,
      service: 'Onkoloji',
      date: '1 ay önce',
      comment: 'Tedavi süreci boyunca çok destek oldular. Modern cihazları ve deneyimli kadrosu var.',
      helpful: 8,
      verified: false
    }
  ];

  const priceRanges = [
    { service: 'Konsültasyon', range: '₺200 - ₺500' },
    { service: 'Kalp Cerrahisi', range: '₺50K - ₺150K' },
    { service: 'Onkoloji Tedavi', range: '₺30K - ₺200K' }
  ];

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Ana Sayfa</span>
          <ChevronRight className="w-4 h-4" />
          <span>Klinikler</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Anadolu Sağlık Merkezi</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
              <div className="relative h-64 md:h-80">
                <img 
                  src="/images/petr-magera-huwm7malj18-unsplash_720.jpg"
                  alt="Anadolu Sağlık Merkezi - Modern klinik ortamı"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex items-center bg-white rounded-full px-3 py-1 shadow-md">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-gray-600 text-sm ml-1">(342)</span>
                </div>
              </div>
 
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Anadolu Sağlık Merkezi</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>İstanbul, Türkiye</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">JCI Akreditli</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`p-3 rounded-full transition-colors ${
                        isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                                                              <button className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Takip Et</span>
                      </button>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">15+</div>
                    <div className="text-sm text-gray-600">Yıl Tecrübe</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">50+</div>
                    <div className="text-sm text-gray-600">Uzman Doktor</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">10K+</div>
                    <div className="text-sm text-gray-600">Başarılı Ameliyat</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">24/7</div>
                    <div className="text-sm text-gray-600">Acil Servis</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="border-b">
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="p-6">
                {activeTab === 'genel-bakis' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Hakkımızda</h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Anadolu Sağlık Merkezi, 15 yıllık tecrübesi ile Türkiye'nin önde gelen sağlık kurumlarından
                        biridir. JCI akreditasyonuna sahip hastanemiz, uluslararası standartlarda sağlık hizmeti
                        sunmaktadır.
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        50'den fazla uzman doktorumuz ve son teknoloji tıbbi ekipmanlarımız ile kalp cerrahisi, onkoloji,
                        nöroloji ve plastik cerrahi alanlarında hizmet vermekteyiz.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">JCI Akreditli</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                        <Shield className="w-6 h-6 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">ISO 9001</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                        <Award className="w-6 h-6 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Sağlık Bakanlığı</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                        <Users className="w-6 h-6 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Sağlık Turizmi</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'hizmetler' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Hizmetlerimiz</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {services.map((service, index) => (
                        <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                              {service.icon}
                            </div>
                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          </div>
                          <p className="text-gray-600 text-sm">{service.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'degerlendirmeler' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">Hasta Değerlendirmeleri</h3>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.8</span>
                        <span className="text-gray-600">(342 değerlendirme)</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Profesyonel Değerlendirme</span>
                      </div>
                      <p className="text-purple-700 text-sm">
                        MediTravel Uzman Ekibi Tarafından: "Klinik, uluslararası standartlarda hizmet sunuyor. Doktor kadrosu ve teknoloji altyapısı oldukça güçlü. Hasta memnuniyeti yüksek seviyede."
                      </p>
                    </div>
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-blue-600">{review.name[0]}</span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold">{review.name}</span>
                                  {review.verified && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>{review.service}</span>
                                  <span>•</span>
                                  <span>{review.date}</span>
                                </div>
                              </div>
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                          <div className="flex items-center justify-between text-sm">
                            <button className="text-blue-600 hover:text-blue-700">
                              👍 Faydalı ({review.helpful})
                            </button>
                            <span className="text-gray-500">Doğrulanmış Hasta</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Contact Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">İletişim</h3>
              <div className="space-y-3">
                                 <button className="w-full bg-blue-600 text-white py-1.5 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Telehealth Randevu</span>
                </button>
                                 <button className="w-full bg-green-500 text-white py-1.5 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Randevu Al</span>
                </button>
                                 <button className="w-full bg-gray-100 text-gray-700 py-1.5 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Mesaj Gönder</span>
                </button>
              </div>
            </div>

            {/* Health Tourism Package */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sağlık Turizmi Paketi</h3>
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Tedavi + Konaklama + Transfer</span>
                </div>
              </div>
                             <button className="w-full bg-purple-600 text-white py-1.5 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Paket Oluştur</span>
              </button>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Fiyat Aralığı</h3>
              <div className="space-y-3">
                {priceRanges.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.service}</span>
                    <span className="font-semibold text-gray-900">{item.range}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                *Fiyatlar değişiklik gösterebilir. Kesin fiyat için randevu alın.
              </p>
            </div>

            {/* Quick Contact */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-4">Hızlı İletişim</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <span>+90 212 555 0123</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5" />
                  <span>info@anadolusaglik.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5" />
                  <span>24/7 Açık</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage; 