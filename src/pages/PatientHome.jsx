import React, { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
// Carousel removed for custom two-row scroller
import { useAuth } from '../context/AuthContext';
import { TimelineFeed } from '../components/timeline';
import PostComposer from '../components/PostComposer';

export default function PatientHome() {
  const { user } = useAuth();
  const scrollRef = useRef(null);

  // Restore scroll position on mount, persist on scroll/unmount
  useEffect(() => {
    const key = 'patientHomeScroll';
    const lastKey = 'lastPostId';
    const el = scrollRef.current;
    if (el) {
      // Priority 1: scroll to last clicked post if any
      const lastId = sessionStorage.getItem(lastKey);
      const tryScrollToPost = () => {
        if (!lastId) return false;
        const node = el.querySelector(`#post-${CSS.escape(lastId)}`);
        if (node) {
          // Align the post roughly to center
          const top = node.offsetTop - el.clientHeight / 3;
          el.scrollTop = top > 0 ? top : 0;
          // Clear once used
          sessionStorage.removeItem(lastKey);
          return true;
        }
        return false;
      };

      // Attempt post-based restore first (with a couple retries for async render/images)
      let done = tryScrollToPost();
      if (!done) {
        requestAnimationFrame(() => {
          done = tryScrollToPost();
          if (!done) {
            setTimeout(() => { tryScrollToPost(); }, 120);
          }
        });
      }

      // Fallback: generic scrollTop restore
      const saved = Number(sessionStorage.getItem(key) || 0);
      if (!done && !isNaN(saved) && saved > 0) {
        requestAnimationFrame(() => {
          el.scrollTop = saved;
        });
      }
      const onScroll = () => {
        sessionStorage.setItem(key, String(el.scrollTop));
      };
      el.addEventListener('scroll', onScroll);
      return () => {
        el.removeEventListener('scroll', onScroll);
        sessionStorage.setItem(key, String(el.scrollTop || 0));
      };
    }
  }, []);

  // Hooks yok; artık güvenle erken dönebiliriz
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <div className="lg:ml-[var(--sidebar-width)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            {/* Toolbar directly under header - left aligned */}


            {/* Timeline preview section with taller height */}
            <section id="timeline" className="py-2">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden" style={{ backgroundColor: '#EEF7F6' }}>
                  {/* taller height, inner scrollable area */}
                  <div ref={scrollRef} className="h-[80vh] overflow-y-auto pr-2 pt-2">
                    {/* Composer (patients CANNOT post) */}
                    {user?.role !== 'patient' && (
                      <div className="mb-4 w-full sm:max-w-2xl mx-auto px-2 sm:px-0">
                        <PostComposer />
                      </div>
                    )}
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
