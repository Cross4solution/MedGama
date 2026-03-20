import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle, Trash2, ChevronLeft, ChevronRight, Loader2,
  Eye, EyeOff, UserX, Search, X, Shield, MessageSquare, Flag,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

/* ═══════════════════════════════════════════
   Confirm Action Modal (sidebar-aware)
   ═══════════════════════════════════════════ */
function ConfirmModal({ open, title, message, confirmLabel, danger, loading, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:left-64 lg:w-[calc(100%-16rem)] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{message}</p>
        </div>
        <div className="px-5 py-3.5 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminModeration() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type, id, label, authorId?, authorName? }

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.reports(params);
      setReports(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
    } catch {
      setReports([]);
    }
    setLoading(false);
  }, [filter, search, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { setPage(1); }, [filter, search]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approveReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, admin_status: 'reviewed' } : r));
    } catch {}
    setActionLoading(null);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, id, authorId } = confirmAction;
    setActionLoading(id || authorId);
    try {
      if (type === 'remove') {
        await adminAPI.removeReport(id);
        setReports(prev => prev.map(r => r.id === id ? { ...r, admin_status: 'hidden' } : r));
      } else if (type === 'suspend') {
        await adminAPI.suspendUser(authorId, true);
      }
    } catch {}
    setActionLoading(null);
    setConfirmAction(null);
  };

  // Count stats from current data
  const pendingCount = reports.filter(r => r.admin_status === 'pending').length;
  const reviewedCount = reports.filter(r => r.admin_status === 'reviewed').length;
  const hiddenCount = reports.filter(r => r.admin_status === 'hidden').length;

  const statusBadge = (status) => {
    const map = {
      pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, label: 'Pending' },
      reviewed: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye, label: 'Reviewed' },
      hidden: { bg: 'bg-red-50 text-red-700 border-red-200', icon: EyeOff, label: 'Hidden' },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg}`}>
        <Icon className="w-3 h-3" /> {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Flag className="w-5 h-5 text-purple-600" />
          MedStream Moderation
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Review reported content, take action on violations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs font-medium text-amber-600 mt-0.5">Pending Review</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-blue-700">{reviewedCount}</p>
          <p className="text-xs font-medium text-blue-600 mt-0.5">Dismissed</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-red-700">{hiddenCount}</p>
          <p className="text-xs font-medium text-red-600 mt-0.5">Content Hidden</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'reviewed', label: 'Reviewed' },
            { key: 'hidden', label: 'Hidden' },
            { key: 'all', label: 'All' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reporter or author..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">All Clear</p>
          <p className="text-xs text-gray-400 mt-0.5">No reports found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Reporter info + status */}
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <img src={r.reporter?.avatar || '/images/default/default-avatar.svg'} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-xs font-medium text-gray-600">{r.reporter?.fullname || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">reported</span>
                    {statusBadge(r.admin_status)}
                  </div>

                  {/* Reason */}
                  <div className="flex items-start gap-2 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700"><span className="font-semibold">Reason:</span> {r.reason || '—'}</p>
                  </div>

                  {/* Post content preview */}
                  {r.post && (
                    <div className="mt-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <img src={r.post.author?.avatar || '/images/default/default-avatar.svg'} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                        <span className="text-xs font-semibold text-gray-700">{r.post.author?.fullname || 'Author'}</span>
                        {r.post.is_hidden && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Hidden</span>}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{r.post.content || '(no text content)'}</p>
                      {r.post.media_url && (
                        <div className="mt-2">
                          {r.post.post_type === 'image' ? (
                            <img src={r.post.media_url} alt="Post media" className="w-full max-h-48 object-cover rounded-lg border border-gray-200" />
                          ) : (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Media attachment ({r.post.post_type})
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 mt-2.5">Reported: {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {actionLoading === r.id || actionLoading === r.post?.author_id ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : r.admin_status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title="Dismiss report (keep post visible)"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Safe
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'remove', id: r.id, label: 'Remove this post? It will be hidden from all users.' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                        title="Hide post"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                      {r.post?.author_id && (
                        <button
                          onClick={() => setConfirmAction({
                            type: 'suspend',
                            id: r.id,
                            authorId: r.post.author_id,
                            authorName: r.post.author?.fullname,
                            label: `Suspend "${r.post.author?.fullname || 'this user'}"? They will lose access to the platform.`,
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
                          title="Suspend post author"
                        >
                          <UserX className="w-3.5 h-3.5" /> Ban User
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Resolved</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">Page {page} of {lastPage}</span>
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
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'suspend' ? 'Suspend User' : 'Remove Post'}
        message={confirmAction?.label || ''}
        confirmLabel={confirmAction?.type === 'suspend' ? 'Suspend' : 'Remove'}
        danger={true}
        loading={!!actionLoading}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
