import React, { useState, useEffect, lazy, Suspense, useRef, useMemo } from 'react';
import { Search, Video, MapPin, Star, Shield, Users, Calendar, Send, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatDemo from '../components/ChatDemo';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';

const MediTravelHomepage = () => {
  const [chatInput, setChatInput] = useState('');
  const [visibleDemoMessages, setVisibleDemoMessages] = useState([]);
  const [currentTypingMessage, setCurrentTypingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const clinicsContainerRef = useRef(null);

  const demoChatMessages = useMemo(() => [
    {
      id: 1,
      sender: 'user',
      text: 'Göğsümde ağrı var',
      avatar: null
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Ne kadar süredir devam ediyor?',
      avatar: <MessageCircle className="w-3 h-3 text-white" />
    },
    {
      id: 3,
      sender: 'user',
      text: '3 gündür sürekli',
      avatar: null
    },
    {
      id: 4,
      sender: 'ai',
      text: 'Size uygun doktorları buluyorum...',
      avatar: <MessageCircle className="w-3 h-3 text-white" />
    }
  ], []);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Clinics horizontal scroll functions
  const scrollClinics = (direction) => {
    if (clinicsContainerRef.current) {
      const scrollAmount = 320; // card width + gap
      const currentScroll = clinicsContainerRef.current.scrollLeft;
      
      let newSlide;
      let newScroll;
      
      if (direction === 'left') {
        // Sola git
        if (currentSlide === 0) {
          // En başta ise sona git
          newSlide = 6;
          newScroll = 6 * scrollAmount;
        } else {
          // Normal sola git
          newSlide = currentSlide - 1;
          newScroll = currentScroll - scrollAmount;
        }
      } else {
        // Sağa git
        if (currentSlide === 6) {
          // En sonda ise başa git
          newSlide = 0;
          newScroll = 0;
        } else {
          // Normal sağa git
          newSlide = currentSlide + 1;
          newScroll = currentScroll + scrollAmount;
        }
      }
      
      setCurrentSlide(newSlide);
      
      clinicsContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag handlers for clinics
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - clinicsContainerRef.current.offsetLeft);
    setScrollLeft(clinicsContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - clinicsContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    clinicsContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Scroll event listener for clinics
  useEffect(() => {
    const handleScroll = () => {
      if (clinicsContainerRef.current) {
        const scrollLeft = clinicsContainerRef.current.scrollLeft;
        const cardWidth = 320; // card width + gap
        const newSlide = Math.round(scrollLeft / cardWidth);
        
        // Döngüsel slide hesaplama
        let adjustedSlide = newSlide;
        if (newSlide < 0) adjustedSlide = 6;
        if (newSlide > 6) adjustedSlide = 0;
        
        setCurrentSlide(adjustedSlide);
      }
    };

    const container = clinicsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);



  useEffect(() => {
    scrollToBottom();
  }, [visibleDemoMessages, currentTypingMessage]);

  useEffect(() => {
    let messageIndex = 0;
    let charIndex = 0;
    let currentText = '';

    const startDemoChat = () => {
      const processMessage = () => {
        if (messageIndex >= demoChatMessages.length) {
          // Demo bitti, başa dön
          timeoutRef.current = setTimeout(() => {
            setVisibleDemoMessages([]);
            setCurrentTypingMessage(null);
            setIsTyping(false);
            setShowTypingIndicator(false);
            messageIndex = 0;
            charIndex = 0;
            currentText = '';
            startDemoChat();
          }, 4000);
          return;
        }

        const message = demoChatMessages[messageIndex];

        if (message.sender === 'user') {
          // User mesajı - direkt göster
          setVisibleDemoMessages(prev => [...prev, { 
            ...message, 
            fullText: message.text,
            uniqueId: `${message.id}-${Date.now()}-${Math.random()}`
          }]);
          messageIndex++;
          timeoutRef.current = setTimeout(processMessage, 1500);
        } else {
          // AI mesajı - typing efekti
          setShowTypingIndicator(true);
          setCurrentTypingMessage({ ...message, currentText: '' });

          timeoutRef.current = setTimeout(() => {
            setShowTypingIndicator(false);
            setIsTyping(true);
            charIndex = 0;
            currentText = '';

            intervalRef.current = setInterval(() => {
              if (charIndex < message.text.length) {
                currentText += message.text[charIndex];
                setCurrentTypingMessage({ ...message, currentText });
                charIndex++;
              } else {
                clearInterval(intervalRef.current);
                setIsTyping(false);
                setVisibleDemoMessages(prev => [...prev, { 
                  ...message, 
                  fullText: message.text,
                  uniqueId: `${message.id}-${Date.now()}-${Math.random()}`
                }]);
                setCurrentTypingMessage(null);
                messageIndex++;
                timeoutRef.current = setTimeout(processMessage, 1000);
              }
            }, 50);
          }, 800);
        }
      };

      // İlk mesajı başlat
      timeoutRef.current = setTimeout(processMessage, 1000);
    };

    startDemoChat();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [demoChatMessages]);

  const clinics = [
    {
      id: 1,
      name: "Anadolu Sağlık Merkezi",
      location: "İstanbul • Kalp Cerrahisi, Onkoloji",
      rating: 4.8,
      reviews: "342 Değerlendirme",
      image: "/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg"
    },
    {
      id: 2,
      name: "Memorial Hastanesi",
      location: "Ankara • Plastik Cerrahi, Estetik",
      rating: 4.9,
      reviews: "186 Değerlendirme",
      image: "/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg"
    },
    {
      id: 3,
      name: "Ege Üniversitesi Tıp",
      location: "İzmir • Nöroloji, Ortopedi",
      rating: 4.7,
      reviews: "428 Değerlendirme",
      image: "/images/caroline-lm-uqved8dypum-unsplash_720.jpg"
    },
    {
      id: 4,
      name: "Acıbadem Hastanesi",
      location: "İstanbul • Genel Cerrahi, Kadın Doğum",
      rating: 4.6,
      reviews: "295 Değerlendirme",
      image: "/images/petr-magera-huwm7malj18-unsplash_720.jpg"
    },
    {
      id: 5,
      name: "Liv Hastanesi",
      location: "İstanbul • Kardiyoloji, Diş Hekimliği",
      rating: 4.5,
      reviews: "178 Değerlendirme",
      image: "/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg"
    },
    {
      id: 6,
      name: "Medical Park Hastanesi",
      location: "Bursa • Göz Hastalıkları, Dermatoloji",
      rating: 4.4,
      reviews: "234 Değerlendirme",
      image: "/images/caroline-lm-uqved8dypum-unsplash_720.jpg"
    },
    {
      id: 7,
      name: "Özel Florence Nightingale",
      location: "İstanbul • Çocuk Hastalıkları, Psikiyatri",
      rating: 4.7,
      reviews: "156 Değerlendirme",
      image: "/images/petr-magera-huwm7malj18-unsplash_720.jpg"
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

  // Navigation helper
  const navigate = useNavigate();

  // Simple clinic search state
  const [q, setQ] = useState('');

  const navigateToClinics = (params = {}) => {
    const usp = new URLSearchParams(params);
    const qs = usp.toString();
    navigate(`/clinics${qs ? `?${qs}` : ''}`);
  };

  // Custom search cascading selects (mock data)
  const countries = ['Türkiye', 'Almanya', 'İngiltere'];
  const citiesByCountry = {
    Türkiye: ['İstanbul', 'Ankara', 'İzmir'],
    Almanya: ['Berlin', 'Münih'],
    İngiltere: ['Londra', 'Manchester']
  };
  const branches = ['Kardiyoloji', 'Ortopedi', 'Nöroloji', 'Diş', 'Plastik Cerrahi'];
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [branch, setBranch] = useState('');

  useEffect(() => {
    // reset city if country changes
    setCity('');
  }, [country]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <HeroSection />

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

      {/* Clinic Search (simple) */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Klinik Ara</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder="Klinik, doktor veya tedavi ara..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => navigateToClinics({ q })}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Ara
            </button>
          </div>
        </div>
      </section>

      {/* Custom Search (country -> city -> branch) */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Özel Arama</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ülke</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              >
                <option value="">Seçiniz</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Şehir</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!country}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 disabled:bg-gray-100"
              >
                <option value="">Seçiniz</option>
                {(citiesByCountry[country] || []).map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Branş</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              >
                <option value="">Seçiniz</option>
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => navigateToClinics({ country, city, branch })}
                className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Sonuçları Göster
              </button>
            </div>
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
          
          <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-xl h-[600px] sm:h-[500px] relative overflow-hidden">
            {/* Mobil için arka plan resmi - tüm genişlik, yarı yükseklikten biraz az */}
            <div 
              className="md:hidden absolute -left-8 -top-8 w-[calc(100%+4rem)] h-[calc(45%+4rem)] z-0"
              style={{
                backgroundImage: `url('/images/sleek-black-and-green-gradient-tech-background-with-metal-texture-and-soft-lines-photo.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            ></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 h-full relative">
              {/* Arka plan resmi - desktop'ta sol yarı için */}
              <div 
                className="hidden md:block absolute -left-8 -top-8 w-[calc(50%+4rem)] h-[calc(100%+4rem)] z-0"
                style={{
                  backgroundImage: `url('/images/pexels-diva-30920085_720.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              ></div>
              
              {/* Chat Demo - Mobilde üst yarı, desktop'ta sol yarı */}
              <div className="h-1/2 md:h-full overflow-hidden relative z-10 -m-4 sm:-m-8 p-4 sm:p-8">
                <ChatDemo />
              </div>
              
              {/* AI Features - Mobilde alt yarı sabit, desktop'ta sağ yarı */}
              <div className="h-1/2 md:h-full md:overflow-y-auto md:pl-8 mt-4 md:mt-0 relative flex flex-col md:justify-start">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 md:mb-4 md:pl-4 text-center md:text-left">AI Asistan Özellikleri</h3>
                <div className="space-y-2 md:space-y-4 md:pl-4">
                  {aiFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3 justify-center md:justify-start">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="text-center md:text-left">
                        <h4 className="font-medium text-gray-800">{feature.title}</h4>
                        <p className="text-sm text-gray-600 md:block hidden">{feature.description}</p>
                        <p className="text-xs text-gray-600 md:hidden">
                          {feature.title === "Akıllı Sorgulama" && "Semptomları analiz eder"}
                          {feature.title === "Uzman Eşleştirme" && "En uygun doktoru bulur"}
                          {feature.title === "Lokasyon Bazlı" && "İstediğiniz yerdeki seçenekler"}
                          {feature.title === "Turizm Planı" && "Otomatik turizm programı"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Timeline Önizlemesi</h2>
              <p className="text-gray-600 mb-6">Kişisel sağlık yolculuğunuzun öne çıkan adımlarını burada görün. Tam sayfayı görmek için tıklayın.</p>
              <button
                onClick={() => navigate('/timeline')}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Tüm Timeline'ı Gör
              </button>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 h-64 flex items-center justify-center">
                <span className="text-gray-500">Timeline kart/akış önizleme alanı</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Clinics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Popüler Klinikler</h2>
            <p className="text-lg text-gray-600">En çok tercih edilen ve en yüksek puanlı klinikler</p>
          </div>
          
          {/* Horizontal Scrollable Container */}
          <div className="relative group">
            {/* Left Gradient Overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Right Gradient Overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Scroll Buttons */}
            <button 
              onClick={() => scrollClinics('left')}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50 z-20"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={() => scrollClinics('right')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50 z-20"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Scrollable Content */}
            <div 
              ref={clinicsContainerRef}
              className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                userSelect: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
            {clinics.map((clinic) => (
                <div 
                  key={clinic.id} 
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80 transform hover:scale-102 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                <img 
                  src={clinic.image} 
                  alt={clinic.name}
                      className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <button className="bg-white text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                          Detayları Gör
                        </button>
                      </div>
                    </div>
                  </div>
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
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                      Profil Gör
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
            {/* Scroll Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (clinicsContainerRef.current) {
                      const scrollAmount = index * 320; // card width + gap
                      clinicsContainerRef.current.scrollTo({
                        left: scrollAmount,
                        behavior: 'smooth'
                      });
                      setCurrentSlide(index);
                    }
                  }}
                  className={`transition-all duration-300 hover:scale-125 ${
                    currentSlide === index 
                      ? 'w-8 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg animate-pulse border-2 border-blue-300' 
                      : 'w-3 h-3 bg-gray-300 rounded-full hover:bg-gray-400'
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
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
            
            <div className="col-span-2 md:col-span-1">
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