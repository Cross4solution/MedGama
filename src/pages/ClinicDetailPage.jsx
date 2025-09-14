import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Stethoscope,
  Activity,
  Brain,
  Scissors,
  ChevronRight,
  CheckCircle,
  Star,
  Shield,
  Users,
} from 'lucide-react';
import { Header } from '../components/layout';
import Badge from '../components/Badge';
import ClinicHero from 'components/clinic/ClinicHero';
import Tabs from 'components/tabs/Tabs';
import ServiceCard from 'components/clinic/ServiceCard';
import ReviewItem from 'components/reviews/ReviewItem';
import ContactActions from 'components/clinic/ContactActions';
import PriceRangeList from 'components/pricing/PriceRangeList';
import QuickContactCard from 'components/clinic/QuickContactCard';

const ClinicDetailPage = () => {
  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'doktorlar', label: 'Doctors' },
    { id: 'degerlendirmeler', label: 'Reviews' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'konum', label: 'Location' }
  ];

  const services = [
    {
      name: 'Kalp Cerrahisi',
      icon: <Activity className="w-5 h-5" />,
      description: 'Bypass, kapak replasmanı, arytoplasti'
    },
    
    {
      name: 'Onkoloji',
      icon: <Stethoscope className="w-5 h-5" />,
      description: 'Kanser tanısı, kemoterapi, radyoterapi'
    },
    {
      name: 'Nöroloji',
      icon: <Brain className="w-5 h-5" />,
      description: 'Beyin cerrahisi, epilepsi tedavisi'
    },
    {
      name: 'Plastik Cerrahi',
      icon: <Scissors className="w-5 h-5" />,
      description: 'Estetik ve rekonstrüktif cerrahi'
    }
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

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Home</span>
          <ChevronRight className="w-4 h-4" />
          <span>Clinics</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Anadolu Health Center</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Hero Section */}
            <ClinicHero
              image="/images/petr-magera-huwm7malj18-unsplash_720.jpg"
              name="Anadolu Health Center"
              location="Istanbul, Turkey"
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
              <div className="p-6">
                {activeTab === 'genel-bakis' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">About Us</h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Anadolu Health Center is one of Turkey's leading healthcare institutions with 15 years of experience.
                        Our JCI-accredited hospital provides healthcare services at international standards.
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        With over 50 specialist doctors and state-of-the-art medical equipment, we offer services in
                        cardiac surgery, oncology, neurology, and plastic surgery.
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

                {activeTab === 'hizmetler' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Our Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {services.map((service, index) => (
                        <ServiceCard key={index} icon={service.icon} name={service.name} description={service.description} />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'degerlendirmeler' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">Patient Reviews</h3>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.8</span>
                        <span className="text-gray-600">(342 reviews)</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge label="PRO Review" variant="purple" size="sm" rounded="full" icon={<Award className="w-4 h-4" />} />
                      </div>
                      <p className="text-purple-700 text-sm">
                        By MediTravel Expert Team: "The clinic provides services at international standards. The medical staff and technological infrastructure are very strong. Patient satisfaction is at a high level."
                      </p>
                    </div>
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <ReviewItem key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Contact Actions */}
            <ContactActions onTelehealth={() => {}} onBook={() => {}} onMessage={() => {}} />

            {/* Health Tourism Package */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Health Tourism Package</h3>
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Treatment + Accommodation + Transfer</span>
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-1.5 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Create Package</span>
              </button>
            </div>

            {/* Price Range */}
            <PriceRangeList items={priceRanges} />

            {/* Quick Contact removed as requested */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage; 