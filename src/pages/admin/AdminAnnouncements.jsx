import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Plus, Pencil, Trash2, Loader2, Search, ChevronLeft, ChevronRight,
  AlertTriangle, Info, CheckCircle, AlertCircle, X, Eye, EyeOff, Link2, Calendar,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const TYPE_CONFIG = {
  info:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    icon: Info,         label: 'Info' },
  warning: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: AlertTriangle, label: 'Warning' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle,   label: 'Success' },
  error:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: AlertCircle,   label: 'Error' },
};

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'clinicOwner', label: 'Clinic Owner' },
  { value: 'superAdmin', label: 'Super Admin' },
  { value: 'saasAdmin', label: 'SaaS Admin' },
];

/* ═══════════════════════════════════════════
   Announcement Form Modal
   ═══════════════════════════════════════════ */
function AnnouncementFormModal({ announcement, onClose, onSave, loading }) {
  const isEdit = !!announcement?.id;
  const [form, setForm] = useState({
    title: announcement?.title || '',
    body: announcement?.body || '',
    type: announcement?.type || 'info',
    target_roles: announcement?.target_roles || [],
    is_active: announcement?.is_active ?? true,
    is_dismissible: announcement?.is_dismissible ?? true,
    starts_at: announcement?.starts_at ? announcement.starts_at.slice(0, 16) : '',
    ends_at: announcement?.ends_at ? announcement.ends_at.slice(0, 16) : '',
    link_url: announcement?.link_url || '',
    link_label: announcement?.link_label || '',
    priority: announcement?.priority ?? 0,
  });

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter(r => r !== role)
        : [...f.target_roles, role],
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    const payload = { ...form };
    if (!payload.starts_at) payload.starts_at = null;
    if (!payload.ends_at) payload.ends_at = null;
    if (!payload.link_url) { payload.link_url = null; payload.link_label = null; }
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-600" />
              {isEdit ? 'Edit Announcement' : 'New Announcement'}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => handleChange('title', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                placeholder="Announcement title..." />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Body *</label>
              <textarea value={form.body} onChange={e => handleChange('body', e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all resize-none"
                placeholder="Announcement message..." />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <div className="flex gap-2">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => handleChange('type', key)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${form.type === key ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Roles */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Target Roles <span className="text-gray-400 font-normal">(empty = all users)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_OPTIONS.map(r => (
                  <button key={r.value} onClick={() => toggleRole(r.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${form.target_roles.includes(r.value) ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Starts At</label>
                <input type="datetime-local" value={form.starts_at} onChange={e => handleChange('starts_at', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ends At</label>
                <input type="datetime-local" value={form.ends_at} onChange={e => handleChange('ends_at', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all" />
              </div>
            </div>

            {/* Link */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Link URL</label>
                <input type="text" value={form.link_url} onChange={e => handleChange('link_url', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Link Label</label>
                <input type="text" value={form.link_label} onChange={e => handleChange('link_label', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                  placeholder="Learn more" />
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => handleChange('is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-xs text-gray-700 font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_dismissible} onChange={e => handleChange('is_dismissible', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-xs text-gray-700 font-medium">Dismissible</span>
              </label>
              <div className="flex items-center gap-1.5 ml-auto">
                <label className="text-xs text-gray-600 font-medium">Priority</label>
                <input type="number" min={0} max={100} value={form.priority} onChange={e => handleChange('priority', parseInt(e.target.value) || 0)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
              </div>
            </div>
          </div>

          <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.body.trim()}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Delete Confirm Modal
   ═══════════════════════════════════════════ */
function DeleteConfirmModal({ announcement, onClose, onConfirm, loading }) {
  if (!announcement) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Delete Announcement
            </h3>
            <p className="text-xs text-gray-500 mt-1">Delete "<strong>{announcement.title}</strong>"? This cannot be undone.</p>
          </div>
          <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => onConfirm(announcement.id)} disabled={loading}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Delete
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
export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all | active | inactive
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [formModal, setFormModal] = useState(null); // null | {} (new) | {...} (edit)
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { per_page: 15, page };
      if (filter === 'active') params.is_active = true;
      if (filter === 'inactive') params.is_active = false;
      const res = await adminAPI.announcements(params);
      setAnnouncements(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
    } catch (err) {
      setAnnouncements([]);
      setError(err?.message || 'Failed to load announcements.');
    }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleSave = async (data) => {
    setActionLoading(true);
    try {
      if (formModal?.id) {
        await adminAPI.updateAnnouncement(formModal.id, data);
      } else {
        await adminAPI.createAnnouncement(data);
      }
      setFormModal(null);
      fetchAnnouncements();
    } catch {}
    setActionLoading(false);
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await adminAPI.deleteAnnouncement(id);
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch {}
    setActionLoading(false);
  };

  const handleToggleActive = async (ann) => {
    try {
      await adminAPI.updateAnnouncement(ann.id, { is_active: !ann.is_active });
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_active: !ann.is_active } : a));
    } catch {}
  };

  return (
    <div className="px-4 lg:px-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage platform-wide announcements</p>
        </div>
        <button onClick={() => setFormModal({})}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'inactive', label: 'Inactive' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{error}</p>
          <button onClick={fetchAnnouncements} className="text-xs font-medium underline hover:text-red-800">Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No announcements found.</p>
          <button onClick={() => setFormModal({})} className="mt-3 text-sm text-purple-600 font-medium hover:underline">Create your first announcement</button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            const isScheduled = ann.starts_at || ann.ends_at;

            return (
              <div key={ann.id} className={`rounded-2xl border shadow-sm overflow-hidden ${ann.is_active ? 'bg-white border-gray-200/60' : 'bg-gray-50 border-gray-200/40 opacity-70'}`}>
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.border} border`}>
                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border} border`}>{cfg.label}</span>
                      {!ann.is_active && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.body}</p>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Target roles */}
                      {ann.target_roles?.length > 0 ? (
                        <span className="text-[10px] text-gray-400">Roles: {ann.target_roles.join(', ')}</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">All users</span>
                      )}

                      {/* Schedule */}
                      {isScheduled && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ann.starts_at && new Date(ann.starts_at).toLocaleDateString()}
                          {ann.starts_at && ann.ends_at && ' — '}
                          {ann.ends_at && new Date(ann.ends_at).toLocaleDateString()}
                        </span>
                      )}

                      {/* Link */}
                      {ann.link_url && (
                        <span className="text-[10px] text-purple-500 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> {ann.link_label || 'Link'}
                        </span>
                      )}

                      {/* Priority */}
                      {ann.priority > 0 && (
                        <span className="text-[10px] text-gray-400">Priority: {ann.priority}</span>
                      )}

                      {/* Created by */}
                      {ann.creator?.fullname && (
                        <span className="text-[10px] text-gray-400">by {ann.creator.fullname}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleActive(ann)}
                      className={`p-1.5 rounded-lg border transition-colors ${ann.is_active ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                      title={ann.is_active ? 'Deactivate' : 'Activate'}>
                      {ann.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setFormModal(ann)} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(ann)} className="p-1.5 rounded-lg text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">Page {page} of {lastPage}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formModal !== null && (
        <AnnouncementFormModal
          announcement={formModal}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
          loading={actionLoading}
        />
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        announcement={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}
