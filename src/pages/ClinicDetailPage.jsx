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

            <div className="bg-white rounded-xl shadow-lg p-5 border border-emerald-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Tourism package</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Highlight your clinic's health tourism offer with a dedicated package.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-purple-600 text-white text-xs font-medium shadow-sm hover:bg-purple-700 hover:shadow-md transition-colors"
              >
                Create tourism package
              </button>
            </div>

            {user?.role === 'clinic' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">MedStream profile & URL</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Public clinic profile link</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    aria-label="Edit MedStream URL"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2">
                  <a
                    href="https://medstream.com/clinic/anadolu-health-center"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 break-all"
                  >
                    https://medstream.com/clinic/anadolu-health-center
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage;
