import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, BarChart3, Megaphone, Settings, ExternalLink } from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

const COOKIE_TABLE = [
  {
    name: 'cookie_consent',
    provider: 'MedGama',
    purpose: 'Stores your cookie consent preferences',
    category: 'Necessary',
    duration: 'Persistent',
    type: 'Local Storage',
  },
  {
    name: 'auth_state',
    provider: 'MedGama',
    purpose: 'Maintains your login session and authentication state',
    category: 'Necessary',
    duration: 'Session / Persistent',
    type: 'Local Storage',
  },
  {
    name: 'access_token',
    provider: 'MedGama',
    purpose: 'Authentication token for secure API communication',
    category: 'Necessary',
    duration: 'Session',
    type: 'Local Storage',
  },
  {
    name: 'profile_prefs',
    provider: 'MedGama',
    purpose: 'Stores your display preferences and settings',
    category: 'Functional',
    duration: 'Persistent',
    type: 'Local Storage',
  },
  {
    name: 'returnScroll',
    provider: 'MedGama',
    purpose: 'Remembers scroll position for navigation',
    category: 'Functional',
    duration: 'Session',
    type: 'Session Storage',
  },
  {
    name: 'Google OAuth',
    provider: 'Google (accounts.google.com)',
    purpose: 'Enables Google Sign-In authentication',
    category: 'Functional',
    duration: 'Session',
    type: 'Third-party',
  },
];

