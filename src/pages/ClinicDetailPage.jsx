import React, { useState } from 'react';
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
  MapPin
} from 'lucide-react';
import Badge from '../components/Badge';
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

  const [gallery, setGallery] = useState([
    '/images/portrait-candid-male-doctor_720.jpg',
    '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
    '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg'
  ]);

  const [locationAddress, setLocationAddress] = useState('Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul');
  const [locationMapUrl, setLocationMapUrl] = useState('https://maps.google.com/?q=Istanbul+Turkey');

  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'doktorlar', label: 'Doctors' },
    { id: 'degerlendirmeler', label: 'Reviews' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'konum', label: 'Location' }
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {gallery.map((src, idx)=> (
                        <div key={`g-${idx}`} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img src={src} alt={`Gallery ${idx+1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                {activeTab === 'konum' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Location</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-5 h-5 mt-0.5 text-teal-600" />
                        <span>{locationAddress}</span>
                      </div>
                      <a
                        href={locationMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                      >
                        <LinkIcon className="w-4 h-4" /> View on Map
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            <ContactActions onTelehealth={() => {}} onBook={() => {}} onMessage={() => {}} />

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Health Tourism Package</h3>
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Treatment + Accommodation + Transfer</span>
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-1.5 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                <img src="/images/icon/archive-up-minimlistic-svgrepo-com.svg" alt="Archive" className="w-5 h-5 brightness-0 invert" />
                <span>Create Package</span>
              </button>
            </div>

            <PriceRangeList items={priceRanges} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage;
