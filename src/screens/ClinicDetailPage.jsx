'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from '@/compat/router';
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
// SEO meta + MedicalClinic JSON-LD artık app/clinic/[id]/page.jsx generateMetadata + server script ile üretiliyor (Faz 3).
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

// Sekme listesi dışında hiçbir şey buradan GELMEMELİ.
//
// Bu sayfa uydurma içerik yayınlıyordu ve klinik kimliği gerçek olduğu için
// hepsi o kliniğin beyanı gibi okunuyordu. Ölçüldü — "Beyaz Diş Ağız ve Diş
// Sağlığı" adlı bir DİŞ kliniğinin sayfasında yan sütunda şunlar duruyordu:
//
//     Kalp Cerrahisi     ₺50K - ₺150K
//     Onkoloji Tedavi    ₺30K - ₺200K
//
// Aynı kaynak "Öncesi/Sonrası" sekmesine burun estetiği ve saç ekimi sonuçları,
// fiyat sekmesine "Coronary Artery Bypass $15,000 - $25,000" koyuyordu; adres
// alanı boşsa sabit bir İstanbul adresine düşüyordu.
//
// API bu alanları zaten taşıyor (`services`, `price_ranges`, `gallery`); bu
// klinikte `null` oldukları için yedek devreye giriyordu. Doğru davranış boş
// bırakmak: sağlık hizmeti ve fiyatı, sunmayan bir kliniğin adıyla yan yana
// yazılamaz.
import { tabsConfig } from '../data/clinicMockData';
import resolveStorageUrl from '../utils/resolveStorageUrl';

const ClinicDetailPage = ({ initialClinic }) => {
  const { user } = useAuth();
  const { notify } = useToast();
  const { guardAction } = useAuthGuard();
  const { t } = useTranslation();
  const { id: clinicParam } = useParams();
  // SSR initial data (from app/clinic/[id]/page.jsx server fetch) → clinic object
  const [apiClinic, setApiClinic] = useState(initialClinic || null);
  const [initialSocial, setInitialSocial] = useState(
    initialClinic
      ? {
          isFollowing: !!initialClinic.is_followed,
          isFavorited: !!initialClinic.is_favorited,
          followerCount: initialClinic.followers_count || 0,
        }
      : {}
  );

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

  /**
   * Verisi olmayan sekme gösterilmiyor.
   *
   * Bu sekmeler eskiden hep doluydu, çünkü içerikleri uydurmaydı. Gerçek veriye
   * bağlanınca boş kalacaklardı — bir kliniğin sayfasında boş bir "Öncesi/
   * Sonrası" sekmesi, o kliniğin sonuç paylaşmadığını değil, sayfanın bozuk
   * olduğunu düşündürür.
   */
  const gorunurSekmeler = tabsConfig.filter((tab) => {
    if (tab.id === 'prices') {
      return (Array.isArray(apiClinic?.services) && apiClinic.services.length > 0)
        || (Array.isArray(apiClinic?.price_ranges) && apiClinic.price_ranges.length > 0);
    }
    if (tab.id === 'galeri') return Array.isArray(apiClinic?.gallery) && apiClinic.gallery.length > 0;
    if (tab.id === 'before-after') return Array.isArray(apiClinic?.before_after) && apiClinic.before_after.length > 0;
    if (tab.id === 'doktorlar') return Array.isArray(apiClinic?.doctors) && apiClinic.doctors.length > 0;
    return true;
  });

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'genel-bakis':
        return (
          <OverviewTab
            aboutTitle={apiClinic?.fullname || apiClinic?.name || ''}
            aboutP1={apiClinic?.biography || ''}
            aboutP2={''}
            doctors={apiClinic?.doctors || []}
            accreditations={apiClinic?.accreditations || []}
            certifications={apiClinic?.certifications || []}
            onBookAppointment={() => setBookModal(true)}
            onSwitchToDoctors={() => setActiveTab('doktorlar')}
          />
        );
      case 'prices':
        return (
          <PricesTab
            services={Array.isArray(apiClinic?.services) ? apiClinic.services : []}
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
            gallery={(Array.isArray(apiClinic?.gallery) && apiClinic.gallery.length)
              ? apiClinic.gallery.map((g) => (typeof g === 'string' ? resolveStorageUrl(g, g) : resolveStorageUrl(g.url, g.url)))
              : []}
            galleryIndex={galleryIndex}
            setGalleryIndex={setGalleryIndex}
            galleryOpen={galleryOpen}
            setGalleryOpen={setGalleryOpen}
          />
        );
      case 'before-after':
        return (
          <BeforeAfterTab
            beforeAfterPhotos={Array.isArray(apiClinic?.before_after) ? apiClinic.before_after : []}
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
          // Sabit bir İstanbul adresine düşmek, hastayı yanlış yere gönderir.
          locationAddress={apiClinic?.address || ''}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <ClinicHero
              image={apiClinic?.avatar || apiClinic?.background_image || ''}
              name={apiClinic?.fullname || apiClinic?.name || ''}
              location={apiClinic?.address || ''}
              rating={resolveClinicRating(apiClinic, 0)}
              reviews={resolveClinicReviewCount(apiClinic, 0)}
              badgeNode={null}
              isFavorite={(user?.role !== 'doctor' && user?.role_id !== 'doctor') ? isFavorited : false}
              onToggleFavorite={(user?.role !== 'doctor' && user?.role_id !== 'doctor') ? guardAction(toggleFavorite) : undefined}
              isFollowing={isFollowing}
              followLoading={followLoading}
              onToggleFollow={guardAction(toggleFollow)}
              onFollow={() => {}}
            />

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <Tabs tabs={gorunurSekmeler.map(tab => ({ ...tab, label: t(`clinicDetail.tab_${tab.id}`, tab.label) }))} active={activeTab} onChange={setActiveTab} />
              <div className="px-5 sm:px-6 py-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:top-24 h-max">
            <ContactActions onTelehealth={guardAction(() => setOnlineBookModal(true))} onBook={guardAction(() => setBookModal(true))} onMessage={guardAction(() => setMessageModal(true))} />
            {Array.isArray(apiClinic?.price_ranges) && apiClinic.price_ranges.length > 0 && (
              <PriceRangeList items={apiClinic.price_ranges} />
            )}
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
        clinicDoctors={apiClinic?.doctors || []}
      />
      <BookAppointmentModal
        open={onlineBookModal}
        onClose={() => setOnlineBookModal(false)}
        targetId={apiClinic?.id}
        targetName={apiClinic?.fullname || apiClinic?.name || ''}
        targetType="clinic"
        clinicDoctors={apiClinic?.doctors || []}
        initialType="video"
      />
      <SendMessageModal
        open={messageModal}
        onClose={() => setMessageModal(false)}
        targetId={apiClinic?.id}
        targetName={apiClinic?.fullname || apiClinic?.name || ''}
        targetType="clinic"
        clinicDoctors={apiClinic?.doctors || []}
      />
    </div>
  );
};

export default ClinicDetailPage;
