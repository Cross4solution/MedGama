import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Minus,
  Video
} from 'lucide-react';
import Tabs from 'components/tabs/Tabs';

const DoctorProfilePage = () => {
  const { id: doctorId } = useParams();
  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFollowing, setIsFollowing] = useState(false);
  const [apiDoctor, setApiDoctor] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (doctorId) {
      import('../lib/api').then(({ clinicAPI }) => {
        clinicAPI.staff(doctorId).catch(() => null);
      }).catch(() => {});
    }
  }, [doctorId]);

  const [doctorName] = useState(apiDoctor?.fullname || 'Dr. Ayşe Yılmaz');
  const [doctorTitle] = useState(apiDoctor?.specialty || 'Kardiyoloji Uzmanı');
  const [doctorLocation] = useState(apiDoctor?.address || 'Istanbul, Turkey');
  const [heroImage] = useState(apiDoctor?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800');

  const [aboutTitle] = useState('Hakkımda');
  const [aboutP1] = useState("1998 yılında İstanbul Üniversitesi Tıp Fakültesi'nden mezun oldum ve kardiyoloji alanında uzmanlık eğitimimi tamamladım.\n15 yılı aşkın süredir kardiyoloji alanında hizmet veriyorum.");
  const [aboutP2] = useState('Hastalarıma en güncel tedavi yöntemlerini sunmak ve onların yaşam kalitesini artırmak önceliğimdir.\nUluslararası kongrelerde sunumlar yaptım ve çok sayıda bilimsel yayına imza attım.');

  const [services] = useState([
    { name: 'Koroner Anjiyografi', icon: Heart, description: 'Kalp damarlarının görüntülenmesi ve tedavisi' },
    { name: 'Ekokardiyografi', icon: Activity, description: 'Kalp ultrason görüntüleme' },
    { name: 'Ritim Bozuklukları', icon: Activity, description: 'Aritmilerin tanı ve tedavisi' },
    { name: 'Kalp Yetmezliği', icon: Heart, description: 'Kronik kalp hastalıklarının yönetimi' },
  ]);

  // Tabs list (restored similar to ClinicDetailPage)
  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'degerlendirmeler', label: 'Reviews' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'konum', label: 'Location' },
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="relative h-40 md:h-48">
        <img src={heroImage} alt={doctorName} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute top-4 right-4 flex items-center bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-white/20">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
          <span className="font-bold text-sm text-gray-900">4.9</span>
          <span className="text-gray-500 text-xs ml-1">(342)</span>
        </div>
      </div>

      {/* Doctor Info Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-10 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={heroImage}
                alt={doctorName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-teal-100 shadow-sm flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{doctorName}</h1>
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                </div>
                <p className="text-sm text-teal-600 font-medium mb-1.5">{doctorTitle}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{doctorLocation}</span>
                  <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 text-gray-400" />15+ Years</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${isFollowing
                ? 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'}`}
            >
              {isFollowing ? (
                <><Minus className="w-4 h-4" /><span>Following</span></>
              ) : (
                <><span>+ Follow</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
              <div className="p-5 sm:p-6">
                {/* Overview */}
                {activeTab === 'genel-bakis' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3" style={{ whiteSpace: 'pre-line' }}>{aboutP1}</p>
                      <p className="text-sm text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{aboutP2}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: CheckCircle, label: 'Board Certified', color: 'bg-teal-50 text-teal-600' },
                        { icon: Shield, label: '15+ Years', color: 'bg-blue-50 text-blue-600' },
                        { icon: Award, label: 'Publications', color: 'bg-violet-50 text-violet-600' },
                        { icon: Users, label: 'Patient-Focused', color: 'bg-amber-50 text-amber-600' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                            <item.icon className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {activeTab === 'hizmetler' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-gray-900">Services</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {services.map((service, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                            <service.icon className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{service.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{service.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {activeTab === 'degerlendirmeler' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-gray-900">Reviews</h3>
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-start justify-between mb-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                                {review.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-gray-900">{review.name}</span>
                                  {review.verified && <CheckCircle className="w-3.5 h-3.5 text-teal-500" />}
                                </div>
                                <div className="text-[11px] text-gray-400">{review.date}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-[11px] font-medium mb-2">
                            {review.service}
                          </span>
                          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                          <div className="mt-2.5 text-[11px] text-gray-400 font-medium">
                            {review.helpful} people found this helpful
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {activeTab === 'galeri' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Gallery</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {gallery.map((src, idx) => (
                        <button
                          key={`g-${idx}`}
                          type="button"
                          className="group relative w-full pb-[100%] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                          onClick={() => { setGalleryIndex(idx); setGalleryOpen(true); }}
                        >
                          <img src={src} alt={`Gallery ${idx+1}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                        </button>
                      ))}
                    </div>

                    {galleryOpen && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                        <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-lg" onClick={() => setGalleryOpen(false)} />
                        <div className="relative z-[101] flex items-center justify-center">
                          <div className="relative w-[88vw] h-[88vw] md:w-[70vh] md:h-[70vh] max-w-[1100px] max-h-[1100px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 flex items-center justify-center">
                            <img src={gallery[galleryIndex]} alt={`Gallery ${galleryIndex+1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setGalleryOpen(false)} className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center" aria-label="Close">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          {gallery.length > 1 && (
                            <>
                              <button type="button" onClick={() => setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[120%] h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center" aria-label="Previous">
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button type="button" onClick={() => setGalleryIndex((i) => (i + 1) % gallery.length)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[120%] h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center" aria-label="Next">
                                <ChevronRight className="w-5 h-5" />
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
                    <h3 className="text-lg font-bold text-gray-900">Location</h3>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 text-teal-600 flex-shrink-0" />
                      <span>{locationAddress}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <LeafletMap address={locationAddress} height="320px" zoom={15} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-4 lg:sticky lg:top-24 h-max">
            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
              </div>
              <div className="p-4 space-y-2.5">
                <button className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-xl hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                  <Video className="w-4 h-4" />
                  <span>Online Consultation</span>
                </button>
                <button className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                  <img src="/images/icon/calender-svgrepo-com.svg" alt="Calendar" className="w-4 h-4 brightness-0 invert" />
                  <span>Book Appointment</span>
                </button>
                <button className="w-full bg-violet-600 text-white py-2.5 px-4 rounded-xl hover:bg-violet-700 focus:ring-4 focus:ring-violet-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                  <img src="/images/icon/chat-round-line-svgrepo-com.svg" alt="Chat" className="w-4 h-4 brightness-0 invert" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Consultation', price: '₺500 – ₺800' },
                  { label: 'Angiography', price: '₺8K – ₺15K' },
                  { label: 'Echocardiography', price: '₺1K – ₺2K' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.price}</span>
                  </div>
                ))}
                <p className="text-[11px] text-gray-400 pt-1">* Prices may vary depending on complexity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;