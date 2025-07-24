import React, { useState } from 'react';
import {
  Star,
  Heart,
  MapPin,
  Award,
  Users,
  MessageCircle,
  Calendar,
  Video,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  Camera,
  User,
  ChevronRight,
  ThumbsUp,
  Eye
} from 'lucide-react';
const ClinicDetailPage = () => {
  const [activeTab, setActiveTab] = useState('genel');
  const [isFollowing, setIsFollowing] = useState(false);
  const clinic = {
    id: 1,
    name: 'Anadolu Sağlık Merkezi',
    location: 'İstanbul, Türkiye',
    rating: 4.3,
    reviewCount: 342,
    isJCIAccredited: true,
    mainImage: 'https://placehold.co/800x400',
    stats: {
      experience: '15+',
      experienceText: 'Yıl Tecrübe',
      doctors: '50+',
      doctorsText: 'Uzman Doktor',
      operations: '10K+',
      operationsText: 'Başarılı Ameliyat',
      availability: '24/7',
      availabilityText: 'Acil Servis'
    },
    services: [
      {
        name: 'Kalp Cerrahisi',
        description: 'Bypass, kapak replasmanı, anjioplasti',
        icon: '❤️',
        price: '€50K - €150K'
      },
      {
        name: 'Onkoloji',
        description: 'Kanser tedavisi, kemoterapi, radyoterapi',
        icon: '🎗️',
        price: '€30K - €200K'
      },
      {
        name: 'Nöroloji',
        description: 'Beyin cerrahisi, epilepsi tedavisi',
        icon: '🧠',
        price: '€200 - €500'
      },
      {
        name: 'Plastik Cerrahi',
        description: 'Estetik ve rekonstrüktif cerrahi',
        icon: '✨',
        price: '€200 - €500'
      }
    ],
    priceRanges: {
      consultation: '€200 - €500',
      heartSurgery: '€50K - €150K',
      oncologyTreatment: '€30K - €200K'
    },
    certifications: [
      { name: 'JCI Akrediteli', icon: '🏆', color: 'text-blue-600' },
      { name: 'ISO 9001', icon: '✅', color: 'text-green-600' },
      { name: 'Sağlık Bakanlığı', icon: '🏥', color: 'text-purple-600' },
      { name: 'Sağlık Turizmi', icon: '🌍', color: 'text-orange-600' }
    ],
    description: 'Anadolu Sağlık Merkezi, 15 yılı aşkın tecrübesi ile Türkiye\'nin önde gelen sağlık kurumlarından biridir. JCI akreditasyonuna sahip hastanemiz, uluslararası standartlarda sağlık hizmeti sunmaktadır.',
    extendedDescription: '50\'den fazla uzman doktorumuz ve son teknoloji tıbbi ekipmanlarımız ile kalp cerrahisi, onkoloji, nöroloji ve plastik cerrahi alanlarında hizmet vermekteyiz.'
  };
  const medicalTourismPackage = {
    title: 'Sağlık Turizmi Paketi',
    subtitle: 'Tedavi + Konaklama + Transfer',
    features: ['5 yıldız otel konaklaması', 'Havalimanı transferi', 'Tercüman hizmeti', 'Medikal koordinatör']
  };
  const reviews = [
    {
      id: 1,
      type: 'professional',
      author: 'Profesyonel Değerlendirme',
      subtitle: 'MediTravel Uzman Ekip Tarafından',
      content: '"Klinik, uluslararası standartlarda hizmet sunuyor. Doktor kadrosu ve teknolojik altyapı oldukça güçlü. Hasta memnuniyeti yüksek seviyede."',
      rating: 4.8,
      reviewCount: 342,
      isProfessional: true
    },
    {
      id: 2,
      type: 'patient',
      author: 'Ayşe K.',
      specialty: 'Kalp Cerrahisi',
      content: 'Doktorlar çok ilgili ve profesyonel. Ameliyat sürecim çok iyi yönetildi. Kesinlikle tavsiye ederim.',
      rating: 5,
      timeAgo: '2 hafta önce',
      helpful: 12,
      isVerified: true
    },
    {
      id: 3,
      type: 'patient',
      author: 'Mehmet S.',
      specialty: 'Onkoloji',
      content: 'Tedavi sürecinde her adımda yanımda oldular. Personel çok ilgili ve hastaneye erişim kolay.',
      rating: 4,
      timeAgo: '1 ay önce',
      helpful: 8,
      isVerified: true
    }
  ];
  const tabs = [
    { id: 'genel', label: 'Genel Bakış' },
    { id: 'hizmetler', label: 'Hizmetler' },
    { id: 'doktorlar', label: 'Doktorlar' },
    { id: 'degerlendirmeler', label: 'Değerlendirmeler' },
    { id: 'galeri', label: 'Galeri' },
    { id: 'konum', label: 'Konum' }
  ];
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold text-gray-800">MediTravel</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-800">Ana Sayfa</a>
              <a href="#" className="text-blue-600 font-medium">Klinikler</a>
              <a href="#" className="text-gray-600 hover:text-gray-800">Doktorlar</a>
              <a href="#" className="text-gray-600 hover:text-gray-800">Sağlık Turizmi</a>
              <a href="#" className="text-gray-600 hover:text-gray-800">Telehealth</a>
            </nav>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">Giriş Yap</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Üye Ol</button>
            </div>
          </div>
        </div>
      </header>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="#" className="hover:text-blue-600">Ana Sayfa</a>
            <ChevronRight className="w-4 h-4" />
            <a href="#" className="hover:text-blue-600">Klinikler</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-800 font-medium">{clinic.name}</span>
          </div>
        </div>
      </div>
      {/* Main Image & Stats */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <img src={clinic.mainImage} alt={clinic.name} className="w-full h-72 object-cover rounded-xl mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{clinic.name}</h1>
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">{clinic.location}</span>
            <span className="mx-2">•</span>
            {renderStars(clinic.rating)}
            <span className="text-sm text-gray-500 ml-2">({clinic.reviewCount} değerlendirme)</span>
            {clinic.isJCIAccredited && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs flex items-center"><Award className="w-4 h-4 mr-1" /> JCI Akrediteli</span>
            )}
          </div>
          <p className="text-gray-700 mb-4">{clinic.description}</p>
          <p className="text-gray-600 mb-6">{clinic.extendedDescription}</p>
          {/* Tabs */}
          <div className="flex space-x-4 border-b mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`py-2 px-4 font-medium ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          {activeTab === 'genel' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Klinik Hakkında</h2>
              <p className="text-gray-700 mb-4">{clinic.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="block text-2xl font-bold text-blue-600">{clinic.stats.experience}</span>
                  <span className="text-gray-600 text-sm">{clinic.stats.experienceText}</span>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="block text-2xl font-bold text-green-600">{clinic.stats.doctors}</span>
                  <span className="text-gray-600 text-sm">{clinic.stats.doctorsText}</span>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <span className="block text-2xl font-bold text-purple-600">{clinic.stats.operations}</span>
                  <span className="text-gray-600 text-sm">{clinic.stats.operationsText}</span>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <span className="block text-2xl font-bold text-orange-600">{clinic.stats.availability}</span>
                  <span className="text-gray-600 text-sm">{clinic.stats.availabilityText}</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'hizmetler' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Hizmetler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clinic.services.map((service, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-4 flex items-center space-x-4">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-gray-600 text-sm">{service.description}</p>
                      <span className="text-blue-600 text-sm font-medium">{service.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'degerlendirmeler' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Değerlendirmeler</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {review.isProfessional ? (
                        <Award className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                      <span className="font-semibold text-gray-800">{review.author}</span>
                      {review.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-1" />
                      )}
                      <span className="text-xs text-gray-500">{review.specialty}</span>
                      <span className="text-xs text-gray-400">{review.timeAgo}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500 ml-2">{review.rating}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{review.content}</p>
                    {review.isProfessional && (
                      <span className="text-xs text-blue-600">{review.subtitle}</span>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <ThumbsUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-500">{review.helpful || 0} Faydalı</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Sağ Panel: Paket ve Sertifikalar */}
        <div className="space-y-6">
          {/* Sağlık Turizmi Paketi */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{medicalTourismPackage.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{medicalTourismPackage.subtitle}</p>
            <ul className="list-disc list-inside text-gray-700 text-sm mb-4">
              {medicalTourismPackage.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Paket Detayı</button>
          </div>
          {/* Sertifikalar */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Sertifikalar</h3>
            <div className="flex flex-wrap gap-3">
              {clinic.certifications.map((cert, i) => (
                <span key={i} className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${cert.color} border-gray-200 bg-gray-50`}>
                  <span>{cert.icon}</span>
                  <span>{cert.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ClinicDetailPage; 