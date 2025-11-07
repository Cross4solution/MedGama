import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// Star icon no longer needed here; used inside the reusable component
import { SearchSections } from '../components/search';
import CoreBoxes from '../components/CoreBoxes';
import PopularClinicsShowcase from '../components/PopularClinicsShowcase';

export default function HomeV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const handleViewAll = () => navigate('/explore');

  // Login dropdown state + outside click close
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // removed unused departments

  // Özellik kutuları ayrı bir bileşen üzerinden yönetiliyor (CoreBoxes)

  const popularClinics = [
    { id: 1, name: 'Memorial Hospital', city: 'Ankara', dept: 'Plastic Surgery, Aesthetics', rating: 4.9, reviews: 186, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
    { id: 2, name: 'Ege University Hospital', city: 'Izmir', dept: 'Neurology, Orthopedics', rating: 4.7, reviews: 428, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
    { id: 3, name: 'Acibadem Hospital', city: 'Istanbul', dept: 'General Surgery, OB/GYN', rating: 4.6, reviews: 295, image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg' },
    { id: 4, name: 'Anadolu Health Center', city: 'Kocaeli', dept: 'Cardiac Surgery, Oncology', rating: 4.8, reviews: 342, image: '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg' },
    { id: 5, name: 'SmileCare Clinic', city: 'Izmir', dept: 'Dentistry', rating: 4.8, reviews: 189, image: '/images/portrait-candid-male-doctor_720.jpg' },
    { id: 6, name: 'Vision Center', city: 'Ankara', dept: 'Ophthalmology', rating: 4.6, reviews: 221, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
    { id: 7, name: 'AestheticPlus', city: 'Istanbul', dept: 'Plastic Surgery', rating: 4.7, reviews: 264, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
    { id: 8, name: 'MedPark Clinic', city: 'Antalya', dept: 'Dermatology, Aesthetics', rating: 4.6, reviews: 198, image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg' },
  ];

  // Test için listeyi ~20 elemana genişlet (temel listeyi döndürerek)
  const popularClinics20 = (() => {
    const base = popularClinics;
    const out = [];
    const target = 20;
    for (let i = 0; i < target; i++) {
      const b = base[i % base.length];
      out.push({ ...b, id: i + 1 });
    }
    return out;
  })();

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
          <div className="relative">
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
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 gap-8 items-center">
                <div>
                  <h1
                    className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md antialiased"
                    style={{
                      WebkitTextStroke: '0',
                      fontVariantLigatures: 'none',
                      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
                    }}
                  >
                    #1 Health Portal in the World
                  </h1>
                  <p
                    className="mt-4 text-white md:text-lg font-medium drop-shadow-sm antialiased"
                    style={{
                      WebkitTextStroke: '0',
                      fontVariantLigatures: 'none',
                      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
                    }}
                  >
                    One-click, end-to-end care: discovery, availability, telehealth, health tourism and secure communication.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <a href="#features" className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm shadow-lg">Explore</a>
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


      {/* Popular Clinics reusable showcase */}
      <PopularClinicsShowcase
        items={popularClinics20}
        onCardClick={(c) => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate('/clinic'); }}
        onViewClick={(c) => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate('/clinic'); }}
      />

      {/* Footer is rendered globally in App.js */}
      </>
      )}
    </div>
  );
}
