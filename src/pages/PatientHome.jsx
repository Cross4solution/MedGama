import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import Carousel from '../components/Carousel';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import TimelineFeed from '../components/TimelineFeed';
import Header from '../components/Header';
import TimelinePreview from '../components/TimelinePreview';
import CoreBoxes from '../components/CoreBoxes';
import SearchSections from '../components/SearchSections';

export default function PatientHome() {
  const { user, formatCurrency } = useAuth();
  const popularClinics = [
    { id: 1, name: 'Memorial Hospital', city: 'Ankara', dept: 'Plastic Surgery, Aesthetics', rating: 4.9, reviews: 295, minPriceUSD: 2900, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
    { id: 2, name: 'Ege University Hospital', city: 'Izmir', dept: 'Neurology, Orthopedics', rating: 4.7, reviews: 428, minPriceUSD: 1800, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
    { id: 3, name: 'Acibadem Hospital', city: 'Istanbul', dept: 'General Surgery, OB/GYN', rating: 4.6, reviews: 312, minPriceUSD: 2500, image: '/images/caroline-lm-uqved8dypum-unsplash_720.jpg' },
    { id: 4, name: 'Anadolu Health Center', city: 'Kocaeli', dept: 'Cardiac Surgery, Oncology', rating: 4.8, reviews: 342, minPriceUSD: 2000, image: '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg' },
    { id: 5, name: 'SmileCare Clinic', city: 'Izmir', dept: 'Dentistry', rating: 4.8, reviews: 189, minPriceUSD: 1500, image: '/images/portrait-candid-male-doctor_720.jpg' },
    { id: 6, name: 'Vision Center', city: 'Ankara', dept: 'Ophthalmology', rating: 4.6, reviews: 221, minPriceUSD: 2200, image: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
    { id: 7, name: 'AestheticPlus', city: 'Istanbul', dept: 'Plastic Surgery', rating: 4.7, reviews: 264, minPriceUSD: 2800, image: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />
      <div className="lg:ml-[var(--sidebar-width)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            {/* Toolbar directly under header - left aligned */}
            <div className="bg-white border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-3 text-sm">
                <Link to="/timeline" className="px-3 py-1.5 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">Timeline</Link>
                <a href="#timeline" className="px-3 py-1.5 rounded border border-gray-200 text-gray-700 hover:bg-gray-50">Preview</a>
              </div>
            </div>

            {/* Timeline preview section with its own vertical scroll */}
            <section id="timeline" className="py-6 bg-gray-50 border-b">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="rounded-xl border bg-white p-4">
                  {/* fixed height, inner scrollable area */}
                  <div className="h-96 overflow-y-auto pr-2">
                    <TimelineFeed />
                  </div>
                </div>
              </div>
            </section>

            {/* Professional Timeline Cards Preview */}
            <TimelinePreview columns={3} />

            {/* Core Boxes (patient quick access) */}
            <section className="py-8 border-b">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <CoreBoxes />
              </div>
            </section>

            {/* Unified Search sections (same as HomeV2) */}
            <SearchSections />

            {/* Popular Clinics - Carousel */}
            <section className="py-10">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Clinics</h2>
                <Carousel
                  items={popularClinics}
                  slidesToShow={{ base: 1, sm: 2, lg: 3 }}
                  renderItem={(c) => (
                    <div className="rounded-2xl border bg-white p-4 hover:shadow-md transition h-96 flex flex-col">
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
                        {c.minPriceUSD && (
                          <div className="mt-2 text-sm text-teal-700 font-medium">from {formatCurrency(c.minPriceUSD)}</div>
                        )}
                        <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-500">{c.reviews} Reviews</span>
                          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Profile</button>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
