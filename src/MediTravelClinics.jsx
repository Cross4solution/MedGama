import React, { useState } from 'react';
import { Search, Heart, MessageCircle, Star, MapPin, Shield, Stethoscope, Award, Clock, 
Users } from 'lucide-react';

const MediTravelClinics = () => {
  const [selectedFilters, setSelectedFilters] = useState({
    rating: [],
    features: [],
    insurance: []
  });
 
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('highest-score');
  
  const clinics = [
    {
      id: 1,
      name: "Anadolu Sağlık Merkezi",
      location: "İstanbul, Türkiye",
      rating: 4.8,
      reviewCount: 342,
      image: "/api/placeholder/300/200",
      tags: ["Kalp Cerrahisi", "Onkoloji", "Telehealth"],
      description: "JCI akreditasyonlu, 25 yıllık deneyim, uluslararası standartlarda hizmet...",
      features: ["Telehealth", "Sağlık Turizmi", "GDPR Uyumlu"],
      type: "premium"
    },
    {
      id: 2,
      name: "Memorial Hastanesi",
      location: "Ankara, Türkiye",
      rating: 4.9,
      reviewCount: 186,
      image: "/api/placeholder/300/200",
      tags: ["Plastik Cerrahi", "Estetik", "Pro Review"],
      description: "Estetik cerrahide öncü, dünya standartlarında hizmet, profesyonel değerlendirme mevcut...",
      features: ["Pro Review", "Sağlık Turizmi", "ISO 9001"],
      type: "premium"
    },
    {
      id: 3,
      name: "Ege Üniversitesi Tıp Fakültesi",
      location: "İzmir, Türkiye",
      rating: 4.7,
      reviewCount: 428,
      image: "/api/placeholder/300/200",
      tags: ["Nöroloji", "Ortopedi", "SGK Anlaşmalı"],
      description: "Akademik hastane, araştırma ve eğitim odaklı, deneyimli kadro, SGK anlaşmalı...",
      features: ["Akademik", "Uzman Kadro", "SGK"],
      type: "academic"
    }
  ];

  const toggleFavorite = (clinicId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(clinicId)) {
      newFavorites.delete(clinicId);
    } else {
      newFavorites.add(clinicId);
    }
    setFavorites(newFavorites);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-gray-900">{rating}</span>
      </div>
    );
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      "Telehealth": <Stethoscope className="w-4 h-4" />,
      "Sağlık Turizmi": <MapPin className="w-4 h-4" />,
      "GDPR Uyumlu": <Shield className="w-4 h-4" />,
      "Pro Review": <Award className="w-4 h-4" />,
      "ISO 9001": <Shield className="w-4 h-4" />,
      "Akademik": <Users className="w-4 h-4" />,
      "Uzman Kadro": <Users className="w-4 h-4" />,
      "SGK": <Shield className="w-4 h-4" />
    };
    return icons[feature] || <Clock className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Heart className="w-8 h-8 text-green-500" />
                <span className="text-xl font-bold text-gray-900">MediTravel</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Ana Sayfa</a>
                <a href="#" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4">Klinikler</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Doktorlar</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Sağlık Turizmi</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Telehealth</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Giriş Yap
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                Üye Ol
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Klinikler</h1>
          <p className="text-lg text-gray-600">Size en uygun sağlık hizmetini sunan klinikleri keşfedin</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konum</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Tüm Şehirler</option>
                <option>İstanbul</option>
                <option>Ankara</option>
                <option>İzmir</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Uzmanlık</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Tüm Alanlar</option>
                <option>Kalp Cerrahisi</option>
                <option>Onkoloji</option>
                <option>Plastik Cerrahi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat Aralığı</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Tüm Fiyatlar</option>
                <option>Ekonomik</option>
                <option>Orta</option>
                <option>Premium</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Ara</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filtreler</h3>
 
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Değerlendirme</h4>
                  <div className="space-y-2">
                    {['4.5+ Puan', '4.0+ Puan'].map((rating) => (
                      <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Özellikler</h4>
                  <div className="space-y-2">
                    {['Telehealth', 'Sağlık Turizmi', 'Profesyonel Review'].map((feature) => (
                      <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Sigorta</h4>
                  <div className="space-y-2">
                    {['SGK', 'Özel Sigorta'].map((insurance) => (
                      <label key={insurance} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600">{insurance}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">247 Klinik Bulundu</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="highest-score">En Yüksek Puan</option>
                <option value="most-reviews">En Çok Değerlendirme</option>
                <option value="nearest">En Yakın</option>
              </select>
            </div>

            {/* Clinics List */}
            <div className="space-y-6">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-80 h-64 md:h-auto relative">
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                        <div className="text-center">
                          <Stethoscope className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                          <p className="text-blue-600 font-medium">{clinic.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(clinic.id)}
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.has(clinic.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400 hover:text-red-500'
                          } transition-colors`}
                        />
                      </button>
                    </div>
 
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{clinic.name}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-sm">{clinic.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {renderStars(clinic.rating)}
                          <span className="text-sm text-gray-500">({clinic.reviewCount})</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {clinic.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              tag === 'Pro Review'
                                ? 'bg-purple-100 text-purple-700'
                                : tag === 'Telehealth'
                                ? 'bg-blue-100 text-blue-700'
                                : tag === 'SGK Anlaşmalı'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{clinic.description}</p>
                      <div className="flex flex-wrap gap-4 mb-4">
                        {clinic.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-1 text-sm text-gray-600">
                            {getFeatureIcon(feature)}
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-3">
                          <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">Mesaj</span>
                          </button>
                        </div>
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Profili Gör
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 text-gray-500 hover:text-gray-700">&lt;</button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded">1</button>
                <button className="px-3 py-2 text-gray-700 hover:text-gray-900">2</button>
                <button className="px-3 py-2 text-gray-700 hover:text-gray-900">3</button>
                <button className="px-3 py-2 text-gray-500 hover:text-gray-700">&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Size En Uygun Kliniği Bulamadınız mı?</h2>
          <p className="text-blue-100 mb-6">Uzmanlarımız size en uygun sağlık hizmetini bulmak için yardımcı olmaya hazır.</p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Uzman Desteği Al
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediTravelClinics; 