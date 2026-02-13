import React from 'react';

const TermsPopup = ({ setShowTermsPopup }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowTermsPopup(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Terms of Use</h2>
        <button
          onClick={() => setShowTermsPopup(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
      <div className="text-sm text-gray-700 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          This is a summary. For the full version, please visit our <a href="/terms-of-service" className="font-semibold underline underline-offset-2">Terms of Service page</a>.
        </div>

        <p><strong>1. PARTIES AND SUBJECT</strong></p>
        <p>These Terms of Use ("Terms") constitute a legal agreement between MedGama Health Technologies ("Company") and individuals using the platform ("User"). The platform is provided to search for healthcare services, book appointments, and manage health information.</p>
        
        <p><strong>2. SCOPE OF SERVICE AND LIMITATIONS</strong></p>
        <p>2.1. Services provided through the platform do not constitute medical advice, diagnosis, or treatment. Information is for informational purposes only.</p>
        <p>2.2. In emergencies, users must contact local emergency services directly.</p>
        <p>2.3. The platform is intended for users aged 16 and above (GDPR Art. 8). Users under 16 require parental consent.</p>
        
        <p><strong>3. USER RESPONSIBILITIES</strong></p>
        <p>3.1. Users are responsible for evaluating information obtained via the platform.</p>
        <p>3.2. Users are responsible for the security of their account and must not share credentials with third parties.</p>
        <p>3.3. Users must not use the platform for unlawful purposes.</p>
        
        <p><strong>4. DATA PROTECTION AND PRIVACY</strong></p>
        <p>4.1. Your personal data is processed in accordance with the GDPR (EU) 2016/679 and our <a href="/privacy-policy" className="text-teal-600 font-medium underline underline-offset-2">Privacy Policy</a>.</p>
        <p>4.2. Health data (special category data under Art. 9 GDPR) is only processed with your explicit consent.</p>
        <p>4.3. You have the right to access, rectify, delete, restrict, and port your data at any time via our <a href="/data-rights" className="text-teal-600 font-medium underline underline-offset-2">Data Rights</a> page.</p>
        <p>4.4. Our Data Protection Officer can be reached at <span className="text-teal-600">dpo@medgama.com</span>.</p>
        
        <p><strong>5. INTELLECTUAL PROPERTY RIGHTS</strong></p>
        <p>5.1. The platform content, design, and software are protected by the Company's intellectual property rights.</p>
        <p>5.2. Unauthorized use, copying, or distribution is prohibited.</p>
        
        <p><strong>6. LIMITATION OF LIABILITY</strong></p>
        <p>6.1. The Company does not guarantee the accuracy of information provided via the platform.</p>
        <p>6.2. Users utilize the services at their own risk.</p>
        <p>6.3. The Company is not liable for indirect damages.</p>
        
        <p><strong>7. CHANGES TO TERMS</strong></p>
        <p>7.1. Material changes will be communicated via email or prominent notice on the platform.</p>
        <p>7.2. Where required by GDPR, we will obtain your renewed consent for material changes affecting data processing.</p>
        
        <p><strong>8. DISPUTE RESOLUTION</strong></p>
        <p>8.1. Disputes arising from this agreement fall under the jurisdiction of the courts of Istanbul.</p>
        <p>8.2. The laws of the Republic of Turkey shall apply, without prejudice to mandatory EU consumer protection and GDPR provisions.</p>
        
        <p><strong>9. CONTACT</strong></p>
        <p>General inquiries: <span className="text-teal-600">info@medgama.com</span></p>
        <p>Data Protection Officer: <span className="text-teal-600">dpo@medgama.com</span></p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <a href="/terms-of-service" className="text-xs text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
          Read Full Terms →
        </a>
        <button
          onClick={() => setShowTermsPopup(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
  );
};

export default TermsPopup;