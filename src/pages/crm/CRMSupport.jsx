import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HelpCircle, Plus, Search, Filter, ChevronLeft, ChevronRight, X,
  Send, Paperclip, Clock, AlertTriangle, CheckCircle2, Circle,
  Loader2, MessageSquare, User as UserIcon, Tag, ArrowUpRight,
  LifeBuoy, ShieldCheck, Users, BarChart3, FileText, ChevronDown, Upload,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supportAPI } from '../../lib/api';
import CRMModal, { ModalLabel, ModalInput, ModalSelect, ModalTextarea, ModalPrimaryButton, ModalCancelButton } from '../../components/crm/CRMModal';

// ─── Helpers ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-500 border-gray-200',    icon: X },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'bg-gray-50 text-gray-600 border-gray-200' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  high:   { label: 'High',   color: 'bg-orange-50 text-orange-600 border-orange-200' },
  urgent: { label: 'Urgent', color: 'bg-red-50 text-red-600 border-red-200' },
};

const StatusBadge = ({ status, t }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {t(`crm.support.status_${status}`, cfg.label)}
    </span>
  );
};

const PriorityBadge = ({ priority, t }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
      {t(`crm.support.priority_${priority}`, cfg.label)}
    </span>
  );
};

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ─── Create Ticket Modal ─────────────────────────────────────
const CreateTicketModal = ({ onClose, onCreated, t }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ subject: '', body: '', category_id: '', priority: 'medium' });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    supportAPI.categories().then(res => {
      const d = res?.data || res;
      setCategories(Array.isArray(d) ? d : []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.subject.trim() || !form.body.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('body', form.body);
      if (form.category_id) fd.append('category_id', form.category_id);
      fd.append('priority', form.priority);
      files.forEach((f) => fd.append('attachments[]', f));
      await supportAPI.createTicket(fd);
      onCreated();
      onClose();
    } catch (err) {
      console.error('Create ticket error:', err);
      const msg = err?.message || err?.errors?.subject?.[0] || t('crm.support.createError', 'Failed to create ticket. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles(prev => [...prev, ...dropped]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <CRMModal
      isOpen={true}
      onClose={onClose}
      title={t('crm.support.createTicket', 'Create Support Ticket')}
      subtitle={t('crm.support.createTicketDesc', 'Describe your issue and our team will help you')}
      icon={LifeBuoy}
      maxWidth="max-w-[500px]"
      footer={
        <>
          <ModalCancelButton onClick={onClose}>{t('common.cancel', 'Cancel')}</ModalCancelButton>
          <ModalPrimaryButton onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('crm.support.submit', 'Submit Ticket')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="px-7 py-7 space-y-6">
        {/* Subject */}
        <div>
          <ModalLabel required icon={Tag}>{t('crm.support.subject', 'Subject')}</ModalLabel>
          <ModalInput
            type="text"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder={t('crm.support.subjectPlaceholder', 'Briefly describe your issue...')}
          />
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <ModalLabel icon={Filter}>{t('crm.support.category', 'Category')}</ModalLabel>
            <ModalSelect value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">{t('crm.support.selectCategory', 'Select...')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {typeof c.name === 'string' ? c.name : (c.name_translations?.en || c.name_translations?.tr || c.slug)}
                </option>
              ))}
            </ModalSelect>
          </div>
          <div>
            <ModalLabel icon={AlertTriangle}>{t('crm.support.priority', 'Priority')}</ModalLabel>
            <ModalSelect value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {['low', 'medium', 'high', 'urgent'].map(p => (
                <option key={p} value={p}>{t(`crm.support.priority_${p}`, p.charAt(0).toUpperCase() + p.slice(1))}</option>
              ))}
            </ModalSelect>
          </div>
        </div>

        {/* Description */}
        <div>
          <ModalLabel required icon={MessageSquare}>{t('crm.support.description', 'Description')}</ModalLabel>
          <ModalTextarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={4}
            placeholder={t('crm.support.descriptionPlaceholder', 'Provide details about your issue...')}
          />
        </div>

        {/* Drag & Drop File Upload */}
        <div>
          <ModalLabel icon={Paperclip}>{t('crm.support.attachFiles', 'Attachments')}</ModalLabel>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              dragOver ? 'border-[#0A6E6F] bg-[#0A6E6F]/5' : 'border-gray-200 hover:border-[#0A6E6F]/40 hover:bg-[#0A6E6F]/[0.02]'
            }`}
          >
            <Upload className={`w-7 h-7 ${dragOver ? 'text-[#0A6E6F]' : 'text-gray-300'}`} />
            <p className={`text-xs text-center font-medium ${dragOver ? 'text-[#0A6E6F]' : 'text-gray-400'}`}>
              {t('crm.support.dragDrop', 'Drag & drop files here or click to browse')}
            </p>
            <p className="text-[10px] text-gray-400">PNG, JPG, PDF, DOC (max 10MB)</p>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-gray-600">
                  <FileText className="w-3 h-3 text-gray-400" />{f.name}
                  <button type="button" onClick={() => removeFile(i)} className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </CRMModal>
  );
};

// ─── Ticket Detail / Conversation ────────────────────────────
const TicketDetail = ({ ticketId, onBack, isAdmin, t }) => {
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
    } catch (err) { console.error(err); } finally { setSending(false); }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await supportAPI.updateStatus(ticketId, newStatus);
      fetchTicket();
    } catch (err) { console.error(err); } finally { setStatusLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-teal-500 animate-spin" /></div>;
  if (!ticket) return <div className="text-center py-12 text-gray-400">{t('crm.support.notFound', 'Ticket not found')}</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-1 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-teal-600 font-medium">{ticket.ticket_number}</span>
            <StatusBadge status={ticket.status} t={t} />
            <PriorityBadge priority={ticket.priority} t={t} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-1">{ticket.subject}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('crm.support.by', 'by')} {ticket.user?.fullname} · {timeAgo(ticket.created_at)}
            {ticket.assignee && <> · {t('crm.support.assignedTo', 'Assigned to')} <strong>{ticket.assignee.fullname}</strong></>}
          </p>
        </div>
        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <select value={ticket.status} onChange={e => handleStatusChange(e.target.value)} disabled={statusLoading}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 disabled:opacity-50">
              {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                <option key={s} value={s}>{t(`crm.support.status_${s}`, STATUS_CONFIG[s]?.label)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="max-h-[50vh] overflow-y-auto p-5 space-y-4">
          {ticket.messages?.map((msg) => {
            const isStaff = msg.user?.role_id === 'superAdmin' || msg.user?.role_id === 'saasAdmin';
            return (
              <div key={msg.id} className={`flex gap-3 ${isStaff ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isStaff ? 'bg-violet-100 text-violet-600' : 'bg-teal-100 text-teal-600'}`}>
                  {msg.user?.fullname?.charAt(0) || '?'}
                </div>
                <div className={`flex-1 max-w-[80%] ${isStaff ? 'text-right' : ''}`}>
                  <div className={`inline-block rounded-2xl px-4 py-3 ${isStaff ? 'bg-violet-50 border border-violet-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
                    {msg.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.attachments.map((a, i) => (
                          <a key={i} href={a.path?.startsWith('http') ? a.path : `/storage/${a.path}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-white rounded-lg px-2 py-1 text-[10px] text-teal-600 border border-gray-200 hover:border-teal-300">
                            <FileText className="w-3 h-3" />{a.filename}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${isStaff ? 'text-right' : ''}`}>
                    {msg.user?.fullname} · {timeAgo(msg.created_at)}
                    {msg.is_internal && <span className="ml-1 text-amber-500 font-semibold">[Internal]</span>}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply form */}
        {ticket.status !== 'closed' && (
          <form onSubmit={handleReply} className="border-t border-gray-100 p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  placeholder={t('crm.support.replyPlaceholder', 'Type your reply...')} />
                {replyFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {replyFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-0.5 text-[10px] text-gray-600">
                        {f.name}<button type="button" onClick={() => setReplyFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-teal-500 hover:border-teal-300 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={e => setReplyFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
              <button type="submit" disabled={sending || !replyBody.trim()}
                className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CRMSupport = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'superAdmin' || user?.role_id === 'superAdmin' || user?.role === 'saasAdmin' || user?.role_id === 'saasAdmin';

  // State
  const [view, setView] = useState('list'); // list | detail | create
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const perPage = 10;

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: perPage };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await supportAPI.tickets(params);
      // Interceptor already unwraps response.data → res IS the paginated object
      const paginated = res?.current_page !== undefined ? res : (res?.data || res);
      setTickets(Array.isArray(paginated?.data) ? paginated.data : []);
      setTotal(paginated?.total || 0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, statusFilter, priorityFilter, searchQuery]);

  // Fetch stats (admin)
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await supportAPI.stats();
      setStats(res?.data || res);
    } catch (err) { console.error(err); }
  }, [isAdmin]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const totalPages = Math.ceil(total / perPage);

  const openTicket = (id) => { setSelectedTicketId(id); setView('detail'); };

  if (view === 'detail' && selectedTicketId) {
    return (
      <div className="space-y-6">
        <TicketDetail ticketId={selectedTicketId} onBack={() => { setView('list'); fetchTickets(); }} isAdmin={isAdmin} t={t} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.support.title', 'Help & Support')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.support.subtitle', 'Create and manage support tickets')}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          {t('crm.support.newTicket', 'New Ticket')}
        </button>
      </div>

      {/* Admin Stats */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: t('crm.support.totalTickets', 'Total'), value: stats.total, icon: LifeBuoy, bg: 'bg-gray-50', iconColor: 'text-gray-500', border: 'border-gray-200' },
            { label: t('crm.support.status_open', 'Open'), value: stats.open, icon: Circle, bg: 'bg-blue-50', iconColor: 'text-blue-500', border: 'border-blue-200' },
            { label: t('crm.support.status_in_progress', 'In Progress'), value: stats.in_progress, icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-500', border: 'border-amber-200' },
            { label: t('crm.support.status_resolved', 'Resolved'), value: stats.resolved, icon: CheckCircle2, bg: 'bg-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-200' },
            { label: t('crm.support.status_closed', 'Closed'), value: stats.closed, icon: X, bg: 'bg-gray-50', iconColor: 'text-gray-400', border: 'border-gray-200' },
            { label: t('crm.support.urgent', 'Urgent'), value: stats.urgent, icon: AlertTriangle, bg: 'bg-red-50', iconColor: 'text-red-500', border: 'border-red-200' },
            { label: t('crm.support.unassigned', 'Unassigned'), value: stats.unassigned, icon: Users, bg: 'bg-violet-50', iconColor: 'text-violet-500', border: 'border-violet-200' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border ${s.border} p-3 hover:shadow-sm transition-shadow`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder={t('crm.support.searchTickets', 'Search tickets...')} value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-full" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600">
          <option value="">{t('crm.support.allStatuses', 'All Statuses')}</option>
          {['open', 'in_progress', 'resolved', 'closed'].map(s => (
            <option key={s} value={s}>{t(`crm.support.status_${s}`, STATUS_CONFIG[s]?.label)}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600">
          <option value="">{t('crm.support.allPriorities', 'All Priorities')}</option>
          {['low', 'medium', 'high', 'urgent'].map(p => (
            <option key={p} value={p}>{t(`crm.support.priority_${p}`, PRIORITY_CONFIG[p]?.label)}</option>
          ))}
        </select>
      </div>

      {/* Ticket List */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-7 h-7 text-teal-500 animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <LifeBuoy className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium">{t('crm.support.noTickets', 'No tickets found')}</p>
            <p className="text-xs mt-1">{t('crm.support.noTicketsDesc', 'Create a new ticket to get started')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tickets.map(ticket => (
              <button key={ticket.id} onClick={() => openTicket(ticket.id)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    ticket.priority === 'urgent' ? 'bg-red-50' : ticket.priority === 'high' ? 'bg-orange-50' : 'bg-gray-50'
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${
                      ticket.priority === 'urgent' ? 'text-red-500' : ticket.priority === 'high' ? 'text-orange-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-teal-600">{ticket.ticket_number}</span>
                      <StatusBadge status={ticket.status} t={t} />
                      <PriorityBadge priority={ticket.priority} t={t} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1 truncate group-hover:text-teal-700 transition-colors">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                      {isAdmin && ticket.user && <span>{ticket.user.fullname}</span>}
                      {ticket.category && <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" />{typeof ticket.category?.name === 'string' ? ticket.category.name : (ticket.category?.name_translations?.en || ticket.category?.slug)}</span>}
                      <span>{timeAgo(ticket.created_at)}</span>
                      {ticket.latest_message && <span className="truncate max-w-[200px]">{ticket.latest_message.body?.substring(0, 50)}{ticket.latest_message.body?.length > 50 ? '...' : ''}</span>}
                      {ticket.assignee && <span className="flex items-center gap-0.5"><UserIcon className="w-3 h-3" />{ticket.assignee.fullname}</span>}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">{t('common.showing', 'Showing')} {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${p === page ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={() => { fetchTickets(); fetchStats(); }} t={t} />}
    </div>
  );
};

export default CRMSupport;
