import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Image,
  Folder,
  Filter,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Calendar,
  Bot,
  MessageSquare,
  Bell,
  User
} from 'lucide-react';
import Header from '../components/Header';
import TimelineFeed from '../components/TimelineFeed';
import { useAuth } from '../context/AuthContext';
const MediTravelTimeline = () => {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('Türkiye');
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler');
  const [activeFilter, setActiveFilter] = useState('all');
  const posts = [
    {
      id: 1,
      type: 'clinic_update',
      clinic: {
        name: 'Anadolu Sağlık Merkezi',
        location: 'İstanbul',
        avatar: 'https://placehold.co/40x40',
        verified: true,
        specialty: 'Kalp Cerrahisi'
      },
      timestamp: '2 saat önce',
      content: '🔬 Yeni teknoloji ile minimal invaziv kalp ameliyatlarımızda başarı oranımız %98\'e ulaştı! Hastalarımızın iyileşme süreleri yarıya indi.',
      hashtags: ['#KalpCerrahisi', '#MinimalInvaziv'],
      image: 'https://placehold.co/600x300',
      engagement: {
        likes: 124,
        comments: 18,
        shares: 12
      },
      hasAppointmentButton: true
    },
    {
      id: 2,
      type: 'patient_review',
      patient: {
        name: 'Mehmet Kaya',
        avatar: 'https://placehold.co/40x40',
        isPatient: true
      },
      timestamp: '4 saat önce',
      rating: 5,
      content: 'Memorial Hastanesi\'nde estetik operasyonum çok başarılı geçti! Dr. Ahmet Yılmaz ve ekibine çok teşekkür ederim. Hem öncesi hem sonrası süreçte çok ilgili davrandılar. Kesinlikle tavsiye ederim! 🔬',
      verificationBadge: {
        text: 'Onaylanmış Değerlendirme',
        description: 'Bu değerlendirme sistem üzerinden randevu alan gerçek bir hasta tarafından yapılmıştır.'
      },
      engagement: {
        likes: 89,
        comments: 12,
        shares: 5
      }
    }
  ];
  const professionalReview = {
    id: 'pro-review-1',
    reviewer: {
      name: 'MediTravel Profesyonel Değerlendirme',
      team: 'Uzman Ekip',
      badge: 'PRO Review',
      avatar: 'https://placehold.co/40x40'
    },
    timestamp: '1 gün önce',
    clinic: 'Ege Üniversitesi Tıp Fakültesi Profesyonel İnceleme',
    content: 'Uzman ekibimiz Ege Üniversitesi Tıp Fakültesi\'ni detaylı olarak inceledi. Akademik kadro, teknolojik altyapı ve hasta memnuniyeti açısından değerlendirmemiz...',
    images: [
      'https://placehold.co/150x100',
      'https://placehold.co/150x100',
      'https://placehold.co/150x100'
    ],
    scores: {
      technology: 9.2,
      cleanliness: 9.5,
      staff: 9.2
    },
    engagement: {
      likes: 156,
      comments: 24
    }
  };
  const userProfile = {
    name: 'Ayşe Yılmaz',
    role: 'Hasta',
    avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg',
    stats: {
      following: 12,
      appointments: 3
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className={`max-w-6xl mx-auto px-4 py-6 ${user ? 'lg:ml-[var(--sidebar-width)]' : ''}`}>
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - User Profile & Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-center">
                                 <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-100">
                   <img
                     src={userProfile.avatar}
                     alt={userProfile.name}
                     className="w-full h-full object-cover object-center scale-110"
                     style={{ objectPosition: '25% 50%' }}
                   />
                 </div>
                <h3 className="font-semibold text-gray-800">{userProfile.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{userProfile.role}</p>
 
                <div className="flex justify-center space-x-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-gray-800">Takip Edilen: {userProfile.stats.following}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800">Randevular: {userProfile.stats.appointments}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Filtreler</h3>
 
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ülke</label>
                  <div className="relative group">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-sm font-medium appearance-none cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400"
                    >
                      <option value="Türkiye" className="py-2">Türkiye</option>
                      <option value="Almanya" className="py-2">Almanya</option>
                      <option value="ABD" className="py-2">ABD</option>
                      <option value="İngiltere" className="py-2">İngiltere</option>
                      <option value="Fransa" className="py-2">Fransa</option>
                      <option value="İtalya" className="py-2">İtalya</option>
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
                </div>
 
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <div className="relative group">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-sm font-medium appearance-none cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400"
                    >
                      <option value="Tüm Kategoriler" className="py-2">Tüm Kategoriler</option>
                      <option value="Kalp Cerrahisi" className="py-2">Kalp Cerrahisi</option>
                      <option value="Estetik" className="py-2">Estetik</option>
                      <option value="Diş Tedavisi" className="py-2">Diş Tedavisi</option>
                      <option value="Ortopedi" className="py-2">Ortopedi</option>
                      <option value="Onkoloji" className="py-2">Onkoloji</option>
                      <option value="Göz Hastalıkları" className="py-2">Göz Hastalıkları</option>
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
                </div>
 
                <button className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
                  Filtrele
                </button>
              </div>
            </div>
            {/* AI Assistant */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">AI Asistanı</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Sağlık sorularınız için AI asistanımızla konuşun</p>
                              <button className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transition-all duration-200">
                <MessageSquare className="w-4 h-4" />
                <span>Sohbet Başlat</span>
              </button>
            </div>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <TimelineFeed />
          </div>
        </div>
      </div>
    </div>
  );
};
export default MediTravelTimeline; 