import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-500">Last updated: February 13, 2026</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              This Privacy Policy explains how MedaGama Health Technologies ("MedaGama", "we", "us", "our") collects, 
              uses, discloses, and protects your personal data in accordance with the <strong>General Data Protection 
              Regulation (EU) 2016/679 (GDPR)</strong> and applicable national data protection laws. This policy applies 
              to all users of our platform, including patients, doctors, and clinics.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link to="/cookie-policy" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              Cookie Policy <ExternalLink className="w-3 h-3" />
            </Link>
            <Link to="/terms-of-service" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              Terms of Service <ExternalLink className="w-3 h-3" />
            </Link>
            <Link to="/data-rights" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
              Exercise Your Rights <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <section className="space-y-6">
          {/* 1. Data Controller */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Data Controller (Art. 13(1)(a) GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              The data controller responsible for your personal data is:
            </p>
            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-700 space-y-1">
              <p><strong>MedaGama Health Technologies</strong></p>
              <p>Email: <a href="mailto:privacy@medagama.com" className="text-teal-600 underline underline-offset-2">privacy@medagama.com</a></p>
              <p>Website: <a href="https://medagama.com" className="text-teal-600 underline underline-offset-2">medagama.com</a></p>
            </div>
          </div>

          {/* 2. DPO */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Data Protection Officer (Art. 37-39 GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We have appointed a Data Protection Officer (DPO) who can be contacted for any questions regarding 
              the processing of your personal data or the exercise of your rights:
            </p>
            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-700 space-y-1">
              <p><strong>Data Protection Officer</strong></p>
              <p>Email: <a href="mailto:dpo@medagama.com" className="text-teal-600 underline underline-offset-2">dpo@medagama.com</a></p>
            </div>
          </div>

          {/* 3. Data We Collect */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Personal Data We Collect (Art. 13(1)(d) GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We collect the following categories of personal data:
            </p>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Identity Data</h3>
                <p className="text-sm text-gray-600">First name, last name, date of birth, profile photo, user role (patient/doctor/clinic).</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Contact Data</h3>
                <p className="text-sm text-gray-600">Email address, phone number, country, city.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Health Data (Special Category — Art. 9 GDPR)</h3>
                <p className="text-sm text-gray-600">Medical history, chronic conditions, allergies, medications — only when voluntarily provided by you for care coordination purposes. This data is processed based on your explicit consent.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Technical Data</h3>
                <p className="text-sm text-gray-600">IP address, browser type and version, device information, operating system, time zone, language preferences.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Usage Data</h3>
                <p className="text-sm text-gray-600">Pages visited, features used, search queries, interaction patterns, timestamps.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Communication Data</h3>
                <p className="text-sm text-gray-600">Messages sent through our platform, chat history, notification preferences.</p>
              </div>
            </div>
          </div>

          {/* 4. Legal Bases */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Legal Bases for Processing (Art. 6 & 9 GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We process your personal data based on the following legal grounds:
            </p>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Legal Basis</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium text-gray-800">Consent (Art. 6(1)(a))</td>
                    <td className="px-4 py-2.5">Marketing communications, analytics cookies, non-essential data processing</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">Contract (Art. 6(1)(b))</td>
                    <td className="px-4 py-2.5">Account creation, service delivery, appointment management, telehealth</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium text-gray-800">Legitimate Interest (Art. 6(1)(f))</td>
                    <td className="px-4 py-2.5">Platform security, fraud prevention, service improvement, essential cookies</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">Legal Obligation (Art. 6(1)(c))</td>
                    <td className="px-4 py-2.5">Tax records, regulatory compliance, law enforcement requests</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-800">Explicit Consent (Art. 9(2)(a))</td>
                    <td className="px-4 py-2.5">Processing of health data (special category data)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. How We Use Data */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Purposes of Processing (Art. 13(1)(c) GDPR)</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Service Delivery</strong> — Provide, maintain, and improve our platform features</li>
              <li><strong>Account Management</strong> — Create and manage your user account</li>
              <li><strong>Healthcare Coordination</strong> — Facilitate communication between patients, doctors, and clinics</li>
              <li><strong>Personalization</strong> — Customize content and recommendations based on your preferences</li>
              <li><strong>Communication</strong> — Send service notifications, appointment reminders, and support messages</li>
              <li><strong>Security</strong> — Detect and prevent fraud, unauthorized access, and abuse</li>
              <li><strong>Analytics</strong> — Understand usage patterns to improve our services (with consent)</li>
              <li><strong>Legal Compliance</strong> — Fulfill legal and regulatory obligations</li>
            </ul>
          </div>

          {/* 6. Data Sharing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Data Recipients & Sharing (Art. 13(1)(e) GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>We do not sell your personal data.</strong> We may share your data with the following categories of recipients:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Healthcare Providers</strong> — Doctors, clinics, and hospitals you choose to interact with (with your consent)</li>
              <li><strong>Service Providers</strong> — Cloud hosting, email services, and payment processors who act as data processors under written agreements (Art. 28 GDPR)</li>
              <li><strong>Authentication Partners</strong> — Google (for Google Sign-In), subject to their own privacy policies</li>
              <li><strong>Legal Authorities</strong> — Courts, regulators, or law enforcement when required by law</li>
            </ul>
          </div>

          {/* 7. International Transfers */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. International Data Transfers (Art. 13(1)(f) GDPR)</h2>
            <p className="text-gray-700 leading-relaxed">
              Some of our service providers may be located outside the European Economic Area (EEA). When we transfer 
              personal data outside the EEA, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5 mt-2">
              <li><strong>EU Adequacy Decisions</strong> — Transfers to countries recognized by the EU Commission as providing adequate protection</li>
              <li><strong>Standard Contractual Clauses (SCCs)</strong> — EU-approved contractual terms ensuring data protection</li>
              <li><strong>Supplementary Measures</strong> — Additional technical and organizational safeguards where necessary</li>
            </ul>
          </div>

          {/* 8. Data Retention */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Data Retention (Art. 13(2)(a) GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:
            </p>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Data Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Retention Period</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Basis</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5">Account Data</td>
                    <td className="px-4 py-2.5">Duration of account + 3 years</td>
                    <td className="px-4 py-2.5">Contract / Legitimate Interest</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-2.5">Health Data</td>
                    <td className="px-4 py-2.5">10 years after last interaction</td>
                    <td className="px-4 py-2.5">Health regulations</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5">Transaction Records</td>
                    <td className="px-4 py-2.5">5 years</td>
                    <td className="px-4 py-2.5">Tax/financial regulations</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-2.5">Cookie Consent Records</td>
                    <td className="px-4 py-2.5">2 years</td>
                    <td className="px-4 py-2.5">ePrivacy Directive</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Usage / Analytics Data</td>
                    <td className="px-4 py-2.5">26 months</td>
                    <td className="px-4 py-2.5">Legitimate Interest</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 9. Data Security */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Data Security (Art. 32 GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              We implement appropriate technical and organizational measures to ensure a level of security appropriate 
              to the risk, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Encryption</strong> — SSL/TLS encryption for data in transit; encryption at rest for sensitive data</li>
              <li><strong>Access Controls</strong> — Role-based access, multi-factor authentication, principle of least privilege</li>
              <li><strong>Monitoring</strong> — Regular security audits, vulnerability assessments, and incident response procedures</li>
              <li><strong>Staff Training</strong> — Regular data protection training for all personnel</li>
            </ul>
          </div>

          {/* 10. Your Rights */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Your Rights Under GDPR (Art. 15-22)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1.5">
              <li><strong>Right of Access (Art. 15)</strong> — Obtain a copy of your personal data</li>
              <li><strong>Right to Rectification (Art. 16)</strong> — Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure (Art. 17)</strong> — Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing (Art. 18)</strong> — Limit how we use your data</li>
              <li><strong>Right to Data Portability (Art. 20)</strong> — Receive your data in a machine-readable format</li>
              <li><strong>Right to Object (Art. 21)</strong> — Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent (Art. 7(3))</strong> — Withdraw consent at any time without affecting the lawfulness of prior processing</li>
              <li><strong>Right to Lodge a Complaint (Art. 77)</strong> — File a complaint with a supervisory authority</li>
            </ul>
            <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
              <p className="text-sm text-teal-800">
                To exercise any of these rights, visit our{' '}
                <Link to="/data-rights" className="font-semibold underline underline-offset-2">
                  Data Privacy Rights Center
                </Link>{' '}
                or email us at{' '}
                <a href="mailto:dpo@medagama.com" className="font-semibold underline underline-offset-2">dpo@medagama.com</a>.
                We will respond within <strong>30 days</strong>.
              </p>
            </div>
          </div>

          {/* 11. Cookies */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Cookies and Similar Technologies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies (Local Storage, Session Storage) for essential functionality 
              and, with your consent, for analytics and marketing purposes. For detailed information, please see our{' '}
              <Link to="/cookie-policy" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
                Cookie Policy
              </Link>.
            </p>
          </div>

          {/* 12. Automated Decision-Making */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Automated Decision-Making (Art. 22 GDPR)</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform may use AI-powered features (e.g., doctor matching, health recommendations). These features 
              provide suggestions only and do not make legally binding or similarly significant decisions about you 
              without human involvement. You have the right to request human review of any automated decision.
            </p>
          </div>

          {/* 13. Children */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">13. Children's Privacy (Art. 8 GDPR)</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not directed to individuals under the age of 16. We do not knowingly collect personal 
              data from children under 16. If we become aware that we have collected personal data from a child under 
              16 without parental consent, we will take steps to delete that information promptly.
            </p>
          </div>

          {/* 14. Updates */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">14. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated through a 
              prominent notice on our platform or via email. The "Last updated" date at the top of this page indicates 
              when the policy was last revised. Where required by law, we will obtain your consent for material changes.
            </p>
          </div>

          {/* 15. Contact */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">15. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have any questions about this Privacy Policy or wish to exercise your data protection rights:
            </p>
            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-700 space-y-1">
              <p><strong>MedaGama Health Technologies</strong></p>
              <p>Data Protection Officer: <a href="mailto:dpo@medagama.com" className="text-teal-600 underline underline-offset-2">dpo@medagama.com</a></p>
              <p>General privacy inquiries: <a href="mailto:privacy@medagama.com" className="text-teal-600 underline underline-offset-2">privacy@medagama.com</a></p>
              <p className="mt-2 text-xs text-gray-500">
                If you are not satisfied with our response, you have the right to lodge a complaint with your local 
                data protection supervisory authority.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