export default function CookiePolicyPage() {
  const { openSettings } = useCookieConsent();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cookie Policy</h1>
              <p className="text-sm text-gray-500">Last updated: February 13, 2026</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            This Cookie Policy explains how MedGama Health Technologies ("we", "us", "our") uses cookies and similar 
            technologies when you visit our website. This policy should be read alongside our{' '}
            <Link to="/privacy-policy" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              Privacy Policy
            </Link>.
          </p>
        </div>

        {/* Manage Cookies Button */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-teal-900">Manage Your Cookie Preferences</h3>
            <p className="text-xs text-teal-700 mt-0.5">You can change your cookie settings at any time.</p>
          </div>
          <button
            onClick={openSettings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Cookie Settings
          </button>
        </div>

        <section className="space-y-8">
          {/* What Are Cookies */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. What Are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit a website. They are widely used 
              to make websites work efficiently, provide information to website owners, and enhance user experience. 
              We also use similar technologies such as Local Storage and Session Storage for the same purposes.
            </p>
          </div>

          {/* Legal Basis */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Legal Basis for Using Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Under the <strong>General Data Protection Regulation (GDPR)</strong> and the <strong>ePrivacy Directive</strong>, 
              we are required to obtain your consent before placing non-essential cookies on your device. 
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Strictly Necessary Cookies</strong> — do not require consent as they are essential for the website to function (Art. 6(1)(f) GDPR, legitimate interest).</li>
              <li><strong>All other cookies</strong> — require your explicit, informed, and freely given consent (Art. 6(1)(a) GDPR).</li>
            </ul>
          </div>

          {/* Cookie Categories */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
            <div className="space-y-4">
              {/* Necessary */}
              <div className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-center gap-2.5 mb-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-gray-900">Strictly Necessary Cookies</h3>
                  <span className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">Always Active</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  These cookies are essential for the website to function properly. They enable core features such as 
                  user authentication, session management, security, and cookie consent storage. Without these cookies, 
                  the website cannot operate. They do not require your consent.
                </p>
              </div>

              {/* Functional */}
              <div className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-center gap-2.5 mb-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Functional Cookies</h3>
                  <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">Consent Required</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  These cookies enable enhanced functionality and personalization, such as remembering your preferences, 
                  language settings, and region. If you do not allow these cookies, some or all of these features may 
                  not function properly.
                </p>
              </div>

              {/* Analytics */}
              <div className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-center gap-2.5 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Analytics & Performance Cookies</h3>
                  <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">Consent Required</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  These cookies help us understand how visitors interact with our website by collecting and reporting 
                  information anonymously. This data helps us improve our services and user experience. No personally 
                  identifiable information is collected through these cookies.
                </p>
              </div>

              {/* Marketing */}
              <div className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-center gap-2.5 mb-2">
                  <Megaphone className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-gray-900">Marketing & Advertising Cookies</h3>
                  <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">Consent Required</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  These cookies are used to deliver advertisements relevant to you and your interests. They may also be 
                  used to limit the number of times you see an advertisement and to measure the effectiveness of 
                  advertising campaigns. They are usually placed by advertising networks with the website operator's permission.
                </p>
              </div>
            </div>
          </div>

          {/* Cookie Table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Specific Cookies We Use</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Cookie / Storage</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Provider</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIE_TABLE.map((cookie, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{cookie.name}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{cookie.provider}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{cookie.purpose}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          cookie.category === 'Necessary' ? 'text-teal-700 bg-teal-50 border border-teal-200' :
                          cookie.category === 'Functional' ? 'text-blue-700 bg-blue-50 border border-blue-200' :
                          'text-purple-700 bg-purple-50 border border-purple-200'
                        }`}>
                          {cookie.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{cookie.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Third-Party Cookies */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Some cookies may be set by third-party services that appear on our pages. We do not control these 
              third-party cookies. The following third-party services may set cookies:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Google (accounts.google.com)</strong> — Used for Google Sign-In authentication. Subject to{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline underline-offset-2 inline-flex items-center gap-0.5">
                  Google's Privacy Policy <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><strong>Google Fonts (fonts.googleapis.com)</strong> — Used to load web fonts. Subject to{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline underline-offset-2 inline-flex items-center gap-0.5">
                  Google's Privacy Policy <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* How to Control Cookies */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. How to Control Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You have several options to control cookies:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Our Cookie Settings</strong> — Use the "Cookie Settings" button above or in the cookie banner to manage your preferences at any time.</li>
              <li><strong>Browser Settings</strong> — Most browsers allow you to refuse or delete cookies through their settings. Note that blocking all cookies may affect website functionality.</li>
              <li><strong>Do Not Track</strong> — Some browsers offer a "Do Not Track" feature. We respect this signal where technically feasible.</li>
            </ul>
          </div>

          {/* Your Rights */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Your Rights Under GDPR</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Under the GDPR, you have the following rights regarding cookies and the data they collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Right to be informed</strong> — about how we use cookies (this policy)</li>
              <li><strong>Right to consent</strong> — to give or withdraw consent at any time</li>
              <li><strong>Right to access</strong> — to know what data cookies have collected about you</li>
              <li><strong>Right to erasure</strong> — to request deletion of cookie data</li>
              <li><strong>Right to lodge a complaint</strong> — with a supervisory authority if you believe your rights have been violated</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, please visit our{' '}
              <Link to="/data-rights" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
                Data Privacy Rights
              </Link>{' '}
              page or contact us at{' '}
              <a href="mailto:privacy@medgama.com" className="text-teal-600 hover:text-teal-700 underline underline-offset-2">
                privacy@medgama.com
              </a>.
            </p>
          </div>

          {/* Updates */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our 
              data practices. When we make material changes, we will notify you by updating the "Last updated" date at 
              the top of this page and, where appropriate, by re-requesting your consent.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Cookie Policy, please contact our Data Protection Officer:
            </p>
            <div className="mt-3 bg-gray-100 rounded-xl p-4 text-sm text-gray-700 space-y-1">
              <p><strong>MedGama Health Technologies</strong></p>
              <p>Data Protection Officer (DPO)</p>
              <p>Email: <a href="mailto:dpo@medgama.com" className="text-teal-600 underline underline-offset-2">dpo@medgama.com</a></p>
              <p>Privacy inquiries: <a href="mailto:privacy@medgama.com" className="text-teal-600 underline underline-offset-2">privacy@medgama.com</a></p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
