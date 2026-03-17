import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollText, Search, ChevronLeft, ChevronRight, Filter, Calendar,
  User, Shield, Settings2, FileText, Trash2, Key, UserPlus, Eye,
  Plus, Edit3, XCircle, Activity, Clock, TrendingUp, Database,
  Stethoscope, Building2, Receipt, LifeBuoy, Star, UserCheck, X,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const ACTION_ICONS = {
  created: Plus,
  updated: Edit3,
  deleted: Trash2,
  'system_setting.updated': Settings2,
  'user.created': UserPlus,
  'user.updated': Edit3,
  'user.deleted': Trash2,
  'user.password_changed': Key,
  'user.suspended': Shield,
  'user.reactivated': UserPlus,
  'appointment.created': Plus,
  'appointment.updated': Edit3,
  'appointment.deleted': XCircle,
  'patientrecord.created': FileText,
  'patientrecord.updated': Edit3,
  'patientrecord.deleted': Trash2,
  'patientdocument.created': FileText,
  'patientdocument.updated': Edit3,
  'patientdocument.deleted': Trash2,
  'doctorprofile.updated': Stethoscope,
  'clinic.updated': Building2,
  'invoice.created': Receipt,
  'invoice.updated': Receipt,
  'ticket.created': LifeBuoy,
  'ticket.updated': LifeBuoy,
  'doctorreview.created': Star,
  'verificationrequest.created': UserCheck,
  'verificationrequest.updated': UserCheck,
  'document.uploaded': FileText,
  'document.deleted': Trash2,
  'document.viewed': Eye,
  'doctor.verified': Shield,
  'doctor.revoked': Shield,
};

