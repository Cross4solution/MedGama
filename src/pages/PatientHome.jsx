import React from 'react';
import { Link, Navigate } from 'react-router-dom';
// Carousel removed for custom two-row scroller
import { useAuth } from '../context/AuthContext';
import { TimelineFeed } from '../components/timeline';
import { Header } from '../components/layout';
import { SearchSections } from '../components/search';
import PostComposer from '../components/PostComposer';
import PopularClinicsShowcase from '../components/PopularClinicsShowcase';

export default function PatientHome() {
  const { user } = useAuth();
  const popularClinics = [
    { id: 1, name: 'Memorial Hospital', city: 'Ankara', dept: 'Plastic Surgery, Aesthetics', rating: 4.9, reviews: 295, minPriceUSD: 2900, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
    { id: 2, name: 'Ege University Hospital', city: 'Izmir', dept: 'Neurology, Orthopedics', rating: 4.7, reviews: 428, minPriceUSD: 1800, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
    { id: 3, name: 'Acibadem Hospital', city: 'Istanbul', dept: 'General Surgery, OB/GYN', rating: 4.6, reviews: 312, minPriceUSD: 2500, image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg' },
    { id: 4, name: 'Anadolu Health Center', city: 'Kocaeli', dept: 'Cardiac Surgery, Oncology', rating: 4.8, reviews: 342, minPriceUSD: 2000, image: '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg' },
    { id: 5, name: 'SmileCare Clinic', city: 'Izmir', dept: 'Dentistry', rating: 4.8, reviews: 189, minPriceUSD: 1500, image: '/images/portrait-candid-male-doctor_720.jpg' },
    { id: 6, name: 'Vision Center', city: 'Ankara', dept: 'Ophthalmology', rating: 4.6, reviews: 221, minPriceUSD: 2200, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
    { id: 7, name: 'AestheticPlus', city: 'Istanbul', dept: 'Plastic Surgery', rating: 4.7, reviews: 264, minPriceUSD: 2800, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
    { id: 8, name: 'MedPark Clinic', city: 'Antalya', dept: 'Dermatology, Aesthetics', rating: 4.6, reviews: 198, minPriceUSD: 1700, image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg' },
  ];

  // Hooks yok; artık güvenle erken dönebiliriz
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />
      <div className="lg:ml-[var(--sidebar-width)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            {/* Toolbar directly under header - left aligned */}
            <div className="bg-white border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center gap-3 text-sm justify-end">
                <Link to="/explore" aria-label="Open explore" className="inline-flex items-center">
                  <img src="/images/timelinebutton.png" alt="Timeline" className="w-6 h-6 opacity-80 hover:opacity-100 transition" />
                </Link>
              </div>
            </div>

            {/* Timeline preview section with taller height */}
            <section id="timeline" className="py-2">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="bg-white p-0 rounded-none border-0 shadow-none">
                  {/* taller height, inner scrollable area */}
                  <div className="h-[80vh] overflow-y-auto pr-2">
                    {/* Composer tam kartların üstünde ve kart genişliğinde */}
                    <div className="mb-4 max-w-2xl mx-auto">
                      <PostComposer />
                    </div>
                    <TimelineFeed />
                  </div>
                </div>
              </div>
            </section>



            {/* Unified Search sections (same as HomeV2) */}
            <SearchSections />

            {/* Popular Clinics reusable showcase */}
            <PopularClinicsShowcase
              items={popularClinics}
              onCardClick={() => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} window.location.assign('/clinic'); }}
              onViewClick={() => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} window.location.assign('/clinic'); }}
            />
          </div>
        </div>
      </div>
      {/* Footer is rendered globally in App.js */}
    </div>
  );
}
