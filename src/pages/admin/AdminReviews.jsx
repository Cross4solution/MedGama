import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, CheckCircle, XCircle, EyeOff, Clock, Loader2, Search,
  ChevronLeft, ChevronRight, MessageSquare, Shield,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const STATUS_TABS = [
  { key: 'all', label: 'All Reviews' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'hidden', label: 'Hidden' },
];

const STATUS_BADGE = {
  approved: { icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  pending:  { icon: Clock,       color: 'text-amber-700 bg-amber-50 border-amber-200' },
  rejected: { icon: XCircle,     color: 'text-red-700 bg-red-50 border-red-200' },
  hidden:   { icon: EyeOff,      color: 'text-gray-700 bg-gray-100 border-gray-200' },
};

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  // Reject / hide modal
  const [modalAction, setModalAction] = useState(null); // { type: 'reject'|'hide', reviewId }
  const [modalNote, setModalNote] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page };
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

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approveReview(id);
      fetchReviews();
      fetchStats();
    } catch {}
    setActionLoading(null);
  };

  const handleRejectOrHide = async () => {
    if (!modalAction) return;
    setActionLoading(modalAction.reviewId);
    try {
      if (modalAction.type === 'reject') {
        await adminAPI.rejectReview(modalAction.reviewId, modalNote || null);
      } else {
        await adminAPI.hideReview(modalAction.reviewId, modalNote || null);
      }
      setModalAction(null);
      setModalNote('');
      fetchReviews();
      fetchStats();
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" /> Review Moderation
        </h1>
        <p className="text-sm text-gray-500 mt-1">Approve, reject, or hide patient reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] text-gray-500 font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending || 0}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] text-gray-500 font-medium">Approved</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved || 0}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-[11px] text-gray-500 font-medium">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-gray-500" />
            <span className="text-[11px] text-gray-500 font-medium">Hidden</span>
          </div>
          <p className="text-2xl font-bold text-gray-600 mt-1">{stats.hidden || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === tab.key ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {tab.label}
              {tab.key !== 'all' && stats[tab.key] > 0 && (
                <span className="ml-1.5 bg-white/80 px-1.5 py-0.5 rounded-full text-[9px]">{stats[tab.key]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by doctor or patient..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
          />
        </div>
      </div>

      {/* Review Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map(review => {
              const doctor = review.doctor || {};
              const patient = review.patient || {};
              const badge = STATUS_BADGE[review.moderation_status] || STATUS_BADGE.pending;
              const BadgeIcon = badge.icon;

              return (
                <div key={review.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left — Review content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-gray-800">{patient.fullname || 'Patient'}</span>
                        <span className="text-[10px] text-gray-400">→</span>
                        <span className="text-xs font-semibold text-teal-700">{doctor.fullname || 'Doctor'}</span>
                        <StarDisplay rating={review.rating} />
                        {review.treatment_type && (
                          <span className="text-[9px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">{review.treatment_type}</span>
                        )}
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${badge.color}`}>
                          <BadgeIcon className="w-2.5 h-2.5" /> {review.moderation_status}
                        </span>
                      </div>

                      {review.comment && <p className="text-xs text-gray-600 leading-relaxed mt-1">{review.comment}</p>}

                      {review.doctor_response && (
                        <div className="mt-2 ml-2 pl-2 border-l-2 border-teal-200 text-[11px] text-gray-500">
                          <span className="font-bold text-teal-700">Doctor:</span> {review.doctor_response}
                        </div>
                      )}

                      {review.moderation_note && (
                        <p className="mt-1.5 text-[10px] text-red-500 italic">Note: {review.moderation_note}</p>
                      )}

                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {new Date(review.created_at).toLocaleString()}
                        {review.moderator && <span> · Moderated by {review.moderator.fullname}</span>}
                      </p>
                    </div>

                    {/* Right — Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {review.moderation_status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(review.id)} disabled={actionLoading === review.id}
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold hover:bg-emerald-100 disabled:opacity-40 flex items-center gap-1">
                            {actionLoading === review.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                          </button>
                          <button onClick={() => setModalAction({ type: 'reject', reviewId: review.id })}
                            className="px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-100 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                      {(review.moderation_status === 'approved' || review.moderation_status === 'pending') && (
                        <button onClick={() => setModalAction({ type: 'hide', reviewId: review.id })}
                          className="px-2.5 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-[10px] font-bold hover:bg-gray-100 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Hide
                        </button>
                      )}
                      {review.moderation_status === 'hidden' && (
                        <button onClick={() => handleApprove(review.id)} disabled={actionLoading === review.id}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold hover:bg-emerald-100 disabled:opacity-40 flex items-center gap-1">
                          {actionLoading === review.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-xs text-gray-500 px-2 py-1.5">{page}/{lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Reject / Hide Modal */}
      {modalAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setModalAction(null); setModalNote(''); }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {modalAction.type === 'reject' ? 'Reject Review' : 'Hide Review'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modalAction.type === 'reject'
                ? 'This review will be permanently rejected and hidden from public view.'
                : 'This review will be temporarily hidden. You can restore it later.'}
            </p>
            <textarea
              value={modalNote}
              onChange={e => setModalNote(e.target.value)}
              placeholder="Add a moderation note (optional)..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none outline-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setModalAction(null); setModalNote(''); }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleRejectOrHide} disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                  modalAction.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                } disabled:opacity-40`}>
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {modalAction.type === 'reject' ? 'Reject' : 'Hide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
