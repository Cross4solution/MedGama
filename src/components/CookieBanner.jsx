import React, { useState, useEffect } from 'react';
import CookieInfoPopup from './CookieInfoPopup';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showCookieInfoPopup, setShowCookieInfoPopup] = useState(false);

  useEffect(() => {
    // Show banner every time the site loads
    setShowBanner(true);
  }, []);

  const handleAccept = () => {
    setShowBanner(false);
  };

  const handleDeny = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 leading-relaxed">
              We use cookies to enhance your experience on our website.
              <span 
                className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium ml-1"
                onClick={() => setShowCookieInfoPopup(true)}
              >
                Learn more
              </span>
              . By continuing, you consent to the use of cookies.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleDeny}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-sm shadow-sm"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium text-sm shadow-sm"
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