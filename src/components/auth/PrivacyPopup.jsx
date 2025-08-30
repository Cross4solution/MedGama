import React from 'react';

const PrivacyPopup = ({ setShowPrivacyPopup }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowPrivacyPopup(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Privacy Policy</h2>
        <button
          onClick={() => setShowPrivacyPopup(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
      <div className="text-sm text-gray-700 space-y-4">
        <p><strong>1. DATA CONTROLLER</strong></p>
        <p>MediTravel Health Technologies Inc. ("Company") processes your personal data as a data controller under applicable data protection laws.</p>
        
        <p><strong>2. PERSONAL DATA WE COLLECT</strong></p>
        <p>2.1. Identity: First name, last name, date of birth, gender</p>
        <p>2.2. Contact: Email address, phone number, address details</p>
        <p>2.3. Health Data: Medical history, appointment info, doctor notes</p>
        <p>2.4. Security: IP address, browser info, cookie data</p>
        <p>2.5. Usage Data: Page views, search history, preferences</p>
        
        <p><strong>3. PURPOSES OF PROCESSING</strong></p>
        <p>3.1. Service Delivery: Appointment management, doctor matching, coordination</p>
        <p>3.2. Communication: Notifications, reminders, support</p>
        <p>3.3. Security: Fraud prevention, account security, legal compliance</p>
        <p>3.4. Analytics: Improve service quality and user experience</p>
        <p>3.5. Legal Obligations: Data retention and reporting as required by law</p>
        
        <p><strong>4. DATA SHARING</strong></p>
        <p>4.1. Service Providers: Doctors, hospitals, labs (with your consent)</p>
        <p>4.2. Technology Partners: Cloud providers, analytics tools</p>
        <p>4.3. Legal Requirements: Courts, public authorities, law enforcement</p>
        <p>4.4. Business Partners: Insurers, payment providers (where necessary)</p>
        
        <p><strong>5. DATA SECURITY</strong></p>
        <p>5.1. Technical: SSL encryption, secure servers, regular security tests</p>
        <p>5.2. Administrative: Staff training, access control, data classification</p>
        <p>5.3. Physical: Data center security, backups</p>
        
        <p><strong>6. RETENTION PERIODS</strong></p>
        <p>6.1. Account Data: While active + 3 years</p>
        <p>6.2. Health Data: 10 years (as per health regulations)</p>
        <p>6.3. Transaction Logs: 5 years (as per tax regulations)</p>
        <p>6.4. Cookie Data: Up to 2 years</p>
        
        <p><strong>7. YOUR RIGHTS</strong></p>
        <p>7.1. Right to Information</p>
        <p>7.2. Right of Access</p>
        <p>7.3. Right to Rectification</p>
        <p>7.4. Right to Erasure</p>
        <p>7.5. Right to Restrict Processing</p>
        <p>7.6. Data Portability</p>
        <p>7.7. Right to Object</p>
        
        <p><strong>8. EXERCISING YOUR RIGHTS</strong></p>
        <p>8.1. Method: Email (privacy@meditravel.com) or written request</p>
        <p>8.2. Response Time: Up to 30 days</p>
        <p>8.3. Fees: First request free; subsequent requests may be charged</p>
        
        <p><strong>9. COOKIE POLICY</strong></p>
        <p>9.1. Necessary Cookies: Required for core functionality</p>
        <p>9.2. Analytics Cookies: For usage statistics</p>
        <p>9.3. Marketing Cookies: For personalized content (consent required)</p>
        
        <p><strong>10. CONTACT</strong></p>
        <p>For questions regarding your personal data: privacy@meditravel.com</p>
        <p>Address: [Company Address]</p>
        <p>Phone: [Company Phone]</p>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowPrivacyPopup(false)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
  );
};

export default PrivacyPopup; 