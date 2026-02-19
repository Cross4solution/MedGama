import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Trash2, ChevronLeft, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { adminAPI } from '../../lib/api';

export default function AdminModeration() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page };
      if (filter !== 'all') params.status = filter;
      const res = await adminAPI.reports(params);
      setReports(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
    } catch {
      setReports([]);
    }
    setLoading(false);
  }, [filter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approveReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, admin_status: 'reviewed' } : r));
    } catch {}
    setActionLoading(null);
  };

  const handleRemove = async (id) => {
    if (!window.confirm('This will hide the post. Are you sure?')) return;
    setActionLoading(id);
    try {
      await adminAPI.removeReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, admin_status: 'hidden' } : r));
    } catch {}
    setActionLoading(null);
  };

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
      <div>
        <h1 className="text-xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review reported MedStream posts</p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
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

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No reports found. All clear!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Reporter info */}
                  <div className="flex items-center gap-2 mb-2">
                    <img src={r.reporter?.avatar || '/images/default/default-avatar.svg'} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-xs font-medium text-gray-600">{r.reporter?.fullname || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">reported</span>
                    {statusBadge(r.admin_status)}
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-gray-800 font-medium mb-1">Reason: <span className="font-normal text-gray-600">{r.reason || '—'}</span></p>

                  {/* Post content preview */}
                  {r.post && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <img src={r.post.author?.avatar || '/images/default/default-avatar.svg'} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-gray-700">{r.post.author?.fullname || 'Author'}</span>
                        {r.post.is_hidden && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Hidden</span>}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3">{r.post.content || '(no text content)'}</p>
                      {r.post.media_url && (
                        <p className="text-[10px] text-gray-400 mt-1">📎 Has media attachment ({r.post.post_type})</p>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 mt-2">Reported: {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {actionLoading === r.id ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : r.admin_status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                        title="Dismiss report (keep post visible)"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>
                      <button
                        onClick={() => handleRemove(r.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                        title="Hide post and mark report as actioned"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Post
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Resolved</span>
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
    </div>
  );
}
