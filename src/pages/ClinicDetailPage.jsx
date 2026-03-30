import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ClinicHero from '../components/clinic/ClinicHero';
import Tabs from '../components/tabs/Tabs';
import ContactActions from '../components/clinic/ContactActions';
import PriceRangeList from '../components/pricing/PriceRangeList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useAuthGuard from '../hooks/useAuthGuard';
import useSocial from '../hooks/useSocial';
import { useTranslation } from 'react-i18next';
import { clinicAPI } from '../lib/api';
import { resolveClinicRating, resolveClinicReviewCount } from '../utils/clinicMetrics';
import SEOHead, { buildMedicalBusinessSchema } from '../components/seo/SEOHead';
import BookAppointmentModal from '../components/modals/BookAppointmentModal';
import SendMessageModal from '../components/modals/SendMessageModal';

// Tab Components
import OverviewTab from '../components/clinic/tabs/OverviewTab';
import PricesTab from '../components/clinic/tabs/PricesTab';
import DoctorsTab from '../components/clinic/tabs/DoctorsTab';
import ReviewsTab from '../components/clinic/tabs/ReviewsTab';
import GalleryTab from '../components/clinic/tabs/GalleryTab';
import BeforeAfterTab from '../components/clinic/tabs/BeforeAfterTab';
import LocationTab from '../components/clinic/tabs/LocationTab';
import MedstreamProfileFeed from '../components/profile/MedstreamProfileFeed';

// Mock Data
import {
  clinicInfo,
  aboutData,
  servicesData,
  galleryData,
  beforeAfterData,
  priceRangesData,
  tabsConfig
} from '../data/clinicMockData';

const ClinicDetailPage = () => {
  const { user } = useAuth();
  const { notify } = useToast();
  const { guardAction } = useAuthGuard();
  const { t } = useTranslation();
  const { id: clinicParam } = useParams();
  const [apiClinic, setApiClinic] = useState(null);
  const [initialSocial, setInitialSocial] = useState({});

  // Modal states
  const [bookModal, setBookModal] = useState(false);
  const [onlineBookModal, setOnlineBookModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (clinicParam) {
      clinicAPI.getByCodename(clinicParam).then((res) => {
        const raw = res?.data || res;
        const c = raw?.clinic || raw;
        if (c && c.id) {
          setApiClinic(c);
          setInitialSocial({
            isFollowing: !!c.is_followed,
            isFavorited: !!c.is_favorited,
            followerCount: c.followers_count || 0,
          });
        }
      }).catch(() => {});
    }
  }, [clinicParam]);

  // Social hook (follow / favorite)
  const clinicMeta = {
    name: apiClinic?.fullname || apiClinic?.name || '',
    codename: apiClinic?.codename || clinicParam || '',
    avatar: apiClinic?.avatar || '',
    address: apiClinic?.address || '',
    rating: resolveClinicRating(apiClinic, 0),
    reviewCount: resolveClinicReviewCount(apiClinic, 0),
    specialty: apiClinic?.specialty || '',
  };
  const socialCallbacks = {
    onFavoriteChange: (favorited) => {
      notify({
        type: 'success',
        message: favorited
          ? t('clinicDetail.addedToFavorites', 'Added to favorites')
          : t('clinicDetail.removedFromFavorites', 'Removed from favorites'),
      });
    },
  };
  const { isFollowing, isFavorited, followerCount, followLoading, toggleFollow, toggleFavorite } = useSocial('clinic', apiClinic?.id, initialSocial, clinicMeta, socialCallbacks);

  // UI State
  const [activeTab, setActiveTab] = useState('genel-bakis');
  
  // Prices Tab State
  const [selectedService, setSelectedService] = useState(null);
  
  // Doctors (from API)
  
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
            doctors={apiClinic?.doctors || []}
          />
        );
      case 'degerlendirmeler':
        return <ReviewsTab clinicId={apiClinic?.id} guardAction={guardAction} />;
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
        return <LocationTab 
          locationAddress={apiClinic?.address || "Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul"} 
          latitude={apiClinic?.latitude}
          longitude={apiClinic?.longitude}
        />;
      case 'medstream':
        return <MedstreamProfileFeed clinicId={apiClinic?.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`${clinicMeta.name} — ${clinicMeta.specialty || t('clinicDetail.clinic', 'Clinic')}`}
        description={`${clinicMeta.name} — ${clinicMeta.address || ''}. ${clinicMeta.specialty || ''} ${t('clinicDetail.tab_degerlendirmeler', 'Reviews')}: ${clinicMeta.rating}★ (${clinicMeta.reviewCount})`}
        canonical={`/clinic/${clinicParam}`}
        image={apiClinic?.avatar}
        jsonLd={buildMedicalBusinessSchema({
          name: clinicMeta.name,
          image: apiClinic?.avatar,
          description: clinicMeta.specialty,
          address: clinicMeta.address,
          rating: clinicMeta.rating,
          reviewCount: clinicMeta.reviewCount,
          url: `https://medagama.com/clinic/${clinicParam}`,
        })}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <ClinicHero
              image={apiClinic?.avatar || '/images/petr-magera-huwm7malj18-unsplash_720.jpg'}
              name={apiClinic?.fullname || apiClinic?.name || ''}
              location={apiClinic?.address || ''}
              rating={resolveClinicRating(apiClinic, 0)}
              reviews={resolveClinicReviewCount(apiClinic, 0)}
              badgeNode={null}
              isFavorite={isFavorited}
              onToggleFavorite={guardAction(toggleFavorite)}
              isFollowing={isFollowing}
              followLoading={followLoading}
              onToggleFollow={guardAction(toggleFollow)}
              onFollow={() => {}}
            />

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <Tabs tabs={tabsConfig.map(tab => ({ ...tab, label: t(`clinicDetail.tab_${tab.id}`, tab.label) }))} active={activeTab} onChange={setActiveTab} />
              <div className="px-5 sm:px-6 py-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:top-24 h-max">
            <ContactActions onTelehealth={guardAction(() => setOnlineBookModal(true))} onBook={guardAction(() => setBookModal(true))} onMessage={guardAction(() => setMessageModal(true))} />
            <PriceRangeList items={priceRangesData} />
          </div>
        </div>
      </div>
      {/* Modals */}
      <BookAppointmentModal
        open={bookModal}
        onClose={() => setBookModal(false)}
        targetId={apiClinic?.id}
        targetName={apiClinic?.fullname || apiClinic?.name || ''}
        targetType="clinic"
      />
      <BookAppointmentModal
        open={onlineBookModal}
        onClose={() => setOnlineBookModal(false)}
        targetId={apiClinic?.id}
        targetName={apiClinic?.fullname || apiClinic?.name || ''}
        targetType="clinic"
        initialType="video"
      />
      <SendMessageModal
        open={messageModal}
        onClose={() => setMessageModal(false)}
        targetId={apiClinic?.id}
        targetName={apiClinic?.fullname || apiClinic?.name || ''}
        targetType="clinic"
      />
    </div>
  );
};

export default ClinicDetailPage;
