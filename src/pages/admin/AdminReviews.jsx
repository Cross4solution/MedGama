import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, CheckCircle, XCircle, EyeOff, Clock, Loader2, Search,
  ChevronLeft, ChevronRight, MessageSquare, Shield, X, RefreshCw,
  CheckCircle2, Lock, User, Stethoscope, ScrollText, AlertTriangle,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

// ─── Rejection reasons dropdown options ──────────────────────
const REJECTION_REASONS = [
  { value: '', label: 'Select a reason…' },
  { value: 'profanity', label: 'Profanity / Offensive Language' },
  { value: 'spam', label: 'Spam / Advertising' },
  { value: 'misleading', label: 'Misleading Information' },
  { value: 'irrelevant', label: 'Irrelevant / Off-topic' },
  { value: 'privacy', label: 'Privacy Violation' },
  { value: 'duplicate', label: 'Duplicate Review' },
  { value: 'other', label: 'Other' },
];

// ─── Success Toast ───────────────────────────────────────────
function SuccessToast({ message, show, onClose }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-emerald-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
    approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Approved' },
    rejected: { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
    hidden:   { bg: 'bg-gray-100 text-gray-600 border-gray-200', icon: EyeOff, label: 'Hidden' },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.bg}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

// ─── Star display ────────────────────────────────────────────
function StarDisplay({ rating, size = 'sm' }) {
  const w = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${w} ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
      <span className={`ml-1 font-bold ${size === 'lg' ? 'text-sm text-gray-700' : 'text-[10px] text-gray-500'}`}>{rating}/5</span>
    </div>
  );
}

