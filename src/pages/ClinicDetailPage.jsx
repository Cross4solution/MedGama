import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Badge from '../components/Badge';
import ClinicHero from '../components/clinic/ClinicHero';
import Tabs from '../components/tabs/Tabs';
import ContactActions from '../components/clinic/ContactActions';
import PriceRangeList from '../components/pricing/PriceRangeList';
import ImageGalleryModal from '../components/clinic/modals/ImageGalleryModal';
import { useAuth } from '../context/AuthContext';

// Tab Components
import OverviewTab from '../components/clinic/tabs/OverviewTab';
import PricesTab from '../components/clinic/tabs/PricesTab';
import DoctorsTab from '../components/clinic/tabs/DoctorsTab';
import ReviewsTab from '../components/clinic/tabs/ReviewsTab';
import GalleryTab from '../components/clinic/tabs/GalleryTab';
import BeforeAfterTab from '../components/clinic/tabs/BeforeAfterTab';
import LocationTab from '../components/clinic/tabs/LocationTab';
import CertificatesTab from '../components/clinic/tabs/CertificatesTab';
import PublicationsTab from '../components/clinic/tabs/PublicationsTab';

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
  certificatesData,
  publicationsData,
  tabsConfig
} from '../data/clinicMockData';

const ClinicDetailPage = () => {
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 max-w-3xl xl:max-w-4xl">
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
              onImageClick={() => {
                setGalleryIndex(0);
                setGalleryOpen(true);
              }}
            />

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Tabs tabs={tabsConfig} active={activeTab} onChange={setActiveTab} />
              <div className="px-6 pb-6 space-y-6">
                {/* Overview */}
                {activeTab === 'genel-bakis' && (
                  <OverviewTab
                    aboutTitle={aboutData.title}
                    aboutP1={aboutData.paragraph1}
                    aboutP2={aboutData.paragraph2}
                  />
                )}

                {/* Prices */}
                {activeTab === 'prices' && (
                  <PricesTab
                    services={servicesData}
                    selectedService={selectedService}
                    setSelectedService={setSelectedService}
                  />
                )}

                {/* Doctors */}
                {activeTab === 'doktorlar' && (
                  <DoctorsTab
                    doctorsText={doctorsText}
                    deptDoctors={departmentsData}
                    selectedDept={selectedDept}
                    setSelectedDept={setSelectedDept}
                  />
                )}

                {/* Reviews */}
                {activeTab === 'degerlendirmeler' && (
                  <ReviewsTab reviews={reviewsData} />
                )}

                {/* Gallery */}
                {activeTab === 'galeri' && (
                  <GalleryTab
                    gallery={galleryData}
                    galleryIndex={galleryIndex}
                    setGalleryIndex={setGalleryIndex}
                    galleryOpen={galleryOpen}
                    setGalleryOpen={setGalleryOpen}
                  />
                )}

                {/* Before & After */}
                {activeTab === 'before-after' && (
                  <BeforeAfterTab
                    beforeAfterPhotos={beforeAfterData}
                    beforeAfterIndex={beforeAfterIndex}
                    setBeforeAfterIndex={setBeforeAfterIndex}
                    beforeAfterOpen={beforeAfterOpen}
                    setBeforeAfterOpen={setBeforeAfterOpen}
                    sliderPosition={sliderPosition}
                    setSliderPosition={setSliderPosition}
                  />
                )}

                {/* Certificates */}
                {activeTab === 'certificates' && (
                  <CertificatesTab certificates={certificatesData} />
                )}

                {/* Publications */}
                {activeTab === 'publications' && (
                  <PublicationsTab publications={publicationsData} />
                )}

                {/* Location */}
                {activeTab === 'konum' && (
                  <LocationTab locationAddress="Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul" />
                )}

                {/* Shared mini sections visible on Overview tab */}
                {activeTab === 'genel-bakis' && (
                  <>
                    {galleryData && galleryData.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-base font-semibold text-gray-900">Gallery</h4>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {galleryData.slice(0, 4).map((src, idx) => (
                            <button
                              key={`overview-gal-${idx}`}
                              type="button"
                              className="h-20 sm:h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              onClick={() => {
                                setGalleryIndex(idx);
                                setGalleryOpen(true);
                              }}
                            >
                              <img
                                src={src}
                                alt={`Clinic gallery ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <ImageGalleryModal
              images={galleryData}
              currentIndex={galleryIndex}
              isOpen={galleryOpen}
              onClose={() => setGalleryOpen(false)}
              onPrev={() => setGalleryIndex((i) => (i - 1 + galleryData.length) % galleryData.length)}
              onNext={() => setGalleryIndex((i) => (i + 1) % galleryData.length)}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 xl:w-96 space-y-6">
            <ContactActions onTelehealth={() => {}} onBook={() => {}} onMessage={() => {}} />
            <PriceRangeList items={priceRangesData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage;
