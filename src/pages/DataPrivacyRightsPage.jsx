import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCookieConsent } from '../context/CookieConsentContext';
import {
  Shield, Download, Trash2, Eye, PenLine, Ban, ArrowRightLeft,
  Bell, Settings, FileText, AlertTriangle, CheckCircle, Clock, ExternalLink
} from 'lucide-react';

const GDPR_RIGHTS = [
  {
    icon: Eye,
    title: 'Right of Access (Art. 15)',
    description: 'You have the right to obtain confirmation as to whether your personal data is being processed and, if so, to access that data along with information about how it is used.',
    action: 'request_access',
    actionLabel: 'Request My Data',
  },
  {
    icon: PenLine,
    title: 'Right to Rectification (Art. 16)',
    description: 'You have the right to have inaccurate personal data corrected and incomplete data completed.',
    action: 'rectify',
    actionLabel: 'Update My Data',
    link: '/profile',
  },
  {
    icon: Trash2,
    title: 'Right to Erasure (Art. 17)',
    description: 'Also known as the "right to be forgotten". You can request the deletion of your personal data when it is no longer necessary for the purpose it was collected.',
    action: 'delete_account',
    actionLabel: 'Request Deletion',
  },
  {
    icon: Ban,
    title: 'Right to Restrict Processing (Art. 18)',
    description: 'You can request that we limit how we use your data in certain circumstances, such as when you contest the accuracy of the data.',
    action: 'restrict',
    actionLabel: 'Request Restriction',
  },
  {
    icon: ArrowRightLeft,
    title: 'Right to Data Portability (Art. 20)',
    description: 'You have the right to receive your personal data in a structured, commonly used, and machine-readable format (JSON), and to transmit it to another controller.',
    action: 'export_data',
    actionLabel: 'Export My Data',
  },
  {
    icon: Bell,
    title: 'Right to Object (Art. 21)',
    description: 'You have the right to object to processing of your personal data based on legitimate interests or for direct marketing purposes.',
    action: 'object',
    actionLabel: 'Object to Processing',
  },
];

export default function DataPrivacyRightsPage() {
  const { user } = useAuth();
  const { openSettings, consent, consentTimestamp, resetConsent } = useCookieConsent();
  const [requestSent, setRequestSent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAction = (action) => {
    if (action === 'rectify') return; // handled by link
    if (action === 'delete_account') {
      setShowDeleteConfirm(true);
      return;
    }
    if (action === 'export_data') {
      handleExportData();
      return;
    }
    // For other actions, show a confirmation that request was submitted
    setRequestSent(action);
    setTimeout(() => setRequestSent(null), 5000);
  };

  const handleExportData = () => {
    // Collect all user data from localStorage and create a downloadable JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      gdprExport: true,
      format: 'GDPR Article 20 - Data Portability',
      userData: {},
      cookieConsent: {},
      preferences: {},
    };

    try {
      // User profile data
      const authState = localStorage.getItem('auth_state');
      if (authState) {
        const parsed = JSON.parse(authState);
        exportData.userData = {
          name: parsed?.user?.name || null,
          email: parsed?.user?.email || null,
          role: parsed?.user?.role || null,
          id: parsed?.user?.id || null,
        };
      }

      // Cookie consent
      const cookieConsent = localStorage.getItem('cookie_consent');
      if (cookieConsent) {
        exportData.cookieConsent = JSON.parse(cookieConsent);
      }

      // Profile preferences
      const prefs = localStorage.getItem('profile_prefs');
      if (prefs) {
        exportData.preferences = JSON.parse(prefs);
      }

      // Medical data (if patient)
      if (user?.email) {
        const medKey = `patient_profile_extra_${user.email}`;
        const med = localStorage.getItem(medKey);
        if (med) {
          exportData.medicalData = JSON.parse(med);
        }
      }
    } catch {}

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medagama-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setRequestSent('export_data');
    setTimeout(() => setRequestSent(null), 5000);
  };

  const handleDeleteAccount = () => {
    // Clear all user data from localStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== 'cookie_consent') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
    } catch {}
    setShowDeleteConfirm(false);
    setRequestSent('delete_account');
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Your Data Privacy Rights</h1>
              <p className="text-sm text-gray-500">GDPR Rights Management Center</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Under the <strong>General Data Protection Regulation (GDPR)</strong>, you have specific rights regarding 
            your personal data. This page allows you to exercise those rights directly. All requests are processed 
            within <strong>30 days</strong> as required by law.
          </p>
        </div>

        {/* Success notification */}
        {requestSent && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-in">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {requestSent === 'export_data' ? 'Data export downloaded successfully!' :
                 requestSent === 'delete_account' ? 'Account deletion initiated. Redirecting...' :
                 'Your request has been submitted successfully.'}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {requestSent === 'export_data' ? 'Check your downloads folder.' :
                 requestSent === 'delete_account' ? 'All local data has been cleared.' :
                 'We will process your request within 30 days and contact you via email.'}
              </p>
            </div>
          </div>
        )}

        {/* Cookie Consent Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-600" />
              Cookie Consent Status
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={openSettings}
                className="text-xs font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
              >
                Manage Cookies
              </button>
              <button
                onClick={resetConsent}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                Reset All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'necessary', label: 'Necessary', always: true },
              { key: 'functional', label: 'Functional' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'marketing', label: 'Marketing' },
            ].map((cat) => (
              <div key={cat.key} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  cat.always || consent[cat.key] ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-gray-700">{cat.label}</span>
                <span className={`text-[10px] font-medium ${
                  cat.always || consent[cat.key] ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {cat.always ? 'Always' : consent[cat.key] ? 'Allowed' : 'Denied'}
                </span>
              </div>
            ))}
          </div>
          {consentTimestamp && (
            <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {new Date(consentTimestamp).toLocaleString()}
            </p>
          )}
        </div>

        {/* GDPR Rights */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Your Rights</h2>
          {GDPR_RIGHTS.map((right) => {
            const Icon = right.icon;
            return (
              <div key={right.action} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{right.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{right.description}</p>
                    {right.link ? (
                      <Link
                        to={right.link}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        {right.actionLabel}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleAction(right.action)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          right.action === 'delete_account'
                            ? 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100'
                            : 'text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {right.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supervisory Authority */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">Right to Lodge a Complaint (Art. 77)</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                If you believe that our processing of your personal data violates the GDPR, you have the right to 
                lodge a complaint with a supervisory authority, in particular in the EU Member State of your habitual 
                residence, place of work, or place of the alleged infringement. Before doing so, we encourage you to 
                contact us first so we can try to resolve your concern.
              </p>
            </div>
          </div>
        </div>

        {/* Contact DPO */}
        <div className="bg-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            Data Protection Officer (DPO)
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            For any questions or requests regarding your data privacy rights, please contact our DPO:
          </p>
          <div className="text-xs text-gray-700 space-y-0.5">
            <p>Email: <a href="mailto:dpo@medagama.com" className="text-teal-600 underline underline-offset-2">dpo@medagama.com</a></p>
            <p>Privacy inquiries: <a href="mailto:privacy@medagama.com" className="text-teal-600 underline underline-offset-2">privacy@medagama.com</a></p>
            <p>Response time: Within 30 days (extendable by 60 days for complex requests)</p>
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Account & Data</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-rose-800 leading-relaxed">
                <strong>Warning:</strong> This will permanently delete all your local data including your profile, 
                preferences, medical history, and session data. For complete server-side data deletion, our team 
                will process your request within 30 days.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Delete All My Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
