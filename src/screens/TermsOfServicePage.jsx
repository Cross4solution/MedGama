import React from 'react';
import { Link } from '@/compat/router';
import SEOHead from '../components/seo/SEOHead';

const TermsOfServicePage = () => {
  return (
    <div>
      <SEOHead
        title="Kullanım Koşulları"
        description="MedaGama Kullanım Koşulları — platformu kullanırken geçerli olan hak ve yükümlülükler."
        canonical="/terms-of-service"
        alternates
      />
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600">MedaGama Health Tourism Platform Terms of Use</p>
          <p className="text-sm text-gray-400 mt-1">Last updated: February 13, 2026</p>
        </div>
        {/* Summary Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
              <span className="text-sm">📄</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Agreement Summary</h3>
              <p className="text-blue-800">
                This agreement defines the terms of use for health tourism, telehealth, and clinic services provided on the MedaGama platform.
              </p>
            </div>
          </div>
        </div>
        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Scope of Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinic Services */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-green-900">Clinic Services</h3>
              </div>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Create and manage clinic profiles</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Share photos, videos, and media</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Patient reviews system</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Price sharing and display</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Integrated CRM system</li>
                <li className="flex items-start"><span className="text-green-600 mr-2">•</span>Appointment management</li>
              </ul>
            </div>
            {/* Patient Services */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-blue-900">Patient Services</h3>
              </div>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Access clinic information</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>AI-powered doctor suggestions</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Telehealth appointment system</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Health tourism programs</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Secure file sharing</li>
                <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Messaging portal</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2. User Types and Responsibilities</h2>
          <div className="space-y-6">
            {/* Clinic Users */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-gray-900">Clinic Users</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Rights:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Create and edit profiles</li>
                    <li>• Upload multimedia content</li>
                    <li>• Share pricing and service info</li>
                    <li>• Respond to patient messages</li>
                    <li>• Manage appointments</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Responsibilities:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Provide accurate and up-to-date information</li>
                    <li>• Maintain valid licenses and documentation</li>
                    <li>• Protect patient privacy</li>
                    <li>• Adhere to ethical standards</li>
                    <li>• Deliver services in a timely manner</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Patient Users */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-gray-900">Patient Users</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Rights:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Access clinic information</li>
                    <li>• Use AI assistant</li>
                    <li>• Telehealth services</li>
                    <li>• Submit reviews</li>
                    <li>• Secure communication</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Responsibilities:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Provide accurate personal information</li>
                    <li>• Attend appointments on time</li>
                    <li>• Provide objective reviews</li>
                    <li>• Fulfill payment obligations</li>
                    <li>• Comply with platform rules</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Data Security and Privacy</h2>
          {/* GDPR & HIPAA */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="text-red-600 text-xl mr-3">🔒</span>
              <h3 className="text-lg font-semibold text-red-900">GDPR (EU) 2016/679 Compliance</h3>
            </div>
            <p className="text-red-800 mb-3">
              Our platform is designed to fully comply with the European General Data Protection Regulation (GDPR). Your personal data is processed in accordance with our <Link to="/privacy-policy" className="font-semibold underline underline-offset-2">Privacy Policy</Link>.
            </p>
            <div className="text-red-700 text-sm space-y-1">
              <p>• Data Protection Officer: <span className="font-medium">dpo@medagama.com</span></p>
              <p>• Exercise your rights: <Link to="/data-rights" className="font-medium underline underline-offset-2">Data Privacy Rights Center</Link></p>
              <p>• Cookie management: <Link to="/cookie-policy" className="font-medium underline underline-offset-2">Cookie Policy</Link></p>
            </div>
          </div>
          {/* Data Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-blue-900">Data Collection</h3>
              </div>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Personal identification details</li>
                <li>• Medical history</li>
                <li>• Medical images</li>
                <li>• Contact information</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-green-900">Data Usage</h3>
              </div>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Service delivery</li>
                <li>• AI matching</li>
                <li>• Quality assurance</li>
                <li>• Legal obligations</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-purple-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-purple-900">Data Protection</h3>
              </div>
              <ul className="space-y-2 text-purple-800 text-sm">
                <li>• End-to-end encryption</li>
                <li>• Secure servers</li>
                <li>• Access control</li>
                <li>• Regular audits</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Review System</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="text-yellow-600 text-xl mr-3">⭐</span>
              <h3 className="text-lg font-semibold text-yellow-900">Verified Review System</h3>
            </div>
            <p className="text-yellow-800">
              Only patients who received real treatments via our platform can leave reviews. This helps prevent fake reviews.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Standard Reviews</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Only patients who received treatment can review</li>
                <li>• Appointment through the system is required</li>
                <li>• Clinic verification required</li>
                <li>• 1–5 star rating system</li>
                <li>• Detailed text review</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Professional Reviews</h3>
              <ul className="space-y-2 text-purple-800 text-sm">
                <li>• Conducted by expert team</li>
                <li>• Includes reports with physician</li>
                <li>• Detailed photos and videos</li>
                <li>• Objective quality analysis</li>
                <li>• For a reasonable fee</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Payments and Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-blue-900">Clinic Memberships</h3>
              </div>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Monthly subscription</li>
                <li>• Includes CRM</li>
                <li>• Appointment management</li>
                <li>• Profile management</li>
                <li>• Basic support</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-xl mr-3">🌍</span>
                <h3 className="text-lg font-semibold text-green-900">Health Tourism</h3>
              </div>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Package program pricing</li>
                <li>• Door-to-door system</li>
                <li>• Hotel reservations</li>
                <li>• Transfer services</li>
                <li>• Flight ticket support</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-purple-600 text-xl mr-3">📄</span>
                <h3 className="text-lg font-semibold text-purple-900">Telehealth</h3>
              </div>
              <ul className="space-y-2 text-purple-800 text-sm">
                <li>• Per-consultation fee</li>
                <li>• Physician-set pricing</li>
                <li>• Platform commission</li>
                <li>• Secure payments</li>
                <li>• Invoicing system</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Section 6 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">6. General Terms and Conditions</h2>
          <div className="space-y-6">
            {/* Responsibility Limitations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">❗</span>
                <h3 className="text-lg font-semibold text-blue-900">Limitation of Liability</h3>
              </div>
              <div className="text-blue-800 text-sm">
                <p className="mb-2">MedaGama is a technology platform and not a medical service provider. The platform:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Acts as an intermediary between clinics</li>
                  <li>• Does not provide medical advice</li>
                  <li>• Does not guarantee treatment outcomes</li>
                  <li>• Is not directly responsible for clinic quality</li>
                </ul>
              </div>
            </div>
            {/* Cancellation and Refund */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-red-600 text-xl mr-3">❌</span>
                <h3 className="text-lg font-semibold text-red-900">Cancellation and Refund Policy</h3>
              </div>
              <ul className="space-y-2 text-red-800 text-sm">
                <li>• Appointments can be canceled up to 24 hours in advance</li>
                <li>• Health tourism packages may have special conditions</li>
              </ul>
            </div>
          </div>
        </section>
        {/* Agreement Footer */}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement</h3>
          <p className="text-gray-600 mb-4">
            By using the MedaGama platform, you agree to all the terms and conditions above.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your personal data is processed in accordance with our <Link to="/privacy-policy" className="text-teal-600 font-medium underline underline-offset-2">Privacy Policy</Link> and the GDPR. You can exercise your data rights at any time via our <Link to="/data-rights" className="text-teal-600 font-medium underline underline-offset-2">Data Rights Center</Link>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-teal-600 text-white px-6 py-1.5 rounded-lg hover:bg-teal-700 font-medium inline-block">Create Account</Link>
            <Link to="/" className="bg-gray-600 text-white px-6 py-1.5 rounded-lg hover:bg-gray-700 font-medium inline-block">Go Back</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;