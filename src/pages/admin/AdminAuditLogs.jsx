import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollText, Search, ChevronLeft, ChevronRight, Filter, Calendar,
  User, Shield, Settings2, FileText, Trash2, Key, UserPlus, Eye,
  Plus, Edit3, XCircle, Activity, Clock, TrendingUp, Database,
  Stethoscope, Building2, Receipt, LifeBuoy, Star, UserCheck, X,
  Download, RefreshCw, Lock, CreditCard, ChevronDown,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

// ─── Action icon map ─────────────────────────────────────────
const ACTION_ICONS = {
  created: Plus, updated: Edit3, deleted: Trash2,
  'system_setting.updated': Settings2,
  'user.created': UserPlus, 'user.updated': Edit3, 'user.deleted': Trash2,
  'user.password_changed': Key, 'user.suspended': Shield, 'user.reactivated': UserPlus,
  'appointment.created': Plus, 'appointment.updated': Edit3, 'appointment.deleted': XCircle,
  'patientrecord.created': FileText, 'patientrecord.updated': Edit3, 'patientrecord.deleted': Trash2,
  'patientdocument.created': FileText, 'patientdocument.updated': Edit3, 'patientdocument.deleted': Trash2,
  'doctorprofile.updated': Stethoscope, 'clinic.updated': Building2,
  'invoice.created': Receipt, 'invoice.updated': Receipt,
  'ticket.created': LifeBuoy, 'ticket.updated': LifeBuoy,
  'doctorreview.created': Star,
  'verificationrequest.created': UserCheck, 'verificationrequest.updated': UserCheck,
  'document.uploaded': FileText, 'document.deleted': Trash2, 'document.viewed': Eye,
  'doctor.verified': Shield, 'doctor.revoked': Shield,
};

const getEventColor = (action) => {
  if (!action) return 'bg-gray-50 text-gray-600 border-gray-200';
  const l = action.toLowerCase();
  if (l.includes('deleted') || l.includes('suspended') || l.includes('revoked'))
    return 'bg-red-50 text-red-600 border-red-200';
  if (l.includes('created') || l.includes('verified') || l.includes('reactivated'))
    return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (l.includes('updated') || l.includes('password'))
    return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-purple-50 text-purple-600 border-purple-200';
};

// ─── Category filter definitions ─────────────────────────────
const CATEGORIES = [
  {
    key: 'security',
    label: 'Security',
    icon: Lock,
    bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', activeBg: 'bg-red-100',
    actions: ['password_changed', 'suspended', 'reactivated', 'deleted'],
    resources: ['User'],
  },
  {
    key: 'verification',
    label: 'Verification',
    icon: UserCheck,
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', activeBg: 'bg-emerald-100',
    actions: ['verified', 'revoked'],
    resources: ['VerificationRequest', 'DoctorProfile'],
  },
  {
    key: 'medical',
    label: 'Medical',
    icon: Stethoscope,
    bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', activeBg: 'bg-blue-100',
    actions: [],
    resources: ['Appointment', 'PatientRecord', 'PatientDocument'],
  },
  {
    key: 'financial',
    label: 'Financial',
    icon: CreditCard,
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', activeBg: 'bg-amber-100',
    actions: [],
    resources: ['Invoice', 'Subscription'],
  },
  {
    key: 'system',
    label: 'System',
    icon: Settings2,
    bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', activeBg: 'bg-purple-100',
    actions: ['system_setting'],
    resources: ['SystemSetting', 'Clinic', 'DoctorReview', 'Ticket'],
  },
];

const RESOURCE_TYPES = [
  'User', 'Appointment', 'PatientRecord', 'PatientDocument',
  'DoctorProfile', 'Ticket', 'Invoice', 'Clinic',
  'DoctorReview', 'VerificationRequest', 'SystemSetting',
];

