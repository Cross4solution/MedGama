import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Header } from '../components/layout';
import TimelinePreview from '../components/TimelinePreview';
import { SearchSections } from '../components/search';
import CoreBoxes from '../components/CoreBoxes';

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

  // Popular vitrini için yatay scroll kontrolü ve kolonlara bölme
  const scrollRef = useRef(null);
  const popularColumns = React.useMemo(() => {
    const arr = popularClinics.slice(0, 8); // 4 kolon x 2 kart = 8 kart
    const cols = [];
    for (let i = 0; i < arr.length; i += 2) cols.push(arr.slice(i, i + 2));
    return cols;
  }, [popularClinics]);
  const scrollByAmount = (dir = 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth; // görünürdeki alan kadar kaydır
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  // Eski çoklu arama kaldırıldı; GlobalSearch ve CustomSearch kullanılacak

  // Logged-in users can also view the landing page (removed auto-redirect)

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />

      {false ? (
        <></>
      ) : (
        <>
      {/* If patient logged in, show TimelinePreview instead of hero */}
      {user && user.role === 'patient' ? (
        <section className="bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TimelinePreview columns={3} onViewAll={handleViewAll} />
          </div>
        </section>
      ) : (
        // Hero / Slogan for guests and non-patient roles
        <section className="relative overflow-hidden">
          <div className="relative">
            {/* Background layer with a lighter blur (reduced for clarity) */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-[0.5px] md:blur-[1px] brightness-90 md:brightness-95"
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/default/default-page.jpg)` }}
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
      )}

      {/* Unified Search sections via component */}
      <SearchSections />

      {/* Core Boxes (6 items) */}
      <CoreBoxes />

      {/* Timeline Önizleme: only for guests/non-patient to avoid duplicate */}
      {(!user || user.role !== 'patient') && <TimelinePreview columns={3} onViewAll={handleViewAll} />}

      {/* Popular Clinics: tek başlık altında iki satırlı vitrin + yatay scroll */}
      <section id="popular" className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Popular Clinics</h2>
            <a href="#" className="text-sm text-teal-700 hover:underline">View All</a>
          </div>
          <div className="relative">
            {/* Left Arrow */}
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollByAmount(-1)}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white"
            >
              <span className="sr-only">Prev</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            {/* Right Arrow */}
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollByAmount(1)}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-gray-200 hover:bg-white"
            >
              <span className="sr-only">Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>

            {/* Scrollable row of columns (each column has 2 stacked cards) */}
            <div
              ref={scrollRef}
              className="overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="flex gap-4 pr-2 md:px-8">
                {popularColumns.map((col, i) => (
                  <div key={i} className="min-w-[85%] sm:min-w-[60%] lg:min-w-[33%] snap-start">
                    <div className="flex flex-col gap-4">
                      {col.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-2xl border bg-white p-4 hover:shadow-md transition h-80 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
                          onClick={() => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate('/clinic'); }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate('/clinic'); } }}
                        >
                          <div className="h-40 rounded-lg bg-gray-100 mb-3 overflow-hidden">
                            <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">{c.name}</h3>
                              <div className="flex items-center text-amber-600">
                                <Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" />
                                <span className="font-medium text-gray-900">{c.rating}</span>
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{c.city} • {c.dept}</p>
                            <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                              <span className="text-gray-500">{c.reviews} Reviews</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {} navigate('/clinic'); }}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is rendered globally in App.js */}
      </>
      )}
    </div>
  );
}
