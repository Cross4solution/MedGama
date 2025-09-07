import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, MessageCircle, Star, MapPin, Shield, Stethoscope, Award, Clock, 
Users } from 'lucide-react';
import Badge from '../components/Badge';
import SelectCombobox from '../components/SelectCombobox';
import countryCities from '../data/countryCities';
import PatientLayout from '../components/PatientLayout';

const MediTravelClinics = () => {
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState({
    rating: [],
    features: [],
    insurance: []
  });
 
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('highest-score');

  // Search bar state
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const locationOptions = countryCities.Turkey;
  const specialtyOptions = [
    'Kalp Cerrahisi','Onkoloji','Plastik Cerrahi','Ortopedi','Nöroloji','Göz Hastalıkları','Diş Hekimliği'
  ];
  const priceOptions = ['Ekonomik','Orta','Premium','Lüks'];
  
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

  // Map tag labels to English where needed
  const mapTagLabel = (tag) => {
    const map = {
      'SGK Anlaşmalı': 'Public Insurance',
      'SGK': 'Public Insurance'
    };
    return map[tag] || tag;
  };

  const getTagVariant = (tag) => {
    if (tag === 'Pro Review' || tag === 'PRO Review') return 'purple';
    if (tag === 'Telehealth') return 'blue';
    if (tag === 'SGK Anlaşmalı' || tag === 'Public Insurance' || tag === 'SGK') return 'green';
    // specialties and others
    return 'gray';
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
    <PatientLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-6">
        {/* Page Title removed as requested */}

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <SelectCombobox
                options={locationOptions}
                value={location}
                onChange={setLocation}
                placeholder="All Cities"
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
              <SelectCombobox
                options={specialtyOptions}
                value={specialty}
                onChange={setSpecialty}
                placeholder="All Specialties"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <SelectCombobox
                options={priceOptions}
                value={priceRange}
                onChange={setPriceRange}
                placeholder="All Prices"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
              />
            </div>
            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md">
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Rating</h4>
                  <div className="space-y-2">
                    {['4.5+ Rating', '4.0+ Rating'].map((rating) => (
                      <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Features</h4>
                  <div className="space-y-2">
                    {['Telehealth', 'Health Tourism', 'Professional Review'].map((feature) => (
                      <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Insurance</h4>
                  <div className="space-y-2">
                    {['SGK', 'Private Insurance'].map((insurance) => (
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
              <h2 className="text-xl font-semibold text-gray-900">247 Clinics Found</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="highest-score">Highest Rated</option>
                <option value="most-reviews">Most Reviews</option>
                <option value="nearest">Nearest</option>
              </select>
            </div>

            {/* Clinics List */}
            <div className="space-y-6">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 h-64 md:h-auto relative">
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
                          <Badge
                            key={index}
                            label={mapTagLabel(tag)}
                            variant={getTagVariant(tag)}
                            size="sm"
                            rounded="full"
                          />
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
                            <span className="text-sm">Message</span>
                          </button>
                        </div>
                        <button onClick={() => navigate('/clinic')} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                          View Profile
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
                <button className="px-3 py-2 bg-blue-600 text-white rounded-xl shadow-sm">1</button>
                <button className="px-3 py-2 text-gray-700 hover:text-gray-900">2</button>
                <button className="px-3 py-2 text-gray-700 hover:text-gray-900">3</button>
                <button className="px-3 py-2 text-gray-500 hover:text-gray-700">&gt;</button>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-4">Didn't find the right clinic?</h2>
              <p className="text-blue-100 mb-6">Our experts are ready to help you find the most suitable healthcare service.</p>
              <button className="bg-white text-blue-600 px-6 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Expert Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default MediTravelClinics; 