import React, { useState, useEffect } from 'react';
import { Activity, Heart } from 'lucide-react';
import Tabs from 'components/tabs/Tabs';
import DoctorHero from 'components/doctor/DoctorHero';
import DoctorOverviewSection from 'components/doctor/DoctorOverviewSection';
import DoctorServicesSection from 'components/doctor/DoctorServicesSection';
import DoctorReviewsSection from 'components/doctor/DoctorReviewsSection';
import DoctorGallerySection from 'components/doctor/DoctorGallerySection';
import DoctorBeforeAfterSection from 'components/doctor/DoctorBeforeAfterSection';
import DoctorPublicationsSection from 'components/doctor/DoctorPublicationsSection';
import DoctorLocationSection from 'components/doctor/DoctorLocationSection';
import DoctorSidebar from 'components/doctor/DoctorSidebar';
import DoctorGalleryModal from 'components/doctor/DoctorGalleryModal';

const DoctorProfilePage = () => {
  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFollowing, setIsFollowing] = useState(false);

  const [doctorName] = useState('Dr. Ayşe Yılmaz');
  const [doctorTitle] = useState('Kardiyoloji Uzmanı');
  const [doctorLocation] = useState('Istanbul, Turkey');
  const [heroImage] = useState('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800');

  const [aboutTitle] = useState('Hakkımda');
  const [aboutP1] = useState("1998 yılında İstanbul Üniversitesi Tıp Fakültesi'nden mezun oldum ve kardiyoloji alanında uzmanlık eğitimimi tamamladım.\n15 yılı aşkın süredir kardiyoloji alanında hizmet veriyorum.");
  const [aboutP2] = useState('Hastalarıma en güncel tedavi yöntemlerini sunmak ve onların yaşam kalitesini artırmak önceliğimdir.\nUluslararası kongrelerde sunumlar yaptım ve çok sayıda bilimsel yayına imza attım.');

  const [services] = useState([
    { name: 'Koroner Anjiyografi', icon: Heart, description: 'Kalp damarlarının görüntülenmesi ve tedavisi' },
    { name: 'Ekokardiyografi', icon: Activity, description: 'Kalp ultrason görüntüleme' },
    { name: 'Ritim Bozuklukları', icon: Activity, description: 'Aritmilerin tanı ve tedavisi' },
    { name: 'Kalp Yetmezliği', icon: Heart, description: 'Kronik kalp hastalıklarının yönetimi' },
  ]);

  const [certificates] = useState([
    '/images/certificates/doctor-cert-1.jpg',
    '/images/certificates/doctor-cert-2.jpg',
    '/images/certificates/doctor-cert-3.jpg',
  ]);

  const [publications] = useState([
    {
      id: 'pub-1',
      title: 'Outcomes of Cardiac Surgery in International Patients',
      journal: 'International Journal of Cardiology (2023)'
    },
    {
      id: 'pub-2',
      title: 'Advances in Oncology Treatments at Anadolu Health Center',
      journal: 'Oncology Today (2022)'
    }
  ]);

  // Tabs list (restored similar to ClinicDetailPage)
  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'degerlendirmeler', label: 'Reviews' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'before-after', label: 'Before & After' },
    { id: 'publications', label: 'Publications' },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Hero Section */}
            <DoctorHero
              doctorName={doctorName}
              doctorTitle={doctorTitle}
              doctorLocation={doctorLocation}
              heroImage={heroImage}
              isFollowing={isFollowing}
              onToggleFollow={() => setIsFollowing(!isFollowing)}
              onOpenGallery={() => {
                setGalleryIndex(0);
                setGalleryOpen(true);
              }}
            />

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
              <div className="px-6 pb-6">
                {/* Overview */}
                {activeTab === 'genel-bakis' && (
                  <DoctorOverviewSection
                    aboutP1={aboutP1}
                    aboutP2={aboutP2}
                    certificates={certificates}
                  />
                )}

                {/* Services */}
                {activeTab === 'hizmetler' && (
                  <DoctorServicesSection services={services} />
                )}

                {/* Reviews */}
                {activeTab === 'degerlendirmeler' && (
                  <DoctorReviewsSection reviews={reviews} />
                )}

                {/* Gallery */}
                {activeTab === 'galeri' && (
                  <DoctorGallerySection
                    gallery={gallery}
                    onImageClick={(idx) => {
                      setGalleryIndex(idx);
                      setGalleryOpen(true);
                    }}
                  />
                )}

                {/* Before & After */}
                {activeTab === 'before-after' && <DoctorBeforeAfterSection />}

                {/* Publications */}
                {activeTab === 'publications' && (
                  <DoctorPublicationsSection publications={publications} />
                )}

                {/* Location */}
                {activeTab === 'konum' && (
                  <DoctorLocationSection locationAddress={locationAddress} />
                )}
              </div>
            </div>

            {/* Global Gallery Modal */}
            <DoctorGalleryModal
              gallery={gallery}
              galleryIndex={galleryIndex}
              isOpen={galleryOpen}
              onClose={() => setGalleryOpen(false)}
              onPrev={() => setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length)}
              onNext={() => setGalleryIndex((i) => (i + 1) % gallery.length)}
            />
          </div>

          {/* Sidebar */}
          <DoctorSidebar />
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;