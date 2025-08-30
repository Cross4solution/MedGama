import React from 'react';

const CookieInfoPopup = ({ setShowCookieInfoPopup }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowCookieInfoPopup(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Cookie Policy</h2>
          <button
            onClick={() => setShowCookieInfoPopup(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-gray-700 space-y-4">
          <p><strong>What Are Cookies?</strong></p>
          <p>Cookies are small text files sent to your browser when you visit our website. They are used to improve your experience and enhance site performance.</p>
          
          <p><strong>Which Cookies Do We Use?</strong></p>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-800">Necessary Cookies</p>
              <p>Required for the site's core functions. Used for security, session management, and essential features.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Analytics Cookies</p>
              <p>Used to analyze site traffic and user behavior. This information helps us improve site performance.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Functional Cookies</p>
              <p>Used to remember your preferences and provide personalized content.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Marketing Cookies</p>
              <p>Used to show relevant ads and measure the effectiveness of marketing campaigns.</p>
            </div>
          </div>
          
          <p><strong>Cookie Management</strong></p>
          <p>You can manage, delete or disable cookies via your browser settings. Note that disabling some cookies may affect site functionality.</p>
          
          <p><strong>Third-Party Cookies</strong></p>
          <p>Third-party services like Google Analytics and Facebook Pixel may also use cookies. We recommend reviewing their privacy policies.</p>
          
          <p><strong>Updates</strong></p>
          <p>This cookie policy may be updated from time to time. We will inform you in case of significant changes.</p>
          
          <p><strong>Contact</strong></p>
          <p>For questions about our cookie policy: you can contact us at <span className="text-blue-600">privacy@meditravel.com</span>.</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowCookieInfoPopup(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieInfoPopup; 