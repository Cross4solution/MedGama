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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Privacy Policy</h2>
          <p className="text-xs text-gray-400 mt-0.5">GDPR (EU) 2016/679 Compliant · Last updated: February 13, 2026</p>
        </div>
        <button
          onClick={() => setShowPrivacyPopup(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
      <div className="text-sm text-gray-700 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          This is a summary of our Privacy Policy. For the full version, please visit our <a href="/privacy-policy" className="font-semibold underline underline-offset-2">Privacy Policy page</a>.
        </div>

        <p><strong>1. DATA CONTROLLER (Art. 13(1)(a) GDPR)</strong></p>
        <p>MedGama Health Technologies ("Company") processes your personal data as a data controller under the General Data Protection Regulation (GDPR) and applicable data protection laws.</p>
        
        <p><strong>2. DATA PROTECTION OFFICER (Art. 37-39 GDPR)</strong></p>
        <p>Contact our DPO at: <span className="text-teal-600">dpo@medgama.com</span></p>
        
        <p><strong>3. PERSONAL DATA WE COLLECT (Art. 13(1)(d) GDPR)</strong></p>
        <p>3.1. <strong>Identity Data:</strong> First name, last name, date of birth, profile photo</p>
        <p>3.2. <strong>Contact Data:</strong> Email address, phone number, country, city</p>
        <p>3.3. <strong>Health Data (Special Category — Art. 9):</strong> Medical history, conditions, allergies — only with your explicit consent</p>
        <p>3.4. <strong>Technical Data:</strong> IP address, browser info, device information</p>
        <p>3.5. <strong>Usage Data:</strong> Page views, search history, preferences</p>
        
        <p><strong>4. LEGAL BASES FOR PROCESSING (Art. 6 & 9 GDPR)</strong></p>
        <p>4.1. <strong>Consent (Art. 6(1)(a)):</strong> Marketing, analytics cookies, non-essential processing</p>
        <p>4.2. <strong>Contract (Art. 6(1)(b)):</strong> Account creation, service delivery</p>
        <p>4.3. <strong>Legitimate Interest (Art. 6(1)(f)):</strong> Security, fraud prevention</p>
        <p>4.4. <strong>Legal Obligation (Art. 6(1)(c)):</strong> Tax records, regulatory compliance</p>
        <p>4.5. <strong>Explicit Consent (Art. 9(2)(a)):</strong> Health data processing</p>
        
        <p><strong>5. DATA SHARING (Art. 13(1)(e) GDPR)</strong></p>
        <p>We do not sell your personal data. We may share with:</p>
        <p>5.1. Healthcare providers you choose to interact with (with consent)</p>
        <p>5.2. Service providers under data processing agreements (Art. 28 GDPR)</p>
        <p>5.3. Legal authorities when required by law</p>
        
        <p><strong>6. INTERNATIONAL TRANSFERS (Art. 13(1)(f) GDPR)</strong></p>
        <p>Where data is transferred outside the EEA, we use Standard Contractual Clauses (SCCs) and supplementary safeguards.</p>
        
        <p><strong>7. DATA RETENTION (Art. 13(2)(a) GDPR)</strong></p>
        <p>7.1. Account Data: Duration of account + 3 years</p>
        <p>7.2. Health Data: 10 years (health regulations)</p>
        <p>7.3. Transaction Logs: 5 years (tax regulations)</p>
        <p>7.4. Cookie Consent Records: 2 years</p>
        
        <p><strong>8. YOUR RIGHTS (Art. 15-22 GDPR)</strong></p>
        <p>8.1. Right of Access (Art. 15)</p>
        <p>8.2. Right to Rectification (Art. 16)</p>
        <p>8.3. Right to Erasure — "Right to be Forgotten" (Art. 17)</p>
        <p>8.4. Right to Restrict Processing (Art. 18)</p>
        <p>8.5. Right to Data Portability (Art. 20)</p>
        <p>8.6. Right to Object (Art. 21)</p>
        <p>8.7. Right to Withdraw Consent (Art. 7(3))</p>
        <p>8.8. Right to Lodge a Complaint with a supervisory authority (Art. 77)</p>
        
        <p><strong>9. EXERCISING YOUR RIGHTS</strong></p>
        <p>Email: <span className="text-teal-600">dpo@medgama.com</span> or visit our <a href="/data-rights" className="text-teal-600 font-medium underline underline-offset-2">Data Privacy Rights</a> page.</p>
        <p>Response Time: Within 30 days (extendable by 60 days for complex requests)</p>
        
        <p><strong>10. CONTACT</strong></p>
        <p>Data Protection Officer: <span className="text-teal-600">dpo@medgama.com</span></p>
        <p>Privacy inquiries: <span className="text-teal-600">privacy@medgama.com</span></p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <a href="/privacy-policy" className="text-xs text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
          Read Full Privacy Policy →
        </a>
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