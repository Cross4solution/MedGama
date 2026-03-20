import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, FileText, Building2, Shield, Receipt, UserCheck,
  CheckCircle2, Clock, AlertTriangle, Loader2, File, Trash2, XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clinicVerificationAPI } from '../../lib/api';

const DOCUMENT_FIELDS = [
  {
    key: 'business_registration',
    icon: Building2,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-400',
  },
  {
    key: 'operating_license',
    icon: Shield,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-400',
  },
  {
    key: 'tax_plate',
    icon: Receipt,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBorder: 'border-amber-400',
  },
  {
    key: 'representative_id',
    icon: UserCheck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    activeBorder: 'border-violet-400',
  },
];

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const STATUS_CONFIG = {
  unverified: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  pending_review: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  verified: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

const ClinicVerificationModal = ({ isOpen, onClose, onStatusChange }) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState({});
  const [dragOver, setDragOver] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [latestSubmission, setLatestSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileRefs = useRef({});

  // Fetch current status on open
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(false);
    clinicVerificationAPI.status().then(res => {
      const d = res?.data || res;
      setVerificationStatus(d.verification_status || 'unverified');
      setLatestSubmission(d.latest_submission || null);
    }).catch(() => {});
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const handleDrop = useCallback((fieldKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    const file = e.dataTransfer?.files?.[0];
    if (file) validateAndSetFile(fieldKey, file);
  }, []);

  const handleFileSelect = useCallback((fieldKey, e) => {
    const file = e.target?.files?.[0];
    if (file) validateAndSetFile(fieldKey, file);
    if (e.target) e.target.value = '';
  }, []);

  const validateAndSetFile = (fieldKey, file) => {
    setError(null);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('crm.clinicVerification.invalidFileType', 'Invalid file type. Please upload PDF, JPG, PNG or WebP.'));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t('crm.clinicVerification.fileTooLarge', 'File is too large. Maximum size is 10MB.'));
      return;
    }
    setFiles(prev => ({ ...prev, [fieldKey]: file }));
  };

  const removeFile = (fieldKey) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const allFilesSelected = DOCUMENT_FIELDS.every(f => files[f.key]);

  const handleSubmit = async () => {
    if (!allFilesSelected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      DOCUMENT_FIELDS.forEach(f => {
        fd.append(f.key, files[f.key]);
      });
      const res = await clinicVerificationAPI.submit(fd);
      const d = res?.data || res;
      setSuccess(true);
      setVerificationStatus('pending_review');
      setFiles({});
      if (onStatusChange) onStatusChange('pending_review');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isPending = verificationStatus === 'pending_review';
  const isRejected = verificationStatus === 'rejected';
  const isVerified = verificationStatus === 'verified';
  const canSubmit = !isPending && !isVerified;

  const statusCfg = STATUS_CONFIG[verificationStatus] || STATUS_CONFIG.unverified;
  const StatusIcon = statusCfg.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Centering container — sidebar-aware */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-[256px] pointer-events-none">
        <div
          className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden animate-fadeIn pointer-events-auto"
          style={{ maxHeight: 'min(92vh, 860px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/60 to-white flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(10,110,111,0.1)' }}>
                <Shield className="w-5 h-5" style={{ color: '#0A6E6F' }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {t('crm.clinicVerification.title', 'Clinic Verification')}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {t('crm.clinicVerification.subtitle', 'Upload required documents to verify your clinic')}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="px-6 py-5 space-y-5">

              {/* Status Banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${statusCfg.bg} ${statusCfg.border}`}>
                <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusCfg.color}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${statusCfg.color}`}>
                    {verificationStatus === 'unverified' && t('crm.clinicVerification.statusUnverified', 'Your clinic is not yet verified')}
                    {verificationStatus === 'pending_review' && t('crm.clinicVerification.statusPending', 'Your documents are under review')}
                    {verificationStatus === 'verified' && t('crm.clinicVerification.statusVerified', 'Your clinic is verified')}
                    {verificationStatus === 'rejected' && t('crm.clinicVerification.statusRejected', 'Your verification was rejected')}
                  </p>
                  {isPending && (
                    <p className="text-xs text-gray-500 mt-0.5">{t('crm.clinicVerification.pendingDesc', 'Our team is reviewing your documents. This usually takes 1-2 business days.')}</p>
                  )}
                  {isRejected && latestSubmission?.admin_notes && (
                    <p className="text-xs text-red-600 mt-0.5">{t('crm.clinicVerification.rejectionReason', 'Reason')}: {latestSubmission.admin_notes}</p>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-emerald-50 border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-emerald-700">
                    {t('crm.clinicVerification.submitSuccess', 'Documents submitted successfully! We will review them shortly.')}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-red-50 border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Document Upload Areas */}
              {canSubmit && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('crm.clinicVerification.requiredDocuments', 'Required Documents')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DOCUMENT_FIELDS.map((field) => {
                      const FieldIcon = field.icon;
                      const file = files[field.key];
                      const isDragActive = dragOver === field.key;

                      return (
                        <div
                          key={field.key}
                          className={`relative rounded-xl border-2 border-dashed transition-all ${
                            file
                              ? `${field.border} bg-white`
                              : isDragActive
                                ? `${field.activeBorder} ${field.bg}`
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                          }`}
                          onDragOver={(e) => { e.preventDefault(); setDragOver(field.key); }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={(e) => handleDrop(field.key, e)}
                        >
                          <input
                            ref={el => fileRefs.current[field.key] = el}
                            type="file"
                            accept={ACCEPTED}
                            className="hidden"
                            onChange={(e) => handleFileSelect(field.key, e)}
                          />

                          {file ? (
                            /* File selected state */
                            <div className="p-3.5">
                              <div className="flex items-start gap-2.5">
                                <div className={`w-9 h-9 rounded-lg ${field.bg} flex items-center justify-center flex-shrink-0`}>
                                  <FieldIcon className={`w-4 h-4 ${field.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-900 leading-tight">
                                    {t(`crm.clinicVerification.${field.key}`, field.key.replace(/_/g, ' '))}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <File className="w-3 h-3 text-gray-400" />
                                    <p className="text-[10px] text-gray-500 truncate">{file.name}</p>
                                    <span className="text-[10px] text-gray-400">({(file.size / 1024).toFixed(0)}KB)</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFile(field.key)}
                                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="mt-2 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-semibold text-emerald-600">{t('common.ready', 'Ready')}</span>
                              </div>
                            </div>
                          ) : (
                            /* Empty / Drop zone state */
                            <button
                              type="button"
                              onClick={() => fileRefs.current[field.key]?.click()}
                              className="w-full p-4 text-center cursor-pointer group"
                            >
                              <div className={`w-10 h-10 rounded-xl ${field.bg} flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                                <FieldIcon className={`w-5 h-5 ${field.color}`} />
                              </div>
                              <p className="text-xs font-bold text-gray-700 mb-0.5">
                                {t(`crm.clinicVerification.${field.key}`, field.key.replace(/_/g, ' '))}
                              </p>
                              <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                                <Upload className="w-3 h-3" />
                                <span>{t('crm.clinicVerification.dragOrClick', 'Drag & drop or click')}</span>
                              </div>
                              <p className="text-[9px] text-gray-300 mt-1">PDF, JPG, PNG — max 10MB</p>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Previous submission details (when pending) */}
              {isPending && latestSubmission && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60">
                  <p className="text-xs font-semibold text-gray-500 mb-2">{t('crm.clinicVerification.submittedDocuments', 'Submitted Documents')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DOCUMENT_FIELDS.map(f => (
                      <div key={f.key} className="flex items-center gap-2 text-xs">
                        {latestSubmission[f.key] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-300" />
                        )}
                        <span className={latestSubmission[f.key] ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                          {t(`crm.clinicVerification.${f.key}`, f.key.replace(/_/g, ' '))}
                        </span>
                      </div>
                    ))}
                  </div>
                  {latestSubmission.submitted_at && (
                    <p className="text-[10px] text-gray-400 mt-2">
                      {t('crm.clinicVerification.submittedOn', 'Submitted on')}: {new Date(latestSubmission.submitted_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {canSubmit && (
            <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-gray-100 bg-gray-50/40 flex-shrink-0">
              <p className="text-[10px] text-gray-400">
                {Object.keys(files).length}/{DOCUMENT_FIELDS.length} {t('crm.clinicVerification.documentsSelected', 'documents selected')}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!allFilesSelected || submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  style={{ backgroundColor: allFilesSelected && !submitting ? '#0A6E6F' : undefined }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {t('crm.clinicVerification.submitDocuments', 'Submit for Review')}
                </button>
              </div>
            </div>
          )}

          {/* Close button for pending/verified */}
          {!canSubmit && (
            <div className="flex items-center justify-end px-6 py-3.5 border-t border-gray-100 bg-gray-50/40 flex-shrink-0">
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm hover:shadow-md" style={{ backgroundColor: '#0A6E6F' }}>
                {t('common.close', 'Close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClinicVerificationModal;