export default function AdminAuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // User search state
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUserLabel, setSelectedUserLabel] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef(null);
  const userSearchTimer = useRef(null);

  // Fetch stats on mount
  useEffect(() => {
    adminAPI.auditLogStats().then(res => setStats(res)).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 25, page };
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource_type = resourceFilter;
      if (selectedUserId) params.user_id = selectedUserId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      // Category filter → map to resource_type(s) or action keyword
      if (categoryFilter) {
        const cat = CATEGORIES.find(c => c.key === categoryFilter);
        if (cat) {
          if (cat.resources.length) params.resource_type = cat.resources.join(',');
          if (cat.actions.length && !actionFilter) params.action = cat.actions.join(',');
        }
      }

      const res = await adminAPI.auditLogs(params);
      setLogs(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
      setTotal(res?.total || res?.meta?.total || 0);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }, [page, search, actionFilter, resourceFilter, selectedUserId, dateFrom, dateTo, categoryFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, actionFilter, resourceFilter, selectedUserId, dateFrom, dateTo, categoryFilter]);

  // User search with debounce
  const handleUserSearch = (val) => {
    setUserQuery(val);
    if (userSearchTimer.current) clearTimeout(userSearchTimer.current);
    if (val.trim().length < 2) { setUserResults([]); setShowUserDropdown(false); return; }
    userSearchTimer.current = setTimeout(async () => {
      try {
        const res = await adminAPI.searchUsers(val.trim());
        setUserResults(res || []);
        setShowUserDropdown(true);
      } catch { setUserResults([]); }
    }, 300);
  };

  const selectUser = (u) => {
    setSelectedUserId(u.id);
    setSelectedUserLabel(u.fullname);
    setUserQuery(u.fullname);
    setShowUserDropdown(false);
  };

  const clearUser = () => {
    setSelectedUserId('');
    setSelectedUserLabel('');
    setUserQuery('');
    setUserResults([]);
  };

  const clearAllFilters = () => {
    setActionFilter(''); setResourceFilter(''); clearUser();
    setDateFrom(''); setDateTo(''); setCategoryFilter(''); setSearch('');
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) setShowUserDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    adminAPI.auditLogStats().then(res => setStats(res)).catch(() => {});
    setRefreshing(false);
  };

  // ── Export CSV (GDPR Art. 30 audit trail) ──
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Resource Type', 'Resource ID', 'Description', 'IP Address', 'User Agent'];
    const rows = logs.map(log => [
      log.created_at ? new Date(log.created_at).toISOString() : '',
      log.user?.fullname || 'System',
      log.user?.role_id || 'system',
      log.action || '',
      log.resource_type || '',
      log.resource_id || '',
      log.description || '',
      log.ip_address || '',
      log.user_agent || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action) => {
    if (!action) return ScrollText;
    return ACTION_ICONS[action] || ACTION_ICONS[action.split('.').pop()] || ScrollText;
  };

  const formatAction = (action) => {
    if (!action) return '';
    return action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t('admin.auditLogs.justNow', 'Just now');
    if (diffMin < 60) return `${diffMin}m ${t('admin.auditLogs.ago', 'ago')}`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ${t('admin.auditLogs.ago', 'ago')}`;
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatTimestampFull = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
  };

  const hasActiveFilters = actionFilter || resourceFilter || selectedUserId || dateFrom || dateTo || categoryFilter || search;

  return (
    <div className="px-4 lg:px-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-purple-600" />
            {t('admin.auditLogs.title', 'Audit & Security Center')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.auditLogs.subtitle', 'Who changed what, when — real-time compliance tracking')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={handleExportCSV} disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shadow-sm ${
              showFilters || hasActiveFilters
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-purple-500" />}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('admin.auditLogs.totalLogs', 'Total Records'), value: stats.total, icon: Database, ic: 'text-purple-500', bd: 'border-purple-200' },
            { label: t('admin.auditLogs.today', 'Today'), value: stats.today, icon: Clock, ic: 'text-blue-500', bd: 'border-blue-200' },
            { label: t('admin.auditLogs.thisWeek', 'This Week'), value: stats.this_week, icon: TrendingUp, ic: 'text-emerald-500', bd: 'border-emerald-200' },
            { label: t('admin.auditLogs.filtered', 'Filtered'), value: total, icon: Activity, ic: 'text-amber-500', bd: 'border-amber-200' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl border ${s.bd} p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.ic}`} />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{(s.value || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Chips + Search */}
      <div className="space-y-3">
        {/* Category quick-filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryFilter('')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              !categoryFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => {
            const active = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(active ? '' : cat.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? `${cat.activeBg} ${cat.text} ${cat.border}`
                    : `bg-white text-gray-600 border-gray-200 hover:${cat.bg}`
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search + Date Range inline */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.auditLogs.searchPlaceholder', 'Search action, description, resource...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date range — always visible */}
          <div className="flex items-center gap-1.5">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none w-36" />
            <span className="text-gray-400 text-xs">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none w-36" />
          </div>

          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-gray-200/60 shadow-sm">
          {/* Action Type */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Action Type</label>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-purple-500/20 outline-none min-w-[160px]">
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="system_setting">System Settings</option>
              <option value="password">Password Change</option>
            </select>
          </div>

          {/* Resource Type */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Resource Type</label>
            <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-purple-500/20 outline-none min-w-[160px]">
              <option value="">All Resources</option>
              {RESOURCE_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
            </select>
          </div>

          {/* User Search */}
          <div ref={userSearchRef} className="relative">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">User</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={userQuery} onChange={e => handleUserSearch(e.target.value)}
                placeholder="Name or email..."
                className="pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20 outline-none min-w-[180px]" />
              {selectedUserId && (
                <button onClick={clearUser} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                </button>
              )}
            </div>
            {showUserDropdown && userResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {userResults.map(u => (
                  <button key={u.id} onClick={() => selectUser(u)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
                    <img src={u.avatar || '/images/default/default-avatar.svg'} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">{u.fullname}</p>
                      <p className="text-[10px] text-gray-400">{u.email} · {u.role_id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Table — Timestamp | User | Action | Resource | IP | Details */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ScrollText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">{t('admin.auditLogs.noLogs', 'No audit logs found')}</p>
            <p className="text-xs mt-1">{t('admin.auditLogs.noLogsHint', 'System events will appear here')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[160px]">Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Resource</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[110px]">IP Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => {
                  const ActionIcon = getActionIcon(log.action);
                  const color = getEventColor(log.action);
                  const isExpanded = expandedRow === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`hover:bg-purple-50/20 transition-colors cursor-pointer ${isExpanded ? 'bg-purple-50/30' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      >
                        {/* Timestamp */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-700 font-medium whitespace-nowrap">{formatTimestamp(log.created_at)}</p>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5">{formatTimestampFull(log.created_at)}</p>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 text-[10px] font-bold flex-shrink-0">
                                {log.user.fullname?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-900 leading-tight">{log.user.fullname}</p>
                                <p className="text-[10px] text-gray-400">{log.user.role_id}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Settings2 className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                              <span className="text-xs text-gray-400">System</span>
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${color}`}>
                            <ActionIcon className="w-3 h-3" />
                            {formatAction(log.action)}
                          </span>
                        </td>

                        {/* Resource */}
                        <td className="px-4 py-3">
                          <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                            {log.resource_type}
                          </code>
                          {log.resource_id && (
                            <p className="text-[9px] text-gray-400 mt-0.5 font-mono truncate max-w-[140px]">{log.resource_id}</p>
                          )}
                        </td>

                        {/* IP */}
                        <td className="px-4 py-3">
                          <code className="text-[10px] text-gray-500 font-mono">{log.ip_address || '—'}</code>
                        </td>

                        {/* Details */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-600 max-w-[220px] truncate">{log.description || '—'}</p>
                          {(log.old_values || log.new_values) && (
                            <span className="text-[9px] text-purple-500 font-medium mt-0.5 inline-flex items-center gap-0.5">
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              {isExpanded ? 'Collapse' : 'View changes'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded detail — old vs new values diff */}
                      {isExpanded && (
                        <tr className="bg-gray-50/80">
                          <td colSpan={6} className="px-6 py-4">
                            {(log.old_values || log.new_values) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {log.old_values && (
                                  <div>
                                    <p className="font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                                      <XCircle className="w-3.5 h-3.5" /> {t('admin.auditLogs.oldValues', 'Previous Values')}
                                    </p>
                                    <pre className="bg-red-50 text-red-800 rounded-lg p-3 overflow-x-auto border border-red-200 text-[11px] font-mono whitespace-pre-wrap">
                                      {JSON.stringify(log.old_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_values && (
                                  <div>
                                    <p className="font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                                      <Plus className="w-3.5 h-3.5" /> {t('admin.auditLogs.newValues', 'New Values')}
                                    </p>
                                    <pre className="bg-emerald-50 text-emerald-800 rounded-lg p-3 overflow-x-auto border border-emerald-200 text-[11px] font-mono whitespace-pre-wrap">
                                      {JSON.stringify(log.new_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">{t('admin.auditLogs.noDetails', 'No detail information available')}</p>
                            )}
                            {log.user_agent && (
                              <p className="text-[10px] text-gray-400 mt-3 truncate">
                                <span className="font-medium">User-Agent:</span> {log.user_agent}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <span className="text-xs text-gray-500">
                Page {page} / {lastPage} — {total.toLocaleString()} records
              </span>
              <div className="flex items-center gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-600 min-w-[50px] text-center">{page}</span>
                <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GDPR Immutable Notice — polished banner */}
      <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50/80 to-blue-50/60 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {t('admin.auditLogs.gdprTitle', 'GDPR Article 30 — Immutable Audit Trail')}
            </p>
            <p className="text-xs text-purple-700/80 mt-0.5">
              {t('admin.auditLogs.gdprDesc', 'All processing activities are recorded in compliance with GDPR Article 30. Audit logs are retained for a minimum of 6 years and cannot be modified or deleted.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
