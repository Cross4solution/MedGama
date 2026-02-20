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
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cookie Policy</h2>
            <p className="text-xs text-gray-400 mt-0.5">GDPR & ePrivacy Directive Compliant</p>
          </div>
          <button
            onClick={() => setShowCookieInfoPopup(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-gray-700 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            Under the GDPR, you have the right to choose which cookies you allow. For full details, visit our <a href="/cookie-policy" className="font-semibold underline underline-offset-2">Cookie Policy page</a>.
          </div>

          <p><strong>What Are Cookies?</strong></p>
          <p>Cookies are small text files placed on your device when you visit our website. We also use Local Storage and Session Storage for similar purposes.</p>
          
          <p><strong>Cookie Categories</strong></p>
          <div className="space-y-3">
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="font-medium text-gray-800">Strictly Necessary <span className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full ml-1">Always Active</span></p>
              <p className="mt-1">Essential for the website to function. Includes authentication, session management, and security. Cannot be disabled (Art. 6(1)(f) GDPR — legitimate interest).</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="font-medium text-gray-800">Functional <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full ml-1">Consent Required</span></p>
              <p className="mt-1">Enable personalized features like preferences and language settings. Includes Google Sign-In functionality.</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="font-medium text-gray-800">Analytics & Performance <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full ml-1">Consent Required</span></p>
              <p className="mt-1">Help us understand how visitors use our website by collecting anonymous data. Used to improve our services.</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="font-medium text-gray-800">Marketing <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full ml-1">Consent Required</span></p>
              <p className="mt-1">Used to deliver relevant advertisements and measure campaign effectiveness. May be set by third-party partners.</p>
            </div>
          </div>
          
          <p><strong>Your Control</strong></p>
          <p>You can manage your cookie preferences at any time through our cookie banner settings, your profile settings, or your browser settings. You can also withdraw consent at any time.</p>
          
          <p><strong>Contact</strong></p>
          <p>For questions about our cookie policy: <span className="text-teal-600">privacy@medagama.com</span> or <span className="text-teal-600">dpo@medagama.com</span></p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <a href="/cookie-policy" className="text-xs text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
            Full Cookie Policy →
          </a>
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