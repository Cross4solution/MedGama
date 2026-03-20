import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2,
  Eye, EyeOff, UserX, Search, X, Shield, MessageSquare, Flag,
  RefreshCw, CheckCircle2, XCircle, Clock, Image as ImageIcon,
  ScrollText, Lock,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

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
    reviewed: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle, label: 'Dismissed' },
    hidden:   { bg: 'bg-red-50 text-red-700 border-red-200', icon: EyeOff, label: 'Hidden' },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.bg}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

// ─── Detail Inspection Modal (sidebar-centered) ──────────────
function DetailModal({ report, loading, onClose, onDismiss, onHide, onBan }) {
  if (!report) return null;
  const r = report;
  const post = r.post;
  const isPending = r.admin_status === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center">
                <Flag className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Report Detail</h3>
                <p className="text-[10px] text-gray-500">Report #{r.id?.toString().slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={r.admin_status} />
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Reporter info */}
            <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/50">
              <img src={resolveStorageUrl(r.reporter?.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-200" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700">{r.reporter?.fullname || 'Unknown Reporter'}</p>
                <p className="text-[10px] text-gray-500">Reported on {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</p>
              </div>
              <Flag className="w-4 h-4 text-amber-500 flex-shrink-0" />
            </div>

            {/* Reason */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Report Reason
              </label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700">
                {r.reason || 'No reason provided'}
              </div>
            </div>

            {/* Full post content */}
            {post && (
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1">
                  <ScrollText className="w-3 h-3" /> Reported Post
                </label>
                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3">
                    <img src={resolveStorageUrl(post.author?.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{post.author?.fullname || 'Unknown Author'}</p>
                      <p className="text-[10px] text-gray-400">{post.created_at ? new Date(post.created_at).toLocaleString() : ''}</p>
                    </div>
                    {post.is_hidden && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold border border-red-200">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content || '(no text content)'}</p>
                  {post.media_url && (
                    <div className="mt-3">
                      {(post.post_type === 'image' || post.post_type === 'mixed') ? (
                        <img src={resolveStorageUrl(post.media_url)} alt="Post media" className="w-full max-h-64 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          Media attachment ({post.post_type})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action footer */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
            {isPending ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onDismiss(r.id)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
                >
                  {loading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Dismiss Report
                </button>
                <button
                  onClick={() => onHide(r.id)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                >
                  {loading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Hide Post
                </button>
                {post?.author_id && (
                  <button
                    onClick={() => onBan(r)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm ml-auto"
                  >
                    {loading === post.author_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                    Ban User
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center">This report has been resolved — {r.admin_status === 'reviewed' ? 'Dismissed' : 'Post Hidden'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Action Modal ────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel, danger, loading, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
              {title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{message}</p>
          </div>
          <div className="px-5 py-3.5 flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors disabled:opacity-50 shadow-sm ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: MedStream Moderation — Surgical Center
   ═══════════════════════════════════════════ */
export default function AdminModeration() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const showSuccess = (msg) => { setToastMsg(msg); setShowToast(true); };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 20, page };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.reports(params);
      const data = res?.data?.data || res?.data || [];
      setReports(Array.isArray(data) ? data : []);
      setLastPage(res?.data?.last_page || res?.last_page || res?.meta?.last_page || 1);
      setTotal(res?.data?.total || res?.total || res?.meta?.total || 0);
    } catch {
      setReports([]);
    }
    setLoading(false);
  }, [filter, search, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { setPage(1); }, [filter, search]);

  const handleRefresh = async () => { setRefreshing(true); await fetchReports(); setRefreshing(false); };

  // ── Stats computed from ALL loaded reports (re-counted after every action) ──
  const pendingCount = reports.filter(r => r.admin_status === 'pending').length;
  const reviewedCount = reports.filter(r => r.admin_status === 'reviewed').length;
  const hiddenCount = reports.filter(r => r.admin_status === 'hidden').length;

  // ── Actions ──
  const handleDismiss = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approveReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, admin_status: 'reviewed' } : r));
      showSuccess('Report dismissed — post kept visible');
      if (selectedReport?.id === id) setSelectedReport(p => ({ ...p, admin_status: 'reviewed' }));
    } catch {}
    setActionLoading(null);
  };

  const handleHide = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.removeReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, admin_status: 'hidden', post: r.post ? { ...r.post, is_hidden: true } : null } : r));
      showSuccess('Post hidden from all users');
      if (selectedReport?.id === id) setSelectedReport(p => ({ ...p, admin_status: 'hidden', post: p.post ? { ...p.post, is_hidden: true } : null }));
    } catch {}
    setActionLoading(null);
  };

  const handleBanRequest = (report) => {
    setConfirmAction({
      type: 'suspend',
      id: report.id,
      authorId: report.post?.author_id,
      authorName: report.post?.author?.fullname,
      label: `Suspend "${report.post?.author?.fullname || 'this user'}"? They will lose access to the entire platform.`,
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, id, authorId } = confirmAction;
    setActionLoading(authorId || id);
    try {
      if (type === 'suspend') {
        await adminAPI.suspendUser(authorId, true);
        showSuccess(`User "${confirmAction.authorName}" has been suspended`);
      }
    } catch {}
    setActionLoading(null);
    setConfirmAction(null);
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
    { key: 'pending', label: 'Pending', icon: Clock, count: pendingCount },
    { key: 'reviewed', label: 'Dismissed', icon: CheckCircle, count: reviewedCount },
    { key: 'hidden', label: 'Hidden', icon: EyeOff, count: hiddenCount },
    { key: 'all', label: 'All', icon: Flag, count: null },
  ];

  return (
    <div className="space-y-5">
      <SuccessToast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-purple-600" />
            MedStream Moderation
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Review reported content, take action on violations</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-amber-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">LIVE</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs font-medium text-amber-600 mt-0.5">Pending Review</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700">{reviewedCount}</p>
          <p className="text-xs font-medium text-blue-600 mt-0.5">Dismissed</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <EyeOff className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-700">{hiddenCount}</p>
          <p className="text-xs font-medium text-red-600 mt-0.5">Content Hidden</p>
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
            placeholder="Search by author or reporter name..."
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

      {/* Reports Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Shield className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-600">All Clear</p>
            <p className="text-xs mt-1">No reports matching the current filter</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Reported Content</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[130px]">Author</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[130px]">Reporter</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[140px]">Reason</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[90px]">Time</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[90px]">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map(r => {
                  const isPending = r.admin_status === 'pending';
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`hover:bg-purple-50/20 transition-colors cursor-pointer ${isPending ? '' : 'opacity-70'}`}
                    >
                      {/* Reported Content */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {r.post?.media_url && (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {(r.post.post_type === 'image' || r.post.post_type === 'mixed') ? (
                                <img src={resolveStorageUrl(r.post.media_url)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </div>
                          )}
                          <span className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                            {truncate(r.post?.content, 80)}
                          </span>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={resolveStorageUrl(r.post?.author?.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-900 truncate">{r.post?.author?.fullname || '—'}</span>
                        </div>
                      </td>

                      {/* Reporter */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={resolveStorageUrl(r.reporter?.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-700 truncate">{r.reporter?.fullname || '—'}</span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 truncate block max-w-[130px]">{r.reason || '—'}</span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] text-gray-500" title={r.created_at ? new Date(r.created_at).toLocaleString() : ''}>
                          {timeAgo(r.created_at)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={r.admin_status} />
                      </td>

                      {/* Actions (click-stop for inline buttons) */}
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        {actionLoading === r.id || actionLoading === r.post?.author_id ? (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin mx-auto" />
                        ) : isPending ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDismiss(r.id)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Dismiss report"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleHide(r.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Hide post"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                            {r.post?.author_id && (
                              <button
                                onClick={() => handleBanRequest(r)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Ban user"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Resolved</span>
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
              {reports.length} report(s) shown
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

      {/* Audit Notice */}
      <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50/80 to-blue-50/60 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Moderation Actions Are Audited
            </p>
            <p className="text-xs text-purple-700/80 mt-0.5">
              Every moderation decision (dismiss, hide, ban) is logged in Audit Logs with admin identity, timestamp, and affected post/user (e.g., "Post #123 hidden by Admin [Name]").
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        report={selectedReport}
        loading={actionLoading}
        onClose={() => setSelectedReport(null)}
        onDismiss={handleDismiss}
        onHide={handleHide}
        onBan={handleBanRequest}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'suspend' ? 'Ban User' : 'Confirm Action'}
        message={confirmAction?.label || ''}
        confirmLabel={confirmAction?.type === 'suspend' ? 'Ban User' : 'Confirm'}
        danger={true}
        loading={!!actionLoading}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
