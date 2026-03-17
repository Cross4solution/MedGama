import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ShieldCheck, ShieldX, CheckCircle, XCircle, Clock, FileText,
  Eye, Download, Loader2, AlertTriangle, X, User, Mail, Phone, Building2,
  GraduationCap, Stethoscope, Calendar, Globe, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, RotateCw, Maximize2,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const DOC_TYPE_LABELS = {
  diploma: 'Diploma',
  specialty_certificate: 'Specialty Certificate',
  clinic_license: 'Clinic License',
  id_card: 'ID Card',
  other: 'Other',
};

const STATUS_CONFIG = {
  pending:  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending Review' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Rejected' },
};

/* ═══════════════════════════════════════════
   Document Viewer — Full-screen capable
   ═══════════════════════════════════════════ */
function DocumentViewer({ vr, token, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (!vr) return null;
  const url = `${adminAPI.verificationDocumentUrl(vr.id)}?token=${token}`;
  const isPdf = vr.mime_type === 'application/pdf';
  const isImage = vr.mime_type?.startsWith('image/');

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-black/95 flex flex-col'
    : 'flex flex-col h-full';

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/90 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{vr.document_label || vr.file_name}</p>
            <p className="text-[10px] text-gray-400">{DOC_TYPE_LABELS[vr.document_type] || vr.document_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isImage && (
            <>
              <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="Rotate">
                <RotateCw className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-600 mx-1" />
            </>
          )}
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>
          <a href={url} download className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="Download">
            <Download className="w-4 h-4" />
          </a>
          {fullscreen && (
            <button onClick={() => setFullscreen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors ml-1" title="Close">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-800 flex items-center justify-center p-4">
        {isPdf ? (
          <iframe src={url} className="w-full h-full rounded-lg border border-gray-600" style={{ minHeight: fullscreen ? '100%' : '500px' }} title="Document Preview" />
        ) : isImage ? (
          <div className="overflow-auto max-w-full max-h-full">
            <img
              src={url}
              alt={vr.file_name}
              className="transition-all duration-200 rounded-lg shadow-2xl"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                maxWidth: zoom <= 1 ? '100%' : 'none',
              }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Preview not available for this file type.</p>
            <a href={url} download className="text-teal-400 text-sm underline mt-2 inline-block">Download file</a>
          </div>
        )}
      </div>

      {/* Notes */}
      {vr.notes && (
        <div className="px-4 py-2.5 bg-gray-900/80 border-t border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-300"><span className="font-semibold text-gray-200">Doctor's notes:</span> {vr.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Reject Reason Modal
   ═══════════════════════════════════════════ */
function RejectModal({ vr, onClose, onConfirm, loading }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  if (!vr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {t('admin.review.rejectTitle', 'Reject Document')}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {t('admin.review.rejectDesc', 'Reject this document and notify the doctor with a reason.')}
          </p>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {t('admin.review.rejectReason', 'Rejection Reason')}
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('admin.review.rejectPlaceholder', 'Explain why the document was rejected...')}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
          />
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={() => onConfirm(vr.id, reason)}
            disabled={loading}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            {t('admin.review.rejectBtn', 'Reject')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: Verification Review Page — "The Courtroom"
   ═══════════════════════════════════════════ */
export default function AdminVerificationReview() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = searchParams.get('id');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDocIdx, setActiveDocIdx] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectVr, setRejectVr] = useState(null);

  const token = localStorage.getItem('auth_token') || '';

  const fetchData = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await adminAPI.doctorVerificationDetail(doctorId);
      setData(res?.data || res);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [doctorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (vrId) => {
    setActionLoading(vrId);
    try {
      await adminAPI.approveVerification(vrId);
      fetchData(); // Refresh all data
    } catch {}
    setActionLoading(null);
  };

  const handleReject = async (vrId, reason) => {
    setActionLoading(vrId);
    try {
      await adminAPI.rejectVerification(vrId, reason);
      setRejectVr(null);
      fetchData();
    } catch {}
    setActionLoading(null);
  };

  if (!doctorId) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('admin.review.noDoctorId', 'No doctor ID specified.')}</p>
        <button onClick={() => navigate('/admin/verification')} className="mt-3 text-sm text-teal-600 hover:underline">
          {t('admin.review.backToList', 'Back to Verification Queue')}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.doctor) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('admin.review.notFound', 'Doctor not found.')}</p>
        <button onClick={() => navigate('/admin/verification')} className="mt-3 text-sm text-teal-600 hover:underline">
          {t('admin.review.backToList', 'Back to Verification Queue')}
        </button>
      </div>
    );
  }

  const { doctor, verification_requests: vrs, stats } = data;
  const activeVr = vrs[activeDocIdx] || null;
  const profile = doctor.profile || {};

  return (
    <div className="space-y-5">
      {/* Breadcrumb / Back */}
      <button
        onClick={() => navigate('/admin/verification')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('admin.review.backToList', 'Back to Verification Queue')}
      </button>

      {/* Doctor Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <img
              src={doctor.avatar || '/images/default/default-avatar.svg'}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">{doctor.fullname}</h1>
                {doctor.is_verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> {t('admin.review.verified', 'Verified')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <ShieldX className="w-3 h-3" /> {t('admin.review.unverified', 'Unverified')}
                  </span>
                )}
              </div>
              {profile.title && <p className="text-sm text-gray-500 mt-0.5">{profile.title}</p>}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {doctor.email}</span>
                {doctor.mobile && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {doctor.mobile}</span>}
                {doctor.clinic && <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {doctor.clinic.fullname}</span>}
                {profile.specialty && <span className="inline-flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {profile.specialty}</span>}
                {profile.experience_years && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {profile.experience_years} {t('admin.review.years', 'years')}</span>}
                {profile.languages && <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" /> {Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages}</span>}
              </div>
              {profile.education && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> {Array.isArray(profile.education) ? profile.education.join(' · ') : profile.education}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-3 flex items-center gap-4">
          {[
            { label: t('admin.review.totalDocs', 'Total'), value: stats.total, color: 'text-gray-700' },
            { label: t('admin.review.pendingDocs', 'Pending'), value: stats.pending, color: 'text-amber-600' },
            { label: t('admin.review.approvedDocs', 'Approved'), value: stats.approved, color: 'text-emerald-600' },
            { label: t('admin.review.rejectedDocs', 'Rejected'), value: stats.rejected, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Document List + Viewer */}
      {vrs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200/60">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('admin.review.noDocs', 'No documents have been submitted yet.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Document List */}
          <div className="lg:col-span-4 space-y-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
              {t('admin.review.documents', 'Documents')} ({vrs.length})
            </h2>
            {vrs.map((vr, idx) => {
              const st = STATUS_CONFIG[vr.status] || STATUS_CONFIG.pending;
              const StIcon = st.icon;
              const isActive = idx === activeDocIdx;

              return (
                <button
                  key={vr.id}
                  onClick={() => setActiveDocIdx(idx)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-300 shadow-sm ring-1 ring-indigo-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg} border ${st.border}`}>
                      <FileText className={`w-4 h-4 ${st.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{vr.document_label || vr.file_name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{DOC_TYPE_LABELS[vr.document_type] || vr.document_type}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text}`}>
                          <StIcon className="w-2.5 h-2.5" /> {st.label}
                        </span>
                        {vr.created_at && (
                          <span className="text-[9px] text-gray-400">{new Date(vr.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      {vr.status === 'rejected' && vr.rejection_reason && (
                        <p className="text-[10px] text-red-500 mt-1 truncate" title={vr.rejection_reason}>{vr.rejection_reason}</p>
                      )}
                      {vr.reviewer && (
                        <p className="text-[9px] text-gray-400 mt-0.5">{t('admin.review.reviewedBy', 'Reviewed by')} {vr.reviewer.fullname}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Document Viewer + Actions */}
          <div className="lg:col-span-8 space-y-3">
            {/* Document Viewer */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: '500px' }}>
              {activeVr ? (
                <DocumentViewer vr={activeVr} token={token} />
              ) : (
                <div className="flex items-center justify-center h-[500px] text-gray-500">
                  <p className="text-sm">{t('admin.review.selectDoc', 'Select a document to preview')}</p>
                </div>
              )}
            </div>

            {/* Document navigation */}
            {vrs.length > 1 && (
              <div className="flex items-center justify-between px-1">
                <button
                  disabled={activeDocIdx <= 0}
                  onClick={() => setActiveDocIdx(i => i - 1)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t('admin.review.prevDoc', 'Previous')}
                </button>
                <span className="text-[10px] text-gray-400">
                  {activeDocIdx + 1} / {vrs.length}
                </span>
                <button
                  disabled={activeDocIdx >= vrs.length - 1}
                  onClick={() => setActiveDocIdx(i => i + 1)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors"
                >
                  {t('admin.review.nextDoc', 'Next')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Actions for active document */}
            {activeVr && activeVr.status === 'pending' && (
              <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t('admin.review.verdict', 'Verdict')}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(activeVr.id)}
                    disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {actionLoading === activeVr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {t('admin.review.approve', 'Approve & Verify')}
                  </button>
                  <button
                    onClick={() => setRejectVr(activeVr)}
                    disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('admin.review.reject', 'Reject')}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  {t('admin.review.verdictHint', 'Approving will give this doctor the Verified badge. Rejecting will notify them via email.')}
                </p>
              </div>
            )}

            {/* Already reviewed info */}
            {activeVr && activeVr.status !== 'pending' && (
              <div className={`rounded-xl border p-4 ${STATUS_CONFIG[activeVr.status]?.bg} ${STATUS_CONFIG[activeVr.status]?.border}`}>
                <div className="flex items-center gap-2">
                  {activeVr.status === 'approved' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span className={`text-sm font-semibold ${STATUS_CONFIG[activeVr.status]?.text}`}>
                    {activeVr.status === 'approved'
                      ? t('admin.review.alreadyApproved', 'This document has been approved')
                      : t('admin.review.alreadyRejected', 'This document has been rejected')}
                  </span>
                </div>
                {activeVr.reviewer && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('admin.review.reviewedBy', 'Reviewed by')} <strong>{activeVr.reviewer.fullname}</strong>
                    {activeVr.reviewed_at && ` — ${new Date(activeVr.reviewed_at).toLocaleString()}`}
                  </p>
                )}
                {activeVr.rejection_reason && (
                  <p className="text-xs text-red-600 mt-1">
                    <strong>{t('admin.review.reason', 'Reason')}:</strong> {activeVr.rejection_reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        vr={rejectVr}
        onClose={() => setRejectVr(null)}
        onConfirm={handleReject}
        loading={!!actionLoading}
      />
    </div>
  );
}
