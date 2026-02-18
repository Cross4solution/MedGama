import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchSections } from '../components/search';
import CoreBoxes from '../components/CoreBoxes';
import PopularClinicsShowcase from '../components/PopularClinicsShowcase';
import TimelinePreview from '../components/TimelinePreview';
import { clinicAPI } from '../lib/api';

// Fallback mock data — used when API is unavailable
const FALLBACK_CLINICS = [
  { id: 1, name: 'Memorial Hospital', city: 'Ankara', dept: 'Plastic Surgery, Aesthetics', rating: 4.9, reviews: 186, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
  { id: 2, name: 'Ege University Hospital', city: 'Izmir', dept: 'Neurology, Orthopedics', rating: 4.7, reviews: 428, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
  { id: 3, name: 'Acibadem Hospital', city: 'Istanbul', dept: 'General Surgery, OB/GYN', rating: 4.6, reviews: 295, image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg' },
  { id: 4, name: 'Anadolu Health Center', city: 'Kocaeli', dept: 'Cardiac Surgery, Oncology', rating: 4.8, reviews: 342, image: '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg' },
  { id: 5, name: 'SmileCare Clinic', city: 'Izmir', dept: 'Dentistry', rating: 4.8, reviews: 189, image: '/images/default/default-avatar.svg' },
  { id: 6, name: 'Vision Center', city: 'Ankara', dept: 'Ophthalmology', rating: 4.6, reviews: 221, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
  { id: 7, name: 'AestheticPlus', city: 'Istanbul', dept: 'Plastic Surgery', rating: 4.7, reviews: 264, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
  { id: 8, name: 'MedPark Clinic', city: 'Antalya', dept: 'Dermatology, Aesthetics', rating: 4.6, reviews: 198, image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg' },
];
const FALLBACK_20 = Array.from({ length: 20 }, (_, i) => ({ ...FALLBACK_CLINICS[i % FALLBACK_CLINICS.length], id: i + 1 }));

export default function HomeV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clinics, setClinics] = useState(FALLBACK_20);

  useEffect(() => {
    clinicAPI.list({ per_page: 20 }).then((res) => {
      const list = res?.data || [];
      if (list.length) {
        setClinics(list.map((c, i) => ({
          id: c.id,
          name: c.fullname || c.name,
          city: c.address || '',
          dept: '',
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(Math.random() * 300) + 50,
          image: c.avatar || FALLBACK_CLINICS[i % FALLBACK_CLINICS.length]?.image,
          codename: c.codename,
        })));
      }
    }).catch(() => {});
  }, []);

  // Popular vitrini artık reusable component ile render ediliyor

  // Eski çoklu arama kaldırıldı; GlobalSearch ve CustomSearch kullanılacak

  // Logged-in users can also view the landing page (removed auto-redirect)

  return (
    <div className="min-h-screen bg-white">
      {false ? (
        <></>
      ) : (
        <>
      {/* Hero / Slogan */}
      <section className="relative overflow-hidden">
          <div className="relative overflow-hidden">
            {/* Background layer with a lighter blur (reduced for clarity) */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-[0.5px] md:blur-[1px] brightness-95 md:brightness-100"
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/default/default-page.jpg)` }}
              aria-hidden="true"
            />
            {/* Subtle dark overlay on top of the background image */}
            <div
              className="pointer-events-none absolute inset-0 bg-black/25 md:bg-black/30"
              aria-hidden="true"
            />
            {/* Removed white bottom gradient as requested */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 gap-8 items-center">
                <div>
                  <h1
                    className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md antialiased"
                  >
                    {t('home.heroTitle')}
                  </h1>
                  <p
                    className="mt-4 text-white md:text-lg font-medium drop-shadow-sm antialiased"
                  >
                    {t('home.heroSubtitle')}
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => document.getElementById('discover-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-teal-700 px-5 py-2.5 rounded-full hover:bg-white hover:shadow-lg text-sm font-semibold transition-all shadow-md"
                    >
                      {t('home.explore')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </section>

      {/* Unified Search sections via component */}
      <SearchSections />

      {/* Core Boxes (6 items) */}
      <CoreBoxes />

      {/* Medstream timeline preview between CoreBoxes and Popular Treatments */}
      <TimelinePreview limit={8} onViewAll={() => navigate('/explore')} />


      {/* Popular Clinics reusable showcase */}
      <PopularClinicsShowcase
        items={clinics}
        onCardClick={(c) => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate(c.codename ? `/clinic/${c.codename}` : '/clinic'); }}
        onViewClick={(c) => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate(c.codename ? `/clinic/${c.codename}` : '/clinic'); }}
      />

      {/* Footer is rendered globally in App.js */}
      </>
      )}
    </div>
  );
}