// ─── Detail "Judge View" Modal (sidebar-centered) ────────────
function JudgeModal({ review, loading, onClose, onApprove, onReject, onHide }) {
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!review) return null;
  const patient = review.patient || {};
  const doctor = review.doctor || {};
  const isPending = review.moderation_status === 'pending';

  const handleReject = () => {
    const note = [rejectReason && REJECTION_REASONS.find(r => r.value === rejectReason)?.label, rejectNote].filter(Boolean).join(' — ');
    onReject(review.id, note || null);
    setShowRejectForm(false);
    setRejectReason('');
    setRejectNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Review Inspection</h3>
                <p className="text-[10px] text-gray-500">Judge View — Review #{review.id?.toString().slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={review.moderation_status} />
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Patient → Doctor */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 flex-1">
                <img src={resolveStorageUrl(patient.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-gray-200" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{patient.fullname || 'Patient'}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1"><User className="w-2.5 h-2.5" /> Patient</p>
                </div>
              </div>
              <div className="text-gray-300 text-lg">→</div>
              <div className="flex items-center gap-2 flex-1">
                <img src={resolveStorageUrl(doctor.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-teal-200" />
                <div>
                  <p className="text-xs font-semibold text-teal-700">{doctor.fullname || 'Doctor'}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1"><Stethoscope className="w-2.5 h-2.5" /> Doctor</p>
                </div>
              </div>
            </div>

            {/* Rating + treatment type */}
            <div className="flex items-center gap-3">
              <StarDisplay rating={review.rating} size="lg" />
              {review.treatment_type && (
                <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">{review.treatment_type}</span>
              )}
              <span className="text-[10px] text-gray-400 ml-auto">{review.created_at ? new Date(review.created_at).toLocaleString() : '—'}</span>
            </div>

            {/* Full review text */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                <ScrollText className="w-3 h-3" /> Full Review
              </label>
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {review.comment || '(no comment)'}
              </div>
            </div>

            {/* Doctor response */}
            {review.doctor_response && (
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" /> Doctor's Response
                </label>
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/60 text-xs text-gray-700 leading-relaxed">
                  {review.doctor_response}
                </div>
              </div>
            )}

            {/* Moderation note (if exists) */}
            {review.moderation_note && (
              <div className="flex items-start gap-2 p-3 bg-red-50/50 rounded-xl border border-red-200/50 text-xs text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Moderation Note:</span> {review.moderation_note}
                  {review.moderator && <span className="text-red-500 ml-1">— by {review.moderator.fullname}</span>}
                </div>
              </div>
            )}

            {/* Reject form (shown when clicking Reject) */}
            {showRejectForm && (
              <div className="p-4 bg-red-50/30 rounded-xl border border-red-200/50 space-y-3">
                <label className="text-xs font-semibold text-red-700 block">Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-red-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                >
                  {REJECTION_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Additional note (optional)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-red-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowRejectForm(false); setRejectReason(''); setRejectNote(''); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleReject} disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm">
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <XCircle className="w-3.5 h-3.5" /> Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action footer */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
            {isPending && !showRejectForm ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onApprove(review.id)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve Review
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => onHide(review.id)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50 ml-auto"
                >
                  {loading === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Hide
                </button>
              </div>
            ) : !showRejectForm ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 italic">
                  This review has been {review.moderation_status === 'approved' ? 'approved' : review.moderation_status === 'rejected' ? 'rejected' : 'hidden'}
                </p>
                {review.moderation_status === 'hidden' && (
                  <button onClick={() => onApprove(review.id)} disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5" /> Restore
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: Review Moderation — Security & Transparency
   ═══════════════════════════════════════════ */
export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const showSuccess = (msg) => { setToastMsg(msg); setShowToast(true); };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 20, page };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.reviews(params);
      const data = res?.data || res;
      setReviews(data?.data || []);
      setLastPage(data?.last_page || 1);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }, [filter, page, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.reviewStats();
      setStats(res?.data || res || {});
    } catch {}
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [filter, search]);

  const handleRefresh = async () => { setRefreshing(true); await fetchReviews(); await fetchStats(); setRefreshing(false); };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approveReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, moderation_status: 'approved' } : r));
      fetchStats();
      showSuccess('Review approved — now visible on doctor profile');
      if (selectedReview?.id === id) setSelectedReview(p => ({ ...p, moderation_status: 'approved' }));
    } catch {}
    setActionLoading(null);
  };

  const handleReject = async (id, note) => {
    setActionLoading(id);
    try {
      await adminAPI.rejectReview(id, note);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, moderation_status: 'rejected', moderation_note: note } : r));
      fetchStats();
      showSuccess('Review rejected');
      if (selectedReview?.id === id) setSelectedReview(p => ({ ...p, moderation_status: 'rejected', moderation_note: note }));
    } catch {}
    setActionLoading(null);
  };

  const handleHide = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.hideReview(id, null);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, moderation_status: 'hidden' } : r));
      fetchStats();
      showSuccess('Review hidden');
      if (selectedReview?.id === id) setSelectedReview(p => ({ ...p, moderation_status: 'hidden' }));
    } catch {}
    setActionLoading(null);
  };

  // ── Helpers ──
  const truncate = (str, len = 60) => str?.length > len ? str.slice(0, len) + '…' : str || '—';
  const timeAgo = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const FILTERS = [
    { key: 'pending', label: 'Pending', icon: Clock, count: stats.pending || 0, color: 'amber' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, count: stats.approved || 0, color: 'emerald' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, count: stats.rejected || 0, color: 'red' },
    { key: 'hidden', label: 'Hidden', icon: EyeOff, count: stats.hidden || 0, color: 'gray' },
    { key: 'all', label: 'All', icon: MessageSquare, count: null, color: 'purple' },
  ];

  return (
    <div className="px-4 lg:px-6 space-y-5">
      <SuccessToast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Review Moderation
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Approve, reject, or hide patient reviews — all actions audited</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-amber-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">LIVE</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.pending || 0}</p>
          <p className="text-xs font-medium text-amber-600 mt-0.5">Pending</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.approved || 0}</p>
          <p className="text-xs font-medium text-emerald-600 mt-0.5">Approved</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.rejected || 0}</p>
          <p className="text-xs font-medium text-red-600 mt-0.5">Rejected</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <EyeOff className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-600">{stats.hidden || 0}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Hidden</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <f.icon className={`w-3.5 h-3.5 ${filter === f.key ? 'text-purple-600' : ''}`} />
              {f.label}
              {f.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f.key ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by doctor or patient name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-600">No reviews found</p>
            <p className="text-xs mt-1">{search ? 'Try a different search term' : 'No reviews matching this filter'}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[150px]">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[150px]">Target</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[110px]">Rating</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Comment</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[80px]">Date</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[90px]">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map(review => {
                  const patient = review.patient || {};
                  const doctor = review.doctor || {};
                  const isPending = review.moderation_status === 'pending';

                  return (
                    <tr
                      key={review.id}
                      onClick={() => setSelectedReview(review)}
                      className={`hover:bg-purple-50/20 transition-colors cursor-pointer ${isPending ? '' : 'opacity-70'}`}
                    >
                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={resolveStorageUrl(patient.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                          <span className="text-xs font-medium text-gray-900 truncate">{patient.fullname || '—'}</span>
                        </div>
                      </td>

                      {/* Target (Doctor) */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          </div>
                          <span className="text-xs font-medium text-teal-700 truncate">{doctor.fullname || '—'}</span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3 text-center">
                        <StarDisplay rating={review.rating} />
                      </td>

                      {/* Comment */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{truncate(review.comment, 80)}</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] text-gray-500" title={review.created_at ? new Date(review.created_at).toLocaleString() : ''}>
                          {timeAgo(review.created_at)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={review.moderation_status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        {actionLoading === review.id ? (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin mx-auto" />
                        ) : isPending ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleApprove(review.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Approve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setSelectedReview(review); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Reject">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleHide(review.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Hide">
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : review.moderation_status === 'hidden' ? (
                          <button onClick={() => handleApprove(review.id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Restore">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer + Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-xs text-gray-500">
              {reviews.length} review(s) shown
              {search && <span className="ml-1 text-purple-600 font-medium">— filtered by "{search}"</span>}
            </span>
            {lastPage > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Page {page}/{lastPage}</span>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail Notice */}
      <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50/80 to-blue-50/60 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Review Actions Are Audited
            </p>
            <p className="text-xs text-purple-700/80 mt-0.5">
              Every review decision is logged: "Admin [Name] approved/rejected Review #ID" with timestamp and reason. Reviews start as <strong>Pending</strong> and are invisible on doctor profiles until approved.
            </p>
          </div>
        </div>
      </div>

      {/* Judge View Modal */}
      <JudgeModal
        review={selectedReview}
        loading={actionLoading}
        onClose={() => setSelectedReview(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onHide={handleHide}
      />
    </div>
  );
}
