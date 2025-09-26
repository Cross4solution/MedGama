import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-700 mb-6">
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you use MedGama. If you do not agree with the terms of this privacy policy, please do not
          access the application.
        </p>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">1. Information We Collect</h2>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Account data (name, email, role, profile information)</li>
              <li>Usage data (logs, device, browser, IP, timestamps)</li>
              <li>Communication data (messages, chat, notifications)</li>
              <li>Optional health-related information shared by you for care coordination</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">2. How We Use Information</h2>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Provide and improve our services and features</li>
              <li>Personalize content and recommendations</li>
              <li>Maintain security, prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">3. Legal Bases</h2>
            <p className="text-gray-700">Consent, contract performance, legitimate interests, and legal compliance.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">4. Cookies and Tracking</h2>
            <p className="text-gray-700">We use essential cookies for authentication and preferences. You can control cookies in your browser settings.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">5. Sharing of Information</h2>
            <p className="text-gray-700">We do not sell personal data. We may share with service providers, healthcare partners (with your consent), or as required by law.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">6. International Transfers</h2>
            <p className="text-gray-700">Where applicable, we use appropriate safeguards (e.g., SCCs) for international data transfers.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">7. Data Security</h2>
            <p className="text-gray-700">We apply administrative, technical, and organizational measures to protect your data.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">8. Data Retention</h2>
            <p className="text-gray-700">We retain data for as long as necessary for the purposes outlined, unless a longer retention is required by law.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">9. Your Rights</h2>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Access, rectify, delete your data</li>
              <li>Object to processing and request restriction</li>
              <li>Data portability where applicable</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">10. Children</h2>
            <p className="text-gray-700">Our services are not directed to children under 13. We do not knowingly collect their personal data.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">11. Updates to This Policy</h2>
            <p className="text-gray-700">We may update this policy from time to time. The updated version will be indicated by an updated date.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">12. Contact Us</h2>
            <p className="text-gray-700">If you have questions, contact us at <a className="underline" href="mailto:privacy@medgama.com">privacy@medgama.com</a>.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
