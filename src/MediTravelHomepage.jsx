import React, { useState, useEffect } from 'react';
import { Search, Video, MapPin, Star, Shield, Users, Calendar, Send, MessageCircle } from 'lucide-react';

const MediTravelHomepage = () => {
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const clinics = [
    {
      id: 1,
      name: "Anadolu Sağlık Merkezi",
      location: "İstanbul • Kalp Cerrahisi, Onkoloji",
      rating: 4.8,
      reviews: "342 Değerlendirme",
      image: "https://placehold.co/300x200"
    },
    {
      id: 2,
      name: "Memorial Hastanesi",
      location: "Ankara • Plastik Cerrahi, Estetik",
      rating: 4.9,
      reviews: "186 Değerlendirme",
      image: "https://placehold.co/300x200"
    },
    {
      id: 3,
      name: "Ege Üniversitesi Tıp",
      location: "İzmir • Nöroloji, Ortopedi",
      rating: 4.7,
      reviews: "428 Değerlendirme",
      image: "https://placehold.co/300x200"
    }
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Klinik Profilleri",
      description: "Detaylı klinik bilgileri, fotoğraflar, videolar ve gerçek hasta değerlendirmeleri",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Telehealth Randevu",
      description: "Online doktor konsültasyonları ve uzaktan sağlık hizmetleri",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Sağlık Turizmi",
      description: "Tek tıkla sağlık turizmi programı: Otel, uçak, transfer dahil",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Onaylı Değerlendirmeler",
      description: "Sadece gerçek hastaların yapabildiği güvenilir değerlendirme sistemi",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Güvenli Dosya Paylaşımı",
      description: "Röntgen ve tıbbi görüntülerin güvenli transferi",
      bgColor: "bg-red-50",
      iconColor: "text-red-600"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Entegre Randevu Sistemi",
      description: "Klinikler için CRM entegreli randevu yönetimi",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    }
  ];

  const aiFeatures = [
    {
      icon: <MessageCircle className="w-5 h-5 text-green-600" />,
      title: "Akıllı Sorgulama",
      description: "Semptomlarınızı analiz ederek doğru soruları sorar"
    },
    {
      icon: <Search className="w-5 h-5 text-blue-600" />,
      title: "Uzman Eşleştirme",
      description: "Size en uygun doktor ve klinikleri bulur"
    },
    {
      icon: <MapPin className="w-5 h-5 text-purple-600" />,
      title: "Lokasyon Bazlı",
      description: "İstediğiniz şehir ve ülkedeki seçenekleri sunar"
    },
    {
      icon: <Calendar className="w-5 h-5 text-orange-600" />,
      title: "Turizm Planı",
      description: "Yurtdışı tedavi için otomatik turizm programı"
    }
  ];

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
              <a href="#" className="text-gray-600 hover:text-gray-800">Klinikler</a>
              <a href="#" className="text-gray-600 hover:text-gray-800">Doktorlar</a>
              <a href="#" className="text-gray-600 hover:text-gray-800">Sağlık Turizmi</a>
              <a href="#" className="text-gray-600 hover:text-gray-800">Telehealth</a>
            </nav>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                Giriş Yap
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Üye Ol
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Sağlığınız İçin <span className="text-blue-600">En İyi</span> Klinikleri Keşfedin
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                AI destekli platformumuz ile size en uygun sağlık hizmetini bulun. 
                Telesağlık, sağlık turizmi ve doktor konsültasyonları tek platformda.
              </p>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">AI Doktor Asistanı ile Konuşun</h3>
                </div>
                
                <textarea
                  placeholder="Şikayetinizi veya ihtiyacınızı yazın... Örn: İstanbul'da göğüs estetiği ameliyatı olmak istiyorum"
                  className="w-full h-20 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                
                <button
                  onClick={() => setShowChat(true)}
                  className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>AI Asistanı ile Başla</span>
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gray-100 rounded-2xl p-8 relative overflow-hidden">
                <img 
                  src="https://placehold.co/500x400" 
                  alt="Doktor konsültasyonu" 
                  className="w-full h-80 object-cover rounded-xl"
                />
                <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">GDPR & HIPAA Uyumlu</span>
                  <span className="text-xs text-gray-500">Güvenli Veri Koruması</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Platform Özellikleri</h2>
            <p className="text-lg text-gray-600">Sağlık hizmetleriniz için ihtiyacınız olan her şey</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <div className={feature.iconColor}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Demo */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">AI Doktor Asistanı Nasıl Çalışır?</h2>
            <p className="text-lg text-blue-100">Yapay zeka destekli asistanımız size en uygun tedaviyi bulmanızda yardımcı olur</p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Chat Demo */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex-1">
                    <p className="text-sm text-gray-700">Nefes alırken ciğerlerim acıyor, neden olabilir?</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg flex-1">
                    <p className="text-sm text-gray-700 mb-2">Bu durumu daha iyi anlamak için birkaç sorum var:</p>
                    <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                      <li>Her zaman mı, yoksa derin nefes aldığım da mı ağrıyor?</li>
                      <li>Batma şeklinde mi yanma şeklinde mi?</li>
                      <li>Ne kadar süredir devam ediyor?</li>
                    </ol>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div className="bg-gray-100 p-3 rounded-lg flex-1">
                    <p className="text-sm text-gray-700">Derin nefes aldığımda batma şeklinde, 3 gündür devam ediyor.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg flex-1">
                    <p className="text-sm text-gray-700">Bu semptomlar akciğer zarı iltihapı veya kas gerginliği ile ilişkili olabilir. Hangi şehirde tedavi olmak istersiniz? Size uygun göğüs hastalıkları uzmanlarını listeliyorum.</p>
                  </div>
                </div>
              </div>
              
              {/* AI Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Asistan Özellikleri</h3>
                <div className="space-y-4">
                  {aiFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Clinics */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Popüler Klinikler</h2>
            <p className="text-lg text-gray-600">En çok tercih edilen ve en yüksek puanlı klinikler</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <img 
                  src={clinic.image} 
                  alt={clinic.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{clinic.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{clinic.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{clinic.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{clinic.reviews}</span>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      Profil Gör
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-bold">MediTravel</span>
              </div>
              <p className="text-gray-400">Sağlık hizmetleriniz için güvenilir platform</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Hizmetler</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Klinik Arama</a></li>
                <li><a href="#" className="hover:text-white">Doktor Randevusu</a></li>
                <li><a href="#" className="hover:text-white">Telehealth</a></li>
                <li><a href="#" className="hover:text-white">Sağlık Turizmi</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white">İletişim</a></li>
                <li><a href="#" className="hover:text-white">SSS</a></li>
                <li><a href="#" className="hover:text-white">Geri Bildirim</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Güvenlik</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-white">Kullanım Şartları</a></li>
                <li><a href="#" className="hover:text-white">GDPR Uyumluluk</a></li>
                <li><a href="#" className="hover:text-white">Veri Güvenliği</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MediTravel. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MediTravelHomepage; 