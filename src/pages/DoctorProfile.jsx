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
  const [doctorFollowers] = useState(1280);
  const [medstreamUrl, setMedstreamUrl] = useState('https://medstream.com/dr-ayse-yilmaz');
  const [isEditingMedstream, setIsEditingMedstream] = useState(false);
  const [tempMedstreamUrl, setTempMedstreamUrl] = useState('https://medstream.com/dr-ayse-yilmaz');

  const [aboutTitle] = useState('Hakkımda');
  const [aboutP1] = useState("1998 yılında İstanbul Üniversitesi Tıp Fakültesi'nden mezun oldum ve kardiyoloji alanında uzmanlık eğitimimi tamamladım.\n15 yılı aşkın süredir kardiyoloji alanında hizmet veriyorum.");
  const [aboutP2] = useState('Hastalarıma en güncel tedavi yöntemlerini sunmak ve onların yaşam kalitesini artırmak önceliğimdir.\nUluslararası kongrelerde sunumlar yaptım ve çok sayıda bilimsel yayına imza attım.');

  const [services] = useState([
    {
      id: 'coronary-angiography',
      name: 'Coronary Angiography',
      icon: Heart,
      description: 'Imaging and treatment of coronary arteries',
      prices: [
        { procedure: 'Coronary angiography (diagnostic)', range: '₺8,000 - ₺15,000' },
        { procedure: 'Angiography + stent (single vessel)', range: '₺20,000 - ₺35,000' },
      ],
    },
    {
      id: 'echocardiography',
      name: 'Echocardiography',
      icon: Activity,
      description: 'Heart ultrasound imaging',
      prices: [
        { procedure: 'Transthoracic echocardiography', range: '₺1,500 - ₺3,000' },
        { procedure: 'Transesophageal echocardiography', range: '₺4,000 - ₺7,000' },
      ],
    },
    {
      id: 'rhythm-disorders',
      name: 'Rhythm Disorders',
      icon: Activity,
      description: 'Diagnosis and treatment of cardiac arrhythmias',
      prices: [
        { procedure: 'Holter ECG (24–72 hours)', range: '₺2,000 - ₺4,000' },
        { procedure: 'Radiofrequency ablation', range: '₺30,000 - ₺55,000' },
      ],
    },
    {
      id: 'heart-failure',
      name: 'Heart Failure',
      icon: Heart,
      description: 'Management of chronic heart failure and cardiac diseases',
      prices: [
        { procedure: 'Heart failure assessment package', range: '₺3,500 - ₺6,000' },
        { procedure: 'Follow-up visit (examination + ECG)', range: '₺1,000 - ₺1,800' },
      ],
    },
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
              medstreamUrl={medstreamUrl}
              onEditMedstream={() => {
                setTempMedstreamUrl(medstreamUrl || '');
                setIsEditingMedstream(true);
              }}
              followerCount={doctorFollowers}
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
      {isEditingMedstream && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Edit MedStream profile URL</h2>
            <p className="text-xs text-gray-500 mb-3">
              This URL will be shown on your public doctor profile.
            </p>
            <input
              type="text"
              value={tempMedstreamUrl}
              onChange={(e) => setTempMedstreamUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-4"
              placeholder="https://medstream.com/your-profile"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsEditingMedstream(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setMedstreamUrl(tempMedstreamUrl.trim());
                  setIsEditingMedstream(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfilePage;