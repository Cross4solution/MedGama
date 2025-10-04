import React, { useState, useEffect } from 'react';
import LeafletMap from 'components/map/LeafletMap';
import {
  Award,
  Stethoscope,
  Activity,
  Brain,
  Heart,
  CheckCircle,
  Shield,
  Users,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Minus
} from 'lucide-react';

const DoctorProfilePage = () => {
  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFollowing, setIsFollowing] = useState(false);

  const [doctorName] = useState('Dr. Ayşe Yılmaz');
  const [doctorTitle] = useState('Kardiyoloji Uzmanı');
  const [doctorLocation] = useState('Istanbul, Turkey');
  const [heroImage] = useState('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800');

  const [aboutTitle] = useState('Hakkımda');
  const [aboutP1] = useState("1998 yılında İstanbul Üniversitesi Tıp Fakültesi'nden mezun oldum ve kardiyoloji alanında uzmanlık eğitimimi tamamladım.\n15 yılı aşkın süredir kardiyoloji alanında hizmet veriyorum.");
  const [aboutP2] = useState('Hastalarıma en güncel tedavi yöntemlerini sunmak ve onların yaşam kalitesini artırmak önceliğimdir.\nUluslararası kongrelerde sunumlar yaptım ve çok sayıda bilimsel yayına imza attım.');

  const [services] = useState([
    { name: 'Koroner Anjiyografi', icon: Heart, description: 'Kalp damarlarının görüntülenmesi ve tedavisi' },
    { name: 'Ekokardiyografi', icon: Activity, description: 'Kalp ultrason görüntüleme' },
    { name: 'Ritim Bozuklukları', icon: Activity, description: 'Aritmilerin tanı ve tedavisi' },
    { name: 'Kalp Yetmezliği', icon: Heart, description: 'Kronik kalp hastalıklarının yönetimi' },
  ]);

  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'degerlendirmeler', label: 'Reviews' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'konum', label: 'Location' }
  ];

  const [gallery] = useState([
    'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600'
  ]);
  
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [locationAddress] = useState('Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul');

  const [reviews] = useState([
    { 
      id: 1, 
      name: 'Mehmet K.', 
      rating: 5, 
      service: 'Koroner Anjiyografi', 
      date: '1 hafta önce', 
      comment: 'Dr. Ayşe Hanım\'ın ilgisi ve profesyonelliği harika. İşlemden önce her şeyi detaylı anlattı.',
      helpful: 24,
      verified: true 
    },
    { 
      id: 2, 
      name: 'Zeynep A.', 
      rating: 5, 
      service: 'Ekokardiyografi', 
      date: '2 hafta önce', 
      comment: 'Çok titiz ve özenli bir doktor. Sonuçları detaylı açıkladı.',
      helpful: 18,
      verified: true 
    }
  ]);

  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setGalleryOpen(false);
      if (e.key === 'ArrowLeft') setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length);
      if (e.key === 'ArrowRight') setGalleryIndex(i => (i + 1) % gallery.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [galleryOpen, gallery.length]);

  useEffect(() => {
    if (galleryOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [galleryOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
              <img src={heroImage} alt={doctorName} className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{doctorName}</h1>
                      <CheckCircle className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-lg text-blue-100 mb-2">{doctorTitle}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{doctorLocation}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>4.9 (342 reviews)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`${isFollowing
                      ? 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'} border px-3 py-2 sm:px-3 sm:py-1 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md w-28`}
                    aria-label={isFollowing ? 'Unfollow' : 'Follow'}
                  >
                    {isFollowing ? (
                      <>
                        <Minus className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm whitespace-nowrap">Unfollow</span>
                      </>
                    ) : (
                      <>
                        <img src="/images/icon/plus-svgrepo-com.svg" alt="Plus" className="w-4 h-4 flex-shrink-0 brightness-0 invert" />
                        <span className="text-sm whitespace-nowrap">Follow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="border-b">
                <div className="flex overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'text-teal-600 border-b-2 border-teal-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6">
                {/* Overview */}
                {activeTab === 'genel-bakis' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">{aboutTitle}</h3>
                      <p className="text-gray-600 leading-relaxed mb-4" style={{ whiteSpace: 'pre-line' }}>
                        {aboutP1}
                      </p>
                      <p className="text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                        {aboutP2}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Board Certified</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                        <Shield className="w-6 h-6 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">15+ Years</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                        <Award className="w-6 h-6 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Publications</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                        <Users className="w-6 h-6 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Patient-Focused</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Services */}
                {activeTab === 'hizmetler' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Hizmetler</h3>
                    <div className="space-y-3">
                      {services.map((service, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                          <service.icon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span className="font-medium text-gray-900">{service.name}</span>
                            <span className="text-sm text-gray-600">{service.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {activeTab === 'degerlendirmeler' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Reviews</h3>
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{review.name}</span>
                                {review.verified && <CheckCircle className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div className="text-sm text-gray-500">{review.date}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {review.service}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                          <div className="mt-2 text-sm text-gray-500">
                            {review.helpful} helpful
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {activeTab === 'galeri' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Gallery</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {gallery.map((src, idx) => (
                        <button
                          key={`g-${idx}`}
                          type="button"
                          className="relative w-full pb-[100%] bg-gray-100 rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          onClick={() => { setGalleryIndex(idx); setGalleryOpen(true); }}
                        >
                          <img src={src} alt={`Gallery ${idx+1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 hover:scale-[1.03]" />
                        </button>
                      ))}
                    </div>

                    {galleryOpen && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                        <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-lg" onClick={() => setGalleryOpen(false)} />
                        <div className="relative z-[101] flex items-center justify-center">
                          <div className="relative w-[88vw] h-[88vw] md:w-[70vh] md:h-[70vh] max-w-[1100px] max-h-[1100px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 flex items-center justify-center">
                            <img
                              src={gallery[galleryIndex]}
                              alt={`Gallery ${galleryIndex+1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setGalleryOpen(false)}
                              className="absolute top-3 right-3 md:top-4 md:right-4 h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
                              aria-label="Close"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                          {gallery.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[120%] mr-5 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
                                aria-label="Previous image"
                              >
                                <ChevronLeft className="w-6 h-6" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setGalleryIndex((i) => (i + 1) % gallery.length)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[120%] ml-5 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
                                aria-label="Next image"
                              >
                                <ChevronRight className="w-6 h-6" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                {activeTab === 'konum' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Location</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-5 h-5 mt-0.5 text-teal-600" />
                        <span>{locationAddress}</span>
                      </div>
                      <div className="rounded-xl overflow-hidden border shadow-sm">
                        <LeafletMap 
                        address={locationAddress}
                        height="320px"
                        zoom={15}
                      />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
              <button className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium">
                Online Consultation
              </button>
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Book Appointment
              </button>
              <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Send Message
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Consultation</span>
                  <span className="font-medium text-gray-900">₺500 - ₺800</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Angiography</span>
                  <span className="font-medium text-gray-900">₺8K - ₺15K</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Echocardiography</span>
                  <span className="font-medium text-gray-900">₺1K - ₺2K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;