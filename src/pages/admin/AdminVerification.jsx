import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck, ShieldX, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Loader2, FileText, Eye, Clock, X, Download, AlertTriangle, ChevronDown,
  RotateCcw, MessageSquarePlus, User, Stethoscope, Mail, Building2,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';
import StatusBadge from '../../components/ui/StatusBadge';

const DOC_TYPE_LABELS = {
  diploma: 'Diploma',
  specialty_certificate: 'Specialty Certificate',
  clinic_license: 'Clinic License',
  id_card: 'ID Card',
  other: 'Other',
};

/* ═══════════════════════════════════════════
   Document Preview Modal
   ═══════════════════════════════════════════ */
function DocumentPreviewModal({ vr, onClose, token }) {
  if (!vr) return null;
  const url = `${adminAPI.verificationDocumentUrl(vr.id)}?token=${token}`;
  const isPdf = vr.mime_type === 'application/pdf';
  const isImage = vr.mime_type?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">{vr.document_label || vr.file_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{DOC_TYPE_LABELS[vr.document_type] || vr.document_type} · {vr.file_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={url} download className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Download">
                <Download className="w-4 h-4 text-gray-500" />
              </a>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center min-h-[400px]">
            {isPdf ? (
              <iframe src={url} className="w-full h-[70vh] rounded-lg border border-gray-200" title="Document Preview" />
            ) : isImage ? (
              <img src={url} alt={vr.file_name} className="max-w-full max-h-[70vh] rounded-lg shadow-sm" />
            ) : (
              <div className="text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Preview not available for this file type.</p>
                <a href={url} download className="text-teal-600 text-sm underline mt-2 inline-block">Download file</a>
              </div>
            )}
          </div>
          {vr.notes && (
            <div className="px-5 py-3 border-t border-gray-100 bg-blue-50/50">
              <p className="text-xs text-gray-600"><span className="font-semibold">Doctor's notes:</span> {vr.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Confirm Action Modal (Approve / Reject / Undo)
   ═══════════════════════════════════════════ */
function ConfirmModal({ open, title, description, icon: Icon, iconColor, confirmLabel, confirmColor, onClose, onConfirm, loading, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              {Icon && <Icon className={`w-4 h-4 ${iconColor || 'text-gray-500'}`} />} {title}
            </h3>
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          </div>
          {children && <div className="px-5 py-4">{children}</div>}
          <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50 ${confirmColor || 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Doctor Documents Drawer (expandable per-doctor)
   ═══════════════════════════════════════════ */
function DoctorDocumentsPanel({ doctor, documents, token, actionLoading, onApprove, onReject, onUndo, onRequestInfo, onPreview }) {
  const [expanded, setExpanded] = useState(false);
  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;
  const infoCount = documents.filter(d => d.status === 'info_requested').length;
  const latestDate = documents[0]?.created_at;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      {/* Doctor Header Row */}
      <button onClick={() => setExpanded(v => !v)} className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors text-left">
        <img
          src={resolveStorageUrl(doctor?.avatar) || '/images/default/default-avatar.svg'}
          alt="" className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm truncate">{doctor?.fullname}</span>
            {doctor?.doctor_profile?.title && (
              <span className="text-[10px] font-medium text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">{doctor.doctor_profile.title}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {doctor?.email}</span>
            {doctor?.doctor_profile?.specialty && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {doctor.doctor_profile.specialty}</span>
            )}
            {doctor?.clinic && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> {doctor.clinic.fullname}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-gray-400">{documents.length} doc{documents.length !== 1 && 's'}</span>
          {pendingCount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">{pendingCount} pending</span>}
          {approvedCount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">{approvedCount} ok</span>}
          {rejectedCount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">{rejectedCount} rej</span>}
          {infoCount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">{infoCount} info</span>}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded Documents List */}
      {expanded && (
        <div className="border-t border-gray-100">
          {documents.map(vr => (
            <div key={vr.id} className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/30 transition-colors">
              {/* Doc info */}
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <button onClick={() => onPreview(vr)} className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline truncate block">
                  {vr.document_label || vr.file_name}
                </button>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{DOC_TYPE_LABELS[vr.document_type] || vr.document_type}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{vr.created_at ? new Date(vr.created_at).toLocaleDateString() : '—'}</span>
                </div>
                {vr.rejection_reason && vr.status === 'rejected' && (
                  <p className="text-[10px] text-red-500 mt-0.5 truncate" title={vr.rejection_reason}>Reason: {vr.rejection_reason}</p>
                )}
                {vr.rejection_reason && vr.status === 'info_requested' && (
                  <p className="text-[10px] text-blue-500 mt-0.5 truncate" title={vr.rejection_reason}>Info requested: {vr.rejection_reason}</p>
                )}
              </div>

              {/* Status */}
              <StatusBadge status={vr.status} size="xs" icon={vr.status === 'pending' ? Clock : vr.status === 'approved' ? CheckCircle : vr.status === 'info_requested' ? MessageSquarePlus : XCircle} />

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {actionLoading === vr.id ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : vr.status === 'pending' ? (
                  <>
                    <button onClick={() => onApprove(vr)} className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors" title="Approve">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onReject(vr)} className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors" title="Reject">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onRequestInfo(vr)} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors" title="Request More Info">
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button onClick={() => onUndo(vr)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors" title="Undo">
                    <RotateCcw className="w-3 h-3" /> Undo
                  </button>
                )}
                <button onClick={() => onPreview(vr)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors" title="Preview">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function AdminVerification() {
  const [tab, setTab] = useState('requests');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  // ── Verification Requests state ──
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqError, setReqError] = useState('');
  const [reqFilter, setReqFilter] = useState('pending');
  const [reqSearch, setReqSearch] = useState('');
  const [reqPage, setReqPage] = useState(1);
  const [reqLastPage, setReqLastPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Modal states ──
  const [previewVr, setPreviewVr] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type, vr, reason?, message? }
  const [modalText, setModalText] = useState('');

  // ── Doctors list state (legacy) ──
  const [doctors, setDoctors] = useState([]);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState('');
  const [docFilter, setDocFilter] = useState('all');
  const [docSearch, setDocSearch] = useState('');
  const [docPage, setDocPage] = useState(1);
  const [docLastPage, setDocLastPage] = useState(1);

  // Auth token for document preview
  let token = '';
  try {
    const saved = localStorage.getItem('auth_state');
    if (saved) token = JSON.parse(saved)?.token || '';
  } catch {}
  if (!token) token = localStorage.getItem('auth_token') || '';

  // ── Group requests by doctor ──
  const groupedByDoctor = useMemo(() => {
    const map = new Map();
    for (const vr of requests) {
      const dId = vr.doctor_id || vr.doctor?.id || 'unknown';
      if (!map.has(dId)) {
        map.set(dId, { doctor: vr.doctor, documents: [] });
      }
      map.get(dId).documents.push(vr);
    }
    return Array.from(map.values());
  }, [requests]);

  // ── Fetch stats ──
  const fetchStats = useCallback(() => {
    adminAPI.verificationStats().then(res => {
      setStats(res?.data || res || { pending: 0, approved: 0, rejected: 0 });
    }).catch(() => {});
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Fetch verification requests ──
  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    setReqError('');
    try {
      const params = { per_page: 50, page: reqPage };
      if (reqFilter !== 'all') params.status = reqFilter;
      if (reqSearch.trim()) params.search = reqSearch.trim();
      const res = await adminAPI.verificationRequests(params);
      setRequests(res?.data || []);
      setReqLastPage(res?.last_page || res?.meta?.last_page || 1);
    } catch (err) {
      setRequests([]);
      const status = err?.response?.status || err?.status;
      if (status === 403) setReqError('Access denied. SuperAdmin privileges required.');
      else if (status === 401) setReqError('Not authenticated. Please log in again.');
      else setReqError(err?.message || 'Failed to load verification requests.');
    }
    setReqLoading(false);
  }, [reqFilter, reqSearch, reqPage]);

  useEffect(() => { if (tab === 'requests') fetchRequests(); }, [fetchRequests, tab]);
  useEffect(() => { setReqPage(1); }, [reqFilter, reqSearch]);

  // ── Fetch doctors (legacy) ──
  const fetchDoctors = useCallback(async () => {
    setDocLoading(true);
    setDocError('');
    try {
      const params = { per_page: 15, page: docPage };
      if (docFilter === 'pending') params.verified = false;
      if (docFilter === 'verified') params.verified = true;
      if (docSearch.trim()) params.search = docSearch.trim();
      const res = await adminAPI.doctors(params);
      setDoctors(res?.data || []);
      setDocLastPage(res?.last_page || res?.meta?.last_page || 1);
    } catch (err) {
      setDoctors([]);
      const status = err?.response?.status || err?.status;
      if (status === 403) setDocError('Access denied. SuperAdmin privileges required.');
      else if (status === 401) setDocError('Not authenticated. Please log in again.');
      else setDocError(err?.message || 'Failed to load doctors list.');
    }
    setDocLoading(false);
  }, [docFilter, docSearch, docPage]);

  useEffect(() => { if (tab === 'doctors') fetchDoctors(); }, [fetchDoctors, tab]);
  useEffect(() => { setDocPage(1); }, [docFilter, docSearch]);

  // ── Actions with confirmation ──
  const openConfirm = (type, vr) => {
    setModalText('');
    setConfirmModal({ type, vr });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, vr } = confirmModal;
    setActionLoading(vr.id);
    try {
      if (type === 'approve') {
        await adminAPI.approveVerification(vr.id);
        setRequests(prev => prev.map(r => r.id === vr.id ? { ...r, status: 'approved' } : r));
        setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), approved: s.approved + 1 }));
      } else if (type === 'reject') {
        await adminAPI.rejectVerification(vr.id, modalText);
        setRequests(prev => prev.map(r => r.id === vr.id ? { ...r, status: 'rejected', rejection_reason: modalText } : r));
        setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }));
      } else if (type === 'undo') {
        await adminAPI.undoVerification(vr.id);
        setRequests(prev => prev.map(r => r.id === vr.id ? { ...r, status: 'pending', rejection_reason: null } : r));
        fetchStats();
      } else if (type === 'requestInfo') {
        if (!modalText.trim()) { setActionLoading(null); return; }
        await adminAPI.requestMoreInfo(vr.id, modalText);
        setRequests(prev => prev.map(r => r.id === vr.id ? { ...r, status: 'info_requested', rejection_reason: modalText } : r));
        setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
      }
      setConfirmModal(null);
    } catch {}
    setActionLoading(null);
  };

  const handleLegacyVerify = async (id, verified) => {
    setActionLoading(id);
    try {
      await adminAPI.verifyDoctor(id, verified);
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, is_verified: verified } : d));
    } catch {}
    setActionLoading(null);
  };

  // ── Confirm modal config ──
  const modalConfig = confirmModal ? {
    approve: {
      title: 'Approve Verification',
      description: `Approve ${confirmModal.vr?.doctor?.fullname}'s document? This will mark the doctor as verified.`,
      icon: CheckCircle, iconColor: 'text-emerald-500',
      confirmLabel: 'Approve', confirmColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
    reject: {
      title: 'Reject Verification',
      description: `Reject ${confirmModal.vr?.doctor?.fullname}'s ${DOC_TYPE_LABELS[confirmModal.vr?.document_type] || 'document'}?`,
      icon: AlertTriangle, iconColor: 'text-red-500',
      confirmLabel: 'Reject', confirmColor: 'bg-red-600 hover:bg-red-700',
      hasTextarea: true, textareaPlaceholder: 'Reason for rejection (optional)...',
    },
    undo: {
      title: 'Undo Verification Action',
      description: `Revert this document back to pending? The doctor's verification status may be affected.`,
      icon: RotateCcw, iconColor: 'text-amber-500',
      confirmLabel: 'Undo', confirmColor: 'bg-amber-600 hover:bg-amber-700',
    },
    requestInfo: {
      title: 'Request More Information',
      description: `Request additional documents or information from ${confirmModal.vr?.doctor?.fullname}.`,
      icon: MessageSquarePlus, iconColor: 'text-blue-500',
      confirmLabel: 'Send Request', confirmColor: 'bg-blue-600 hover:bg-blue-700',
      hasTextarea: true, textareaPlaceholder: 'Describe what information or documents are needed...', textareaRequired: true,
    },
  }[confirmModal.type] : null;

  return (
    <div className="px-4 lg:px-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          Verification Hub
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Review documents and verify doctor registrations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
          <p className="text-xs font-medium text-amber-600 mt-0.5">Pending Review</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
          <p className="text-xs font-medium text-emerald-600 mt-0.5">Approved</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          <p className="text-xs font-medium text-red-600 mt-0.5">Rejected</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('requests')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Verification Requests {stats.pending > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{stats.pending}</span>}
        </button>
        <button onClick={() => setTab('doctors')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'doctors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          All Doctors
        </button>
      </div>

      {/* ═══ TAB: Verification Requests (Grouped by Doctor) ═══ */}
      {tab === 'requests' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <button key={f} onClick={() => setReqFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${reqFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by doctor name or email..." value={reqSearch} onChange={e => setReqSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all" />
            </div>
          </div>

          {reqError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium flex-1">{reqError}</p>
              <button onClick={fetchRequests} className="text-xs font-medium underline hover:text-red-800">Retry</button>
            </div>
          )}

          {reqLoading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
          ) : !reqError && groupedByDoctor.length === 0 ? (
            <div className="text-center py-16">
              <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No verification requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedByDoctor.map(({ doctor, documents }) => (
                <DoctorDocumentsPanel
                  key={doctor?.id || Math.random()}
                  doctor={doctor}
                  documents={documents}
                  token={token}
                  actionLoading={actionLoading}
                  onApprove={vr => openConfirm('approve', vr)}
                  onReject={vr => openConfirm('reject', vr)}
                  onUndo={vr => openConfirm('undo', vr)}
                  onRequestInfo={vr => openConfirm('requestInfo', vr)}
                  onPreview={vr => setPreviewVr(vr)}
                />
              ))}
            </div>
          )}

          {reqLastPage > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400">Page {reqPage} of {reqLastPage}</span>
              <div className="flex gap-1">
                <button disabled={reqPage <= 1} onClick={() => setReqPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={reqPage >= reqLastPage} onClick={() => setReqPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: All Doctors (legacy) ═══ */}
      {tab === 'doctors' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'verified', label: 'Verified' }].map(f => (
                <button key={f.key} onClick={() => setDocFilter(f.key)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${docFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name or email..." value={docSearch} onChange={e => setDocSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all" />
            </div>
          </div>

          {docError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium flex-1">{docError}</p>
              <button onClick={fetchDoctors} className="text-xs font-medium underline hover:text-red-800">Retry</button>
            </div>
          )}

          {docLoading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
          ) : !docError && doctors.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No doctors found.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Doctor</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Clinic</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doctors.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={resolveStorageUrl(d.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="font-medium text-gray-900">{d.fullname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{d.email}</td>
                        <td className="px-4 py-3 text-gray-600">{d.clinic?.fullname || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {d.is_verified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <ShieldX className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {actionLoading === d.id ? (
                              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                            ) : d.is_verified ? (
                              <button onClick={() => handleLegacyVerify(d.id, false)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> Revoke
                              </button>
                            ) : (
                              <button onClick={() => handleLegacyVerify(d.id, true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {docLastPage > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Page {docPage} of {docLastPage}</span>
                  <div className="flex gap-1">
                    <button disabled={docPage <= 1} onClick={() => setDocPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button disabled={docPage >= docLastPage} onClick={() => setDocPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal vr={previewVr} onClose={() => setPreviewVr(null)} token={token} />

      {/* Confirm Action Modal */}
      {modalConfig && (
        <ConfirmModal
          open={!!confirmModal}
          title={modalConfig.title}
          description={modalConfig.description}
          icon={modalConfig.icon}
          iconColor={modalConfig.iconColor}
          confirmLabel={modalConfig.confirmLabel}
          confirmColor={modalConfig.confirmColor}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmAction}
          loading={!!actionLoading}
        >
          {modalConfig.hasTextarea && (
            <textarea
              value={modalText}
              onChange={e => setModalText(e.target.value)}
              placeholder={modalConfig.textareaPlaceholder}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all resize-none"
            />
          )}
        </ConfirmModal>
      )}
    </div>
  );
}
