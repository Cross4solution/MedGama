import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldX, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Loader2, FileText, Eye, Clock, X, Download, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

const DOC_TYPE_LABELS = {
  diploma: 'Diploma',
  specialty_certificate: 'Specialty Certificate',
  clinic_license: 'Clinic License',
  id_card: 'ID Card',
  other: 'Other',
};

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Rejected' },
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
   Reject Reason Modal
   ═══════════════════════════════════════════ */
function RejectModal({ vr, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  if (!vr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Reject Verification
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Reject <strong>{vr.doctor?.fullname}</strong>'s {DOC_TYPE_LABELS[vr.document_type] || 'document'}
          </p>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why the document was rejected..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
          />
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={() => onConfirm(vr.id, reason)}
            disabled={loading}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function AdminVerification() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('requests'); // requests | doctors
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
  const [previewVr, setPreviewVr] = useState(null);
  const [rejectVr, setRejectVr] = useState(null);

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

  // ── Fetch stats ──
  useEffect(() => {
    adminAPI.verificationStats().then(res => {
      setStats(res?.data || res || { pending: 0, approved: 0, rejected: 0 });
    }).catch(() => {});
  }, []);

  // ── Fetch verification requests ──
  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    setReqError('');
    try {
      const params = { per_page: 15, page: reqPage };
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

  // ── Actions ──
  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approveVerification(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), approved: s.approved + 1 }));
    } catch {}
    setActionLoading(null);
  };

  const handleReject = async (id, reason) => {
    setActionLoading(id);
    try {
      await adminAPI.rejectVerification(id, reason);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', rejection_reason: reason } : r));
      setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }));
      setRejectVr(null);
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
        {[
          { label: 'Pending Review', count: stats.pending, color: 'amber' },
          { label: 'Approved', count: stats.approved, color: 'emerald' },
          { label: 'Rejected', count: stats.rejected, color: 'red' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl px-4 py-3`}>
            <p className={`text-2xl font-bold text-${s.color}-700`}>{s.count}</p>
            <p className={`text-xs font-medium text-${s.color}-600 mt-0.5`}>{s.label}</p>
          </div>
        ))}
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

      {/* ═══ TAB: Verification Requests ═══ */}
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
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
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
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
          ) : !reqError && requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No verification requests found.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Doctor</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Document</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map(vr => {
                      const st = STATUS_STYLES[vr.status] || STATUS_STYLES.pending;
                      const StIcon = st.icon;
                      return (
                        <tr key={vr.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <img src={resolveStorageUrl(vr.doctor?.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              <div>
                                <span className="font-medium text-gray-900 block">{vr.doctor?.fullname}</span>
                                <span className="text-[11px] text-gray-400">{vr.doctor?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setPreviewVr(vr)} className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline text-xs font-medium">
                                <Eye className="w-3.5 h-3.5" /> {vr.document_label || vr.file_name}
                              </button>
                              <button
                                onClick={() => navigate(`/admin/verification/review?id=${vr.doctor_id}`)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                title="Open full review"
                              >
                                <ExternalLink className="w-2.5 h-2.5" /> Review
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                              <FileText className="w-3 h-3" /> {DOC_TYPE_LABELS[vr.document_type] || vr.document_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{vr.created_at ? new Date(vr.created_at).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text} border ${st.border}`}>
                              <StIcon className="w-3 h-3" /> {st.label}
                            </span>
                            {vr.status === 'rejected' && vr.rejection_reason && (
                              <p className="text-[10px] text-red-500 mt-1 max-w-[140px] truncate" title={vr.rejection_reason}>{vr.rejection_reason}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {actionLoading === vr.id ? (
                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                              ) : vr.status === 'pending' ? (
                                <>
                                  <button onClick={() => handleApprove(vr.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button onClick={() => setRejectVr(vr)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-gray-400">
                                  {vr.reviewer?.fullname ? `by ${vr.reviewer.fullname}` : 'Reviewed'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {reqLastPage > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Page {reqPage} of {reqLastPage}</span>
                  <div className="flex gap-1">
                    <button disabled={reqPage <= 1} onClick={() => setReqPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button disabled={reqPage >= reqLastPage} onClick={() => setReqPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
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
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
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
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
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

      {/* Modals */}
      <DocumentPreviewModal vr={previewVr} onClose={() => setPreviewVr(null)} token={token} />
      <RejectModal vr={rejectVr} onClose={() => setRejectVr(null)} onConfirm={handleReject} loading={!!actionLoading} />
    </div>
  );
}