const getEventColor = (action) => {
  if (!action) return 'bg-gray-50 text-gray-600 border-gray-200';
  const lower = action.toLowerCase();
  if (lower.includes('deleted') || lower.includes('suspended') || lower.includes('revoked'))
    return 'bg-red-50 text-red-600 border-red-200';
  if (lower.includes('created') || lower.includes('verified') || lower.includes('reactivated'))
    return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (lower.includes('updated') || lower.includes('password'))
    return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-purple-50 text-purple-600 border-purple-200';
};

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
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

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

      const res = await adminAPI.auditLogs(params);
      setLogs(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
      setTotal(res?.total || res?.meta?.total || 0);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }, [page, search, actionFilter, resourceFilter, selectedUserId, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, actionFilter, resourceFilter, selectedUserId, dateFrom, dateTo]);

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

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) setShowUserDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const hasActiveFilters = actionFilter || resourceFilter || selectedUserId || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-purple-600" />
            {t('admin.auditLogs.title', 'Sistem Günlükleri')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.auditLogs.subtitle', 'Kim, neyi, ne zaman değiştirdi — anlık takip')}</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {t('admin.auditLogs.filters', 'Filtreler')}
          {hasActiveFilters && (
            <span className="ml-1 w-2 h-2 rounded-full bg-purple-500 inline-block" />
          )}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-purple-500" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLogs.totalLogs', 'Toplam Kayıt')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{(stats.total || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/60 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLogs.today', 'Bugün')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{(stats.today || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/60 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLogs.thisWeek', 'Bu Hafta')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{(stats.this_week || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/60 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t('admin.auditLogs.filtered', 'Filtrelenen')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin.auditLogs.searchPlaceholder', 'İşlem, açıklama veya kaynak ara...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-gray-200/60">
            {/* Action Type */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {t('admin.auditLogs.actionType', 'İşlem Tipi')}
              </label>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-purple-500/20 min-w-[160px]"
              >
                <option value="">{t('admin.auditLogs.allActions', 'Tümü')}</option>
                <option value="created">{t('admin.auditLogs.created', 'Oluşturma')}</option>
                <option value="updated">{t('admin.auditLogs.updated', 'Güncelleme')}</option>
                <option value="deleted">{t('admin.auditLogs.deleted', 'Silme')}</option>
                <option value="system_setting">{t('admin.auditLogs.systemSettings', 'Sistem Ayarları')}</option>
                <option value="password">{t('admin.auditLogs.passwordChange', 'Şifre Değişikliği')}</option>
              </select>
            </div>

            {/* Resource Type */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {t('admin.auditLogs.resourceType', 'Kaynak Tipi')}
              </label>
              <select
                value={resourceFilter}
                onChange={e => setResourceFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-purple-500/20 min-w-[160px]"
              >
                <option value="">{t('admin.auditLogs.allResources', 'Tümü')}</option>
                {RESOURCE_TYPES.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>

            {/* User Search */}
            <div ref={userSearchRef} className="relative">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {t('admin.auditLogs.user', 'Kullanıcı')}
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={e => handleUserSearch(e.target.value)}
                  placeholder={t('admin.auditLogs.searchUser', 'İsim veya e-posta...')}
                  className="pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20 min-w-[180px]"
                />
                {selectedUserId && (
                  <button onClick={clearUser} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </div>
              {showUserDropdown && userResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {userResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                    >
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

            {/* Date Range */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {t('admin.auditLogs.dateFrom', 'Başlangıç')}
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {t('admin.auditLogs.dateTo', 'Bitiş')}
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20" />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => { setActionFilter(''); setResourceFilter(''); clearUser(); setDateFrom(''); setDateTo(''); }}
                  className="text-xs text-red-500 hover:text-red-700 underline pb-1.5"
                >
                  {t('admin.auditLogs.clearFilters', 'Filtreleri Temizle')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Table — Kim / Ne / Ne Zaman */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('admin.auditLogs.noLogs', 'Kayıt bulunamadı')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('admin.auditLogs.noLogsHint', 'Sistem olayları burada görüntülenecek')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-[180px]">
                    {t('admin.auditLogs.colWhat', 'Ne Yapıldı')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    {t('admin.auditLogs.colWho', 'Kim')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    {t('admin.auditLogs.colResource', 'Kaynak')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    {t('admin.auditLogs.colDescription', 'Açıklama')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-[120px]">
                    {t('admin.auditLogs.colIp', 'IP')}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-[150px]">
                    {t('admin.auditLogs.colWhen', 'Ne Zaman')}
                  </th>
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
                        className={`hover:bg-gray-50/40 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50/60' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
                            <ActionIcon className="w-3 h-3" />
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={log.user.avatar || '/images/default/default-avatar.svg'}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover border border-gray-200"
                              />
                              <div>
                                <p className="text-xs font-medium text-gray-900 leading-tight">{log.user.fullname}</p>
                                <p className="text-[10px] text-gray-400">{log.user.role_id}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <Settings2 className="w-3 h-3 text-gray-400" />
                              </div>
                              <span className="text-xs text-gray-400">{t('admin.auditLogs.system', 'Sistem')}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                            {log.resource_type}
                          </code>
                          {log.resource_id && (
                            <p className="text-[9px] text-gray-400 mt-0.5 font-mono truncate max-w-[120px]">{log.resource_id}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[250px] truncate">
                          {log.description || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] text-gray-500 font-mono">{log.ip_address || '—'}</code>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatTimestamp(log.created_at)}
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
                                      <XCircle className="w-3.5 h-3.5" /> {t('admin.auditLogs.oldValues', 'Eski Değerler')}
                                    </p>
                                    <pre className="bg-red-50 text-red-800 rounded-lg p-3 overflow-x-auto border border-red-200 text-[11px] font-mono whitespace-pre-wrap">
                                      {JSON.stringify(log.old_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_values && (
                                  <div>
                                    <p className="font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                                      <Plus className="w-3.5 h-3.5" /> {t('admin.auditLogs.newValues', 'Yeni Değerler')}
                                    </p>
                                    <pre className="bg-emerald-50 text-emerald-800 rounded-lg p-3 overflow-x-auto border border-emerald-200 text-[11px] font-mono whitespace-pre-wrap">
                                      {JSON.stringify(log.new_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">{t('admin.auditLogs.noDetails', 'Detay bilgisi yok')}</p>
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
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {t('admin.auditLogs.pageInfo', 'Sayfa {{page}} / {{lastPage}} — {{total}} kayıt', { page, lastPage, total })}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GDPR Notice */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">{t('admin.auditLogs.gdprTitle', 'GDPR Uyumluluk — Madde 30')}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {t('admin.auditLogs.gdprDesc', 'Tüm işleme faaliyetleri GDPR Madde 30 gereksinimlerine uygun olarak kaydedilmektedir. Denetim günlükleri en az 6 yıl saklanır ve değiştirilemez veya silinemez.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
