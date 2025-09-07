import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import Header from '../components/Header';
import TimelinePreview from '../components/TimelinePreview';
import SearchSections from '../components/SearchSections';
import CoreBoxes from '../components/CoreBoxes';
import Carousel from '../components/Carousel';

export default function HomeV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const handleViewAll = () => setShowAllTimeline(true);

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
  ];

  // Eski çoklu arama kaldırıldı; GlobalSearch ve CustomSearch kullanılacak

  // Logged-in users can also view the landing page (removed auto-redirect)

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />

      {showAllTimeline ? (
        // Full-page timeline grid
        <section className="bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All timeline items</h2>
              <button
                type="button"
                onClick={() => setShowAllTimeline(false)}
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
              >
                Back
              </button>
            </div>
            <TimelinePreview columns={3} limit={20} />
          </div>
        </section>
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
        <section className="bg-gradient-to-br from-teal-50 to-sky-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 gap-8 items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                #1 Health Portal in the World 
                </h1>
                <p className="mt-4 text-gray-600 md:text-lg">One-click, end-to-end care: discovery, availability, telehealth and secure communication.</p>
                <div className="mt-6 flex gap-3">
                  <a href="#features" className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm">Explore</a>
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

      {/* Popular Clinics (carousel) */}
      <section id="popular" className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Popular Clinics</h2>
            <a href="#" className="text-sm text-teal-700 hover:underline">View All</a>
          </div>
          <Carousel
            items={popularClinics}
            slidesToShow={{ base: 1, sm: 2, lg: 3 }}
            renderItem={(c) => (
              <div
                className="rounded-2xl border bg-white p-4 hover:shadow-md transition h-96 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
                onClick={() => navigate('/clinic')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/clinic'); } }}
              >
                <div className="h-1/2 rounded-lg bg-gray-100 mb-3 overflow-hidden">
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
                    <button type="button" onClick={(e) => { e.stopPropagation(); navigate('/clinic'); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Profile</button>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </section>

      {/* Footer is rendered globally in App.js */}
      </>
      )}
    </div>
  );
}
