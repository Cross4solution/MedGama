import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Badge from '../components/Badge';
import ClinicHero from '../components/clinic/ClinicHero';
import Tabs from '../components/tabs/Tabs';
import ContactActions from '../components/clinic/ContactActions';
import PriceRangeList from '../components/pricing/PriceRangeList';
import ImageGalleryModal from '../components/clinic/modals/ImageGalleryModal';
import { useAuth } from '../context/AuthContext';
import { createInvite } from '../lib/invites';

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
  const params = useParams();
  const viewedClinicId = params?.id || 'clinic-1';
  const isDoctor = user?.role === 'doctor';
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

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
  const [clinicMedstreamUrl, setClinicMedstreamUrl] = useState('https://medstream.com/clinic/anadolu-health-center');
  const [isEditingClinicMedstream, setIsEditingClinicMedstream] = useState(false);
  const [tempClinicMedstreamUrl, setTempClinicMedstreamUrl] = useState('https://medstream.com/clinic/anadolu-health-center');
  const [clinicFollowers] = useState(2450);
  const [clinicLikes] = useState(980);
  const [showMedstreamCopyToast, setShowMedstreamCopyToast] = useState(false);

  const handleClinicMedstreamClick = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!clinicMedstreamUrl) return;
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clinicMedstreamUrl);
      } else {
        const el = document.createElement('textarea');
        el.value = clinicMedstreamUrl;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setShowMedstreamCopyToast(true);
    } catch {
      // ignore copy errors
    }
  };

  const toggleFavoriteClinic = () => {
    setIsFavorite((prev) => {
      const next = !prev;
      try {
        const userKey = user?.email || user?.id;
        if (userKey) {
          const key = `patient_favorite_clinics_${userKey}`;
          const raw = localStorage.getItem(key);
          const list = raw ? JSON.parse(raw) : [];
          const entry = {
            name: clinicInfo.name,
            location: clinicInfo.location,
            image: clinicInfo.heroImage,
          };

          let nextList;
          if (next) {
            const exists = list.some(
              (c) => c && c.name === entry.name && c.location === entry.location
            );
            nextList = exists ? list : [...list, entry];
          } else {
            nextList = list.filter(
              (c) => !(c && c.name === entry.name && c.location === entry.location)
            );
          }
          localStorage.setItem(key, JSON.stringify(nextList));
        }
      } catch {
        // ignore storage errors in demo
      }
      return next;
    });
  };

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
              onToggleFavorite={toggleFavoriteClinic}
              isFollowing={isFollowing}
              onToggleFollow={() => setIsFollowing((v) => !v)}
              onFollow={() => {}}
              onImageClick={() => {
                setGalleryIndex(0);
                setGalleryOpen(true);
              }}
              showInviteButton={isDoctor}
              onInvite={() => setInviteOpen(true)}
              medstreamUrl={clinicMedstreamUrl}
              onEditMedstream={() => {
                setTempClinicMedstreamUrl(clinicMedstreamUrl || '');
                setIsEditingClinicMedstream(true);
              }}
              followerCount={clinicFollowers}
              likeCount={clinicLikes}
            />

            {clinicMedstreamUrl && (
              <div className="mt-0.5 mb-1.5">
                <button
                  type="button"
                  onClick={handleClinicMedstreamClick}
                  className="inline-flex w-full items-center gap-2 rounded-full bg-transparent px-1 sm:px-2 py-1 text-xs sm:text-sm text-gray-700 focus:outline-none"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1C6A83]/5 text-[#1C6A83] flex-shrink-0">
                    <img
                      src="/images/icon/link.svg"
                      alt="MedStream link"
                      className="w-3.5 h-3.5 opacity-90"
                    />
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold hidden sm:inline">
                    MedStream
                  </span>
                  <span className="truncate font-medium text-[#1C6A83] text-left">
                    {clinicMedstreamUrl}
                  </span>
                </button>
              </div>
            )}

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
                    clinicId={viewedClinicId}
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

            {/* Payments card: Deposit & Video Call payment */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Clinic Payments</h3>
                  <p className="text-[11px] text-gray-500">Secure and instant payments</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                  Payment
                </span>
              </div>

              <div className="space-y-3 mt-2">
                <button
                  type="button"
                  className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <line x1="8" y1="15" x2="10" y2="15" />
                  </svg>
                  <span>Pay Deposit</span>
                </button>

                <button
                  type="button"
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path d="m16 13 5 3v-8l-5 3"></path>
                    <rect x="2" y="6" width="14" height="12" rx="2"></rect>
                  </svg>
                  <span>Pay for Video Call</span>
                </button>
              </div>
            </div>

            <PriceRangeList items={priceRangesData} />
          </div>
        </div>
      </div>
      {showMedstreamCopyToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs rounded-xl bg-gray-900/90 text-white px-4 py-3 shadow-lg flex items-center gap-2 text-sm">
          <img src="/images/icon/link.svg" alt="Copied" className="w-4 h-4 flex-shrink-0 opacity-80" />
          <span className="font-medium">Link copied to clipboard</span>
        </div>
      )}
      {isEditingClinicMedstream && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Edit clinic MedStream profile URL</h2>
            <p className="text-xs text-gray-500 mb-3">
              This URL will be shown on your public clinic profile.
            </p>
            <input
              type="text"
              value={tempClinicMedstreamUrl}
              onChange={(e) => setTempClinicMedstreamUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-4"
              placeholder="https://medstream.com/clinic/your-clinic"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsEditingClinicMedstream(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setClinicMedstreamUrl(tempClinicMedstreamUrl.trim());
                  setIsEditingClinicMedstream(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Kliniğe bağlan</h2>
            <p className="text-xs text-gray-500 mb-3">Kliniğe bir davet gönderilecek. Kabul ederse bu klinikte çalışan doktor olarak listelenirsin.</p>
            <textarea
              rows={3}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-4 resize-none"
              placeholder="Mesaj (opsiyonel)"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setInviteOpen(false);
                  setInviteMessage('');
                }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  const fromId = user?.id || user?.email || user?.name || 'doc-1';
                  createInvite({
                    fromType: 'doctor',
                    fromId,
                    fromName: user?.name || 'Doctor',
                    fromTitle: user?.title || '',
                    fromAvatar: user?.avatar || '',
                    toType: 'clinic',
                    toId: viewedClinicId,
                    toName: clinicInfo.name,
                    toTitle: '',
                    toAvatar: '',
                    message: inviteMessage,
                    clinicMeta: { id: viewedClinicId, name: clinicInfo.name, href: `/clinic/${viewedClinicId}` },
                    doctorMeta: { id: fromId, name: user?.name || 'Doctor', title: user?.title || '', href: `/doctor/${fromId}` },
                  });
                  setInviteOpen(false);
                  setInviteMessage('');
                }}
              >
                Davet Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicDetailPage;
