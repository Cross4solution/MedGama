import React, { useState, useEffect } from 'react';
import CookieInfoPopup from './CookieInfoPopup';

const STORAGE_KEY = 'cookie_consent_status'; // 'accepted' | 'declined'

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showCookieInfoPopup, setShowCookieInfoPopup] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setShowBanner(true);
      }
    } catch (e) {
      // localStorage erişilemezse (örn. private mode), banner bir kez gösterilsin
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    if (showBanner) {
      // Add styles to hide scrollbar while keeping scroll functionality
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Store original styles
      const originalStyles = {
        bodyOverflow: document.body.style.overflow,
        bodyPaddingRight: document.body.style.paddingRight,
        htmlOverflow: document.documentElement.style.overflow
      };
      
      // Apply styles to hide scrollbar
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = 'hidden';
      
      // Create and append style tag for WebKit browsers (Chrome, Safari, etc.)
      const styleId = 'cookie-banner-scroll-style';
      let style = document.getElementById(styleId);
      
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          html {
            overflow: auto !important;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          html::-webkit-scrollbar {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalStyles.bodyOverflow;
        document.body.style.paddingRight = originalStyles.bodyPaddingRight;
        document.documentElement.style.overflow = originalStyles.htmlOverflow;
        
        // Remove style element
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [showBanner]);

  const persist = (value) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* ignore */ }
  };

  const handleAccept = () => {
    persist('accepted');
    setShowBanner(false);
  };

  const handleDeny = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-70 backdrop-blur-sm border-t border-gray-600 shadow-lg z-50 p-2 md:p-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm text-white leading-relaxed">
              We use cookies to enhance your experience on our website.
              <span 
                className="text-blue-300 hover:text-blue-200 cursor-pointer font-medium ml-1"
                onClick={() => setShowCookieInfoPopup(true)}
              >
                Learn more
              </span>
              . By continuing, you consent to the use of cookies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={handleDeny}
              className="px-4 py-1.5 border border-gray-400 text-white bg-transparent rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium text-sm shadow-sm"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 bg-[#1C6A83] text-white rounded-lg hover:brightness-95 transition-all duration-200 font-medium text-sm shadow-sm"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
      {showCookieInfoPopup && (
        <CookieInfoPopup setShowCookieInfoPopup={setShowCookieInfoPopup} />
      )}
    </>
  );
};

export default CookieBanner;