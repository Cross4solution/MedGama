import React, { useState, useEffect } from 'react';
import {
  Award,
  Stethoscope,
  Activity,
  Brain,
  Scissors,
  CheckCircle,
  Shield,
  Users,
  Link as LinkIcon,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Badge from '../components/Badge';
import LeafletMap from 'components/map/LeafletMap';
import ClinicHero from 'components/clinic/ClinicHero';
import Tabs from 'components/tabs/Tabs';
import ReviewItem from 'components/reviews/ReviewItem';
import ContactActions from 'components/clinic/ContactActions';
import PriceRangeList from 'components/pricing/PriceRangeList';
import { useAuth } from '../context/AuthContext';

const ClinicDetailPage = () => {
  const { user } = useAuth();
  const isClinic = Boolean(user && user.role === 'clinic');

  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Editable fields (demo state).
  const [clinicName, setClinicName] = useState('Anadolu Health Center');
  const [clinicLocation, setClinicLocation] = useState('Istanbul, Turkey');
  const [heroImage, setHeroImage] = useState('/images/petr-magera-huwm7malj18-unsplash_720.jpg');

  const [aboutTitle, setAboutTitle] = useState('About Us');
  const [aboutP1, setAboutP1] = useState("Anadolu Health Center is one of Turkey's leading healthcare institutions with 15 years of experience.\nOur JCI-accredited hospital provides healthcare services at international standards.");
  const [aboutP2, setAboutP2] = useState('With over 50 specialist doctors and state-of-the-art medical equipment, we offer services in\ncardiac surgery, oncology, neurology, and plastic surgery.');

  const [services, setServices] = useState([
    { name: 'Kalp Cerrahisi', icon: Activity, description: 'Bypass, kapak replasmanı, arytoplasti' },
    { name: 'Onkoloji', icon: Stethoscope, description: 'Kanser tanısı, kemoterapi, radyoterapi' },
    { name: 'Nöroloji', icon: Brain, description: 'Beyin cerrahisi, epilepsi tedavisi' },
    { name: 'Plastik Cerrahi', icon: Scissors, description: 'Estetik ve rekonstrüktif cerrahi' },
  ]);

  const [doctorsText, setDoctorsText] = useState('Our expert doctors provide comprehensive care across multiple specialties, focusing on patient safety and outcomes.');
  
  // Tabs listesi
  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'doktorlar', label: 'Doctors' },
    { id: 'degerlendirmeler', label: 'Reviews' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'konum', label: 'Location' }
  ];

  // Gallery state
  const [gallery, setGallery] = useState([
    '/images/portrait-candid-male-doctor_720.jpg',
    '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
    '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg'
  ]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Location state
  const [locationAddress, setLocationAddress] = useState('Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul');

  // Gallery modal: keyboard support
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setGalleryOpen(false);
      if (e.key === 'ArrowLeft') setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length);
      if (e.key === 'ArrowRight') setGalleryIndex((i) => (i + 1) % gallery.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [galleryOpen, gallery.length]);

  // Modal açıkken body'ye sınıf ekle (header beyazlığını gizlemek için)
  useEffect(() => {
    if (galleryOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [galleryOpen]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Hero Section */}
            <ClinicHero
              image={heroImage}
              name={clinicName}
              location={clinicLocation}
              rating={4.8}
              reviews={342}
              badgeNode={(
                <Badge
                  label="JCI Accredited"
                  variant="green"
                  size="sm"
                  rounded="full"
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              )}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite(!isFavorite)}
              isFollowing={isFollowing}
              onToggleFollow={() => setIsFollowing((v) => !v)}
              onFollow={() => {}}
            />

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
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
                        <span className="text-sm font-medium text-gray-700">JCI Accredited</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                        <Shield className="w-6 h-6 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">ISO 9001</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                        <Award className="w-6 h-6 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Ministry of Health</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                        <Users className="w-6 h-6 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Health Tourism</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Services */}
                {activeTab === 'hizmetler' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Our Services</h3>
                    <div className="space-y-3">
                      {services.map((service, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                        >
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

                {/* Doctors */}
                {activeTab === 'doktorlar' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Doctors</h3>
                    <p className="text-gray-600">{doctorsText}</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-white shadow rounded-lg p-4 flex items-center gap-4">
                        <img
                          src="/images/portrait-candid-male-doctor_720.jpg"
                          alt="Doctor"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">Dr. Ali Yılmaz</h4>
                          <p className="text-sm text-gray-600">Cardiac Surgeon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {activeTab === 'degerlendirmeler' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Reviews</h3>
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <ReviewItem key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {activeTab === 'galeri' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Gallery</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {gallery.map((src, idx)=> (
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
                        {/* Wrapper keeps arrows outside the image frame */}
                        <div className="relative z-[101] flex items-center justify-center">
                          {/* Image box */}
                          <div className="relative w-[88vw] h-[88vw] md:w-[70vh] md:h-[70vh] max-w-[1100px] max-h-[1100px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 flex items-center justify-center">
                            <img
                              src={gallery[galleryIndex]}
                              alt={`Gallery ${galleryIndex+1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Close */}
                            <button
                              type="button"
                              onClick={() => setGalleryOpen(false)}
                              className="absolute top-3 right-3 md:top-4 md:right-4 h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
                              aria-label="Close"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                          {/* Prev - slightly further outside the image box */}
                          {gallery.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[120%] mr-5 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                          )}

                          {/* Next - slightly further outside the image box */}
                          {gallery.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setGalleryIndex((i) => (i + 1) % gallery.length)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[120%] ml-5 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
                              aria-label="Next image"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
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
                        <LeafletMap address={locationAddress} height="320px" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            <ContactActions onTelehealth={() => {}} onBook={() => {}} onMessage={() => {}} />
            <PriceRangeList items={priceRanges} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage;
