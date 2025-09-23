import React from 'react';
import { Link, Navigate } from 'react-router-dom';
// Carousel removed for custom two-row scroller
import { useAuth } from '../context/AuthContext';
import { TimelineFeed } from '../components/timeline';
import { Header } from '../components/layout';
import PostComposer from '../components/PostComposer';

export default function PatientHome() {
  const { user } = useAuth();

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
                  <div className="h-[80vh] overflow-y-auto pr-2 pt-2" style={{ backgroundColor: '#f4f2ee' }}>
                    {/* Composer tam kartların üstünde ve kart genişliğinde */}
                    <div className="mb-4 max-w-2xl mx-auto">
                      <PostComposer />
                    </div>
                    <TimelineFeed />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      {/* Footer is rendered globally in App.js */}
    </div>
  );
}
