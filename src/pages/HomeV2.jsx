import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Sparkles } from 'lucide-react';
import CoreBoxes from '../components/CoreBoxes';
import PopularClinicsShowcase from '../components/PopularClinicsShowcase';
import TimelinePreview from '../components/TimelinePreview';
import { clinicAPI } from '../lib/api';
import { resolveClinicRating, resolveClinicReviewCount } from '../utils/clinicMetrics';

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
  const [heroQ, setHeroQ] = useState('');

  useEffect(() => {
    clinicAPI.list({ per_page: 20 }).then((res) => {
      const list = res?.data || [];
      if (list.length) {
        setClinics(list.map((c, i) => ({
          id: c.id,
          name: c.fullname || c.name,
          city: c.address || '',
          dept: '',
          rating: resolveClinicRating(c),
          reviews: resolveClinicReviewCount(c),
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
      {/* Hero / Slogan */}
      <section className="relative overflow-hidden">
        <div className="relative overflow-hidden">
          {/* Background layer */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-[0.5px] md:blur-[1px] brightness-95 md:brightness-100"
            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/default/default-page.jpg)` }}
            aria-hidden="true"
          />
          {/* Dark overlay */}
          <div
            className="pointer-events-none absolute inset-0 bg-black/30 md:bg-black/35"
            aria-hidden="true"
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md antialiased">
                {t('home.heroTitle')}
              </h1>
              <p className="mt-4 text-white/90 md:text-lg font-medium drop-shadow-sm antialiased">
                {t('home.heroSubtitle')}
              </p>

              {/* Minimal search input + CTA */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(heroQ.trim() ? `/search?q=${encodeURIComponent(heroQ.trim())}` : '/search');
                }}
                className="mt-8"
              >
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      value={heroQ}
                      onChange={(e) => setHeroQ(e.target.value)}
                      placeholder={t('home.searchPlaceholder', 'Search by specialty, doctor name...')}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm bg-white/95 backdrop-blur-sm border-0 shadow-xl focus:ring-4 focus:ring-teal-500/20 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-3.5 rounded-xl hover:bg-teal-700 hover:shadow-2xl text-sm font-bold transition-all shadow-xl whitespace-nowrap"
                  >
                    <Search className="w-4 h-4" />
                    {t('search.heroTitle')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Services anchor */}
      <section id="discover-services" className="pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">{t('home.discoverServices', 'Discover Our World-First Services')}</h2>
          </div>
        </div>
      </section>

      {/* Core Boxes (6 items) */}
      <CoreBoxes />

      {/* Medstream timeline preview between CoreBoxes and Popular Treatments */}
      <TimelinePreview limit={8} onViewAll={() => navigate('/explore')} />


      {/* Popular Clinics reusable showcase */}
      <PopularClinicsShowcase
        items={clinics}
        title={t('home.popularTreatments')}
        midTitle={t('home.popularClinics')}
        onCardClick={(c) => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate(c.codename ? `/clinic/${c.codename}` : '/clinic'); }}
        onViewClick={(c) => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate(c.codename ? `/clinic/${c.codename}` : '/clinic'); }}
      />

      {/* Footer is rendered globally in App.js */}
    </div>
  );
}
