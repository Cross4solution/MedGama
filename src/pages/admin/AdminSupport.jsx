import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LifeBuoy, Search, ChevronLeft, ChevronRight, X, Send, Paperclip,
  Clock, AlertTriangle, CheckCircle2, Circle, Loader2, MessageSquare,
  User as UserIcon, Tag, RefreshCw, Download, FileText, ArrowUpRight,
  Users, XCircle, Shield,
} from 'lucide-react';
import { supportAPI } from '../../lib/api';

// ─── Config ──────────────────────────────────────────────────
const STATUS_CFG = {
  open:        { label: 'Open',        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Circle },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  icon: Clock },
  resolved:    { label: 'Resolved',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   icon: CheckCircle2 },
  closed:      { label: 'Closed',      bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',   icon: XCircle },
};

const PRIORITY_CFG = {
  low:    { label: 'Low',    bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  medium: { label: 'Medium', bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200' },
  high:   { label: 'High',   bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  urgent: { label: 'Urgent', bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.open;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const c = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

const timeAgo = (date) => {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ─── Ticket Detail Drawer (sidebar-aware) ────────────────────
function TicketDrawer({ ticketId, onClose }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileRef = useRef(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await supportAPI.getTicket(ticketId);
      setTicket(res?.data || res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.messages]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('body', replyBody);
      replyFiles.forEach(f => fd.append('attachments[]', f));
      await supportAPI.reply(ticketId, fd);
      setReplyBody('');
      setReplyFiles([]);
      fetchTicket();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await supportAPI.updateStatus(ticketId, newStatus);
      fetchTicket();
    } catch (err) { console.error(err); }
    finally { setStatusLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 lg:left-64 lg:w-[calc(100%-16rem)] flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {loading ? (
              <div className="h-5 bg-gray-100 rounded w-40 animate-pulse" />
            ) : ticket ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-purple-600 font-semibold">{ticket.ticket_number}</span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-1 truncate">{ticket.subject}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  by {ticket.user?.fullname || 'Unknown'} · {timeAgo(ticket.created_at)}
                  {ticket.category && <> · <Tag className="w-3 h-3 inline" /> {typeof ticket.category?.name === 'string' ? ticket.category.name : (ticket.category?.name_translations?.en || ticket.category?.slug || '')}</>}
                </p>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ticket && (
              <select
                value={ticket.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={statusLoading}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 disabled:opacity-50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
              >
                {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <option key={s} value={s}>{STATUS_CFG[s]?.label}</option>
                ))}
              </select>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : !ticket ? (
            <div className="text-center py-12 text-gray-400 text-sm">Ticket not found</div>
          ) : ticket.messages?.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            ticket.messages?.map((msg) => {
              const isStaff = msg.user?.role_id === 'superAdmin' || msg.user?.role_id === 'saasAdmin';
              return (
                <div key={msg.id} className={`flex gap-3 ${isStaff ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isStaff ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'
                  }`}>
                    {isStaff ? <Shield className="w-3.5 h-3.5" /> : (msg.user?.fullname?.charAt(0) || '?')}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${isStaff ? 'text-right' : ''}`}>
                    <div className={`inline-block rounded-2xl px-4 py-3 text-left ${
                      isStaff ? 'bg-purple-50 border border-purple-100' : 'bg-white border border-gray-200'
                    }`}>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
                      {msg.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.attachments.map((a, i) => (
                            <a key={i} href={a.path?.startsWith('http') ? a.path : `/storage/${a.path}`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 text-[10px] text-purple-600 border border-gray-200 hover:border-purple-300">
                              <FileText className="w-3 h-3" />{a.filename}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] text-gray-400 mt-1 ${isStaff ? 'text-right' : ''}`}>
                      {isStaff ? 'Admin' : msg.user?.fullname} · {timeAgo(msg.created_at)}
                      {msg.is_internal && <span className="ml-1 text-amber-500 font-semibold">[Internal]</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply form */}
        {ticket && ticket.status !== 'closed' && (
          <form onSubmit={handleReply} className="border-t border-gray-100 p-4 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none resize-none"
                  placeholder="Type your admin reply..."
                />
                {replyFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {replyFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-0.5 text-[10px] text-gray-600">
                        {f.name}
                        <button type="button" onClick={() => setReplyFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-300 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={e => setReplyFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
              <button type="submit" disabled={sending || !replyBody.trim()}
                className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Support Page ─────────────────────────────────
export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const perPage = 12;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: perPage };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search.trim()) params.search = search;
      const res = await supportAPI.tickets(params);
      const pg = res?.current_page !== undefined ? res : (res?.data || res);
      setTickets(Array.isArray(pg?.data) ? pg.data : []);
      setTotal(pg?.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter, priorityFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await supportAPI.stats();
      setStats(res?.data || res);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTickets(), fetchStats()]);
    setRefreshing(false);
  };

  // ── Export CSV ──
  const handleExport = () => {
    if (tickets.length === 0) return;
    const headers = ['Ticket ID', 'User', 'Email', 'Subject', 'Category', 'Priority', 'Status', 'Created', 'Last Update'];
    const rows = tickets.map(t => [
      t.ticket_number || t.id,
      t.user?.fullname || '—',
      t.user?.email || '—',
      t.subject,
      typeof t.category?.name === 'string' ? t.category.name : (t.category?.name_translations?.en || t.category?.slug || '—'),
      (PRIORITY_CFG[t.priority]?.label || t.priority),
      (STATUS_CFG[t.status]?.label || t.status),
      t.created_at ? new Date(t.created_at).toLocaleDateString() : '—',
      t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-purple-600" />
            Support Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage incoming support tickets, respond & resolve</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={handleExport} disabled={tickets.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total',       value: stats.total,       icon: LifeBuoy,      bg: 'bg-gray-50',    ic: 'text-gray-500',    bd: 'border-gray-200' },
            { label: 'Open',        value: stats.open,        icon: Circle,        bg: 'bg-emerald-50', ic: 'text-emerald-500', bd: 'border-emerald-200' },
            { label: 'In Progress', value: stats.in_progress, icon: Clock,         bg: 'bg-amber-50',   ic: 'text-amber-500',   bd: 'border-amber-200' },
            { label: 'Resolved',    value: stats.resolved,    icon: CheckCircle2,  bg: 'bg-blue-50',    ic: 'text-blue-500',    bd: 'border-blue-200' },
            { label: 'Closed',      value: stats.closed,      icon: XCircle,       bg: 'bg-gray-50',    ic: 'text-gray-400',    bd: 'border-gray-200' },
            { label: 'Urgent',      value: stats.urgent,      icon: AlertTriangle, bg: 'bg-red-50',     ic: 'text-red-500',     bd: 'border-red-200' },
            { label: 'Unassigned',  value: stats.unassigned,  icon: Users,         bg: 'bg-purple-50',  ic: 'text-purple-500',  bd: 'border-purple-200' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border ${s.bd} p-3 hover:shadow-sm transition-shadow`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.ic}`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{s.value ?? '—'}</p>
              <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
        >
          <option value="">All Statuses</option>
          {['open', 'in_progress', 'resolved', 'closed'].map(s => (
            <option key={s} value={s}>{STATUS_CFG[s]?.label}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
        >
          <option value="">All Priorities</option>
          {['low', 'medium', 'high', 'urgent'].map(p => (
            <option key={p} value={p}>{PRIORITY_CFG[p]?.label}</option>
          ))}
        </select>
        {(statusFilter || priorityFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSearch(''); setPage(1); }}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1">
            Clear filters
          </button>
        )}
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 text-purple-500 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <LifeBuoy className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No tickets found</p>
            <p className="text-xs mt-1 text-gray-400">Adjust your filters or wait for incoming tickets</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Ticket ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Category</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs">Priority</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map(t => {
                  const catName = typeof t.category?.name === 'string'
                    ? t.category.name
                    : (t.category?.name_translations?.en || t.category?.slug || '—');
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className="hover:bg-purple-50/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-purple-600 font-semibold">{t.ticket_number || `#${String(t.id).slice(0, 8)}`}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 text-[10px] font-bold flex-shrink-0">
                            {t.user?.fullname?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{t.user?.fullname || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 truncate">{t.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-900 truncate max-w-[220px] group-hover:text-purple-700 transition-colors">{t.subject}</p>
                        {t.latest_message && (
                          <p className="text-[10px] text-gray-400 truncate max-w-[220px] mt-0.5">
                            {t.latest_message.body?.substring(0, 60)}{t.latest_message.body?.length > 60 ? '...' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-gray-500">{catName}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] text-gray-400">{timeAgo(t.updated_at)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-gray-600 min-w-[60px] text-center">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Drawer */}
      {selectedId && (
        <TicketDrawer
          ticketId={selectedId}
          onClose={() => { setSelectedId(null); fetchTickets(); fetchStats(); }}
        />
      )}
    </div>
  );
}
