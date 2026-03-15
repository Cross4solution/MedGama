import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Search, ChevronLeft, ChevronRight, Filter, Calendar,
  User, Shield, Settings2, FileText, Trash2, Key, UserPlus, Eye,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const ACTION_ICONS = {
  'system_setting.updated': Settings2,
  'user.password_changed': Key,
  'user.suspended': Shield,
  'user.reactivated': UserPlus,
  'patient_record.deleted': Trash2,
  'patient_record.created': FileText,
  'doctor.verified': Shield,
  'doctor.revoked': Shield,
  'document.uploaded': FileText,
  'document.deleted': Trash2,
  'document.viewed': Eye,
};

const ACTION_COLORS = {
  'system_setting.updated': 'bg-purple-50 text-purple-600 border-purple-200',
  'user.password_changed': 'bg-amber-50 text-amber-600 border-amber-200',
  'user.suspended': 'bg-red-50 text-red-600 border-red-200',
  'user.reactivated': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'patient_record.deleted': 'bg-red-50 text-red-600 border-red-200',
  'doctor.verified': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'doctor.revoked': 'bg-red-50 text-red-600 border-red-200',
};

const DEFAULT_COLOR = 'bg-gray-50 text-gray-600 border-gray-200';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 25, page };
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
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
  }, [page, search, actionFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, actionFilter, dateFrom, dateTo]);

  const getActionIcon = (action) => {
    const Icon = ACTION_ICONS[action] || ScrollText;
    return Icon;
  };

  const getActionColor = (action) => {
    return ACTION_COLORS[action] || DEFAULT_COLOR;
  };

  const formatAction = (action) => {
    return action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-purple-600" />
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track critical data changes and system events</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {total} entries
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              showFilters ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search actions, descriptions, resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-gray-200/60">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Action Type</label>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-purple-500/20 min-w-[180px]"
              >
                <option value="">All Actions</option>
                <option value="system_setting">System Settings</option>
                <option value="user">User Actions</option>
                <option value="doctor">Doctor Verification</option>
                <option value="patient_record">Patient Records</option>
                <option value="document">Documents</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Date From</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Date To</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
            {(actionFilter || dateFrom || dateTo) && (
              <div className="flex items-end">
                <button
                  onClick={() => { setActionFilter(''); setDateFrom(''); setDateTo(''); }}
                  className="text-xs text-red-500 hover:text-red-700 underline pb-1.5"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No audit logs found</p>
          <p className="text-xs text-gray-400 mt-1">System events will appear here as they occur</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-[200px]">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Resource</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-[140px]">IP Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-[160px]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => {
                  const ActionIcon = getActionIcon(log.action);
                  const color = getActionColor(log.action);
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
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div>
                                <p className="text-xs font-medium text-gray-900">{log.user.fullname}</p>
                                <p className="text-[10px] text-gray-400">{log.user.role_id}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">System</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                            {log.resource_type}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[250px] truncate">
                          {log.description || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] text-gray-500 font-mono">{log.ip_address || '—'}</code>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (log.old_values || log.new_values) && (
                        <tr className="bg-gray-50/80">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {log.old_values && (
                                <div>
                                  <p className="font-semibold text-gray-600 mb-1.5">Old Values</p>
                                  <pre className="bg-red-50 text-red-800 rounded-lg p-3 overflow-x-auto border border-red-200 text-[11px] font-mono">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <p className="font-semibold text-gray-600 mb-1.5">New Values</p>
                                  <pre className="bg-emerald-50 text-emerald-800 rounded-lg p-3 overflow-x-auto border border-emerald-200 text-[11px] font-mono">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                            {log.user_agent && (
                              <p className="text-[10px] text-gray-400 mt-2 truncate">UA: {log.user_agent}</p>
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
                Page {page} of {lastPage} — {total} total entries
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
            <p className="text-sm font-semibold text-blue-800">GDPR Compliance — Article 30</p>
            <p className="text-xs text-blue-600 mt-0.5">
              All processing activities are logged per GDPR Art. 30 requirements. 
              Audit logs are retained for a minimum of 6 years and cannot be modified or deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
