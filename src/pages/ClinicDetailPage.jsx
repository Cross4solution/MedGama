import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import Badge from '../components/Badge';
import ClinicHero from '../components/clinic/ClinicHero';
import Tabs from '../components/tabs/Tabs';
import ContactActions from '../components/clinic/ContactActions';
import PriceRangeList from '../components/pricing/PriceRangeList';
import { useAuth } from '../context/AuthContext';

// Tab Components
import OverviewTab from '../components/clinic/tabs/OverviewTab';
import PricesTab from '../components/clinic/tabs/PricesTab';
import DoctorsTab from '../components/clinic/tabs/DoctorsTab';
import ReviewsTab from '../components/clinic/tabs/ReviewsTab';
import GalleryTab from '../components/clinic/tabs/GalleryTab';
import BeforeAfterTab from '../components/clinic/tabs/BeforeAfterTab';
import LocationTab from '../components/clinic/tabs/LocationTab';

// Mock Data
import {
  clinicInfo,
  aboutData,
  servicesData,
  departmentsData,
  reviewsData,
  galleryData,
  beforeAfterData,
  priceRangesData,
  tabsConfig
} from '../data/clinicMockData';

const ClinicDetailPage = () => {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // UI State
  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Prices Tab State
  const [selectedService, setSelectedService] = useState(null);
  
  // Doctors Tab State
  const [selectedDept, setSelectedDept] = useState(null);
  const doctorsText = 'Our expert doctors provide comprehensive care across multiple specialties, focusing on patient safety and outcomes.';
  
  // Gallery State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  // Before & After State
  const [beforeAfterIndex, setBeforeAfterIndex] = useState(0);
  const [beforeAfterOpen, setBeforeAfterOpen] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'genel-bakis':
        return <OverviewTab aboutTitle={aboutData.title} aboutP1={aboutData.paragraph1} aboutP2={aboutData.paragraph2} />;
      case 'prices':
        return (
          <PricesTab 
            services={servicesData} 
            selectedService={selectedService}
            setSelectedService={setSelectedService}
          />
        );
      case 'doktorlar':
        return (
          <DoctorsTab
            doctorsText={doctorsText}
            deptDoctors={departmentsData}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
          />
        );
      case 'degerlendirmeler':
        return <ReviewsTab reviews={reviewsData} />;
      case 'galeri':
        return (
          <GalleryTab
            gallery={galleryData}
            galleryIndex={galleryIndex}
            setGalleryIndex={setGalleryIndex}
            galleryOpen={galleryOpen}
            setGalleryOpen={setGalleryOpen}
          />
        );
      case 'before-after':
        return (
          <BeforeAfterTab
            beforeAfterPhotos={beforeAfterData}
            beforeAfterIndex={beforeAfterIndex}
            setBeforeAfterIndex={setBeforeAfterIndex}
            beforeAfterOpen={beforeAfterOpen}
            setBeforeAfterOpen={setBeforeAfterOpen}
            sliderPosition={sliderPosition}
            setSliderPosition={setSliderPosition}
          />
        );
      case 'konum':
        return <LocationTab locationAddress="Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <ClinicHero
              image={clinicInfo.heroImage}
              name={clinicInfo.name}
              location={clinicInfo.location}
              rating={clinicInfo.rating}
              reviews={clinicInfo.reviewCount}
              badgeNode={null}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite(!isFavorite)}
              isFollowing={isFollowing}
              onToggleFollow={() => setIsFollowing((v) => !v)}
              onFollow={() => {}}
            />

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <Tabs tabs={tabsConfig} active={activeTab} onChange={setActiveTab} />
              <div className="px-5 sm:px-6 py-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:top-24 h-max">
            <ContactActions onTelehealth={() => {}} onBook={() => {}} onMessage={() => {}} />
            <PriceRangeList items={priceRangesData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage;
