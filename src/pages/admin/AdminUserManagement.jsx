import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Search, ChevronLeft, ChevronRight, Filter, Shield, ShieldCheck, ShieldX,
  UserPlus, UserX, Stethoscope, Building2, Crown, Loader2, MoreHorizontal,
  Ban, RotateCcw, ChevronDown,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const ROLES = [
  { key: 'patient',     label: 'Patient',      icon: Users,       color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'doctor',      label: 'Doctor',        icon: Stethoscope, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { key: 'clinicOwner', label: 'Clinic Owner',  icon: Building2,   color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { key: 'superAdmin',  label: 'Super Admin',   icon: Crown,       color: 'bg-amber-50 text-amber-600 border-amber-200' },
];

const getRoleMeta = (roleId) => ROLES.find(r => r.key === roleId) || ROLES[0];

export default function AdminUserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [roleDropdown, setRoleDropdown] = useState(null);

  // Fetch stats on mount
  useEffect(() => {
    adminAPI.userStats().then(res => {
      setStats(res?.data || res);
    }).catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 25, page };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter === 'active') params.is_active = true;
      if (statusFilter === 'suspended') params.is_active = false;
      if (statusFilter === 'verified') params.is_verified = true;
      if (statusFilter === 'unverified') params.is_verified = false;

      const res = await adminAPI.users(params);
      setUsers(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
      setTotal(res?.total || res?.meta?.total || 0);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: newRole } : u));
    } catch { /* keep old value */ }
    setActionLoading(null);
    setRoleDropdown(null);
  };

  const handleSuspendToggle = async (userId, currentlyActive) => {
    setActionLoading(userId);
    try {
      await adminAPI.suspendUser(userId, currentlyActive); // suspend=true if currently active
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentlyActive } : u));
    } catch { /* noop */ }
    setActionLoading(null);
  };

  const hasActiveFilters = roleFilter || statusFilter;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {t('admin.users.title', 'Kullanıcı Yönetimi')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.users.subtitle', 'Tüm kullanıcıları görüntüle, rollerini yönet')}</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {t('admin.users.filters', 'Filtreler')}
          {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-indigo-500 inline-block" />}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: t('admin.users.total', 'Toplam'), value: stats.total, icon: Users, color: 'text-gray-600' },
            { label: t('admin.users.doctors', 'Doktor'), value: stats.doctors, icon: Stethoscope, color: 'text-teal-600' },
            { label: t('admin.users.patients', 'Hasta'), value: stats.patients, icon: UserPlus, color: 'text-blue-600' },
            { label: t('admin.users.clinicOwners', 'Klinik'), value: stats.clinic_owners, icon: Building2, color: 'text-purple-600' },
            { label: t('admin.users.admins', 'Admin'), value: stats.admins, icon: Crown, color: 'text-amber-600' },
            { label: t('admin.users.suspended', 'Askıda'), value: stats.suspended, icon: Ban, color: 'text-red-600' },
            { label: t('admin.users.unverified', 'Onaysız'), value: stats.unverified_doctors, icon: ShieldX, color: 'text-orange-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/60 p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{(s.value || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin.users.searchPlaceholder', 'İsim, e-posta veya telefon ara...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-gray-200/60">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {t('admin.users.role', 'Rol')}
              </label>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500/20 min-w-[160px]"
              >
                <option value="">{t('admin.users.allRoles', 'Tüm Roller')}</option>
                {ROLES.map(r => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {t('admin.users.status', 'Durum')}
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500/20 min-w-[160px]"
              >
                <option value="">{t('admin.users.allStatuses', 'Tümü')}</option>
                <option value="active">{t('admin.users.activeOnly', 'Aktif')}</option>
                <option value="suspended">{t('admin.users.suspendedOnly', 'Askıda')}</option>
                <option value="verified">{t('admin.users.verifiedOnly', 'Doğrulanmış')}</option>
                <option value="unverified">{t('admin.users.unverifiedOnly', 'Doğrulanmamış')}</option>
              </select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => { setRoleFilter(''); setStatusFilter(''); }}
                  className="text-xs text-red-500 hover:text-red-700 underline pb-1.5"
                >
                  {t('admin.users.clearFilters', 'Filtreleri Temizle')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('admin.users.noUsers', 'Kullanıcı bulunamadı')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.users.colUser', 'Kullanıcı')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.users.colEmail', 'E-posta')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.users.colRole', 'Rol')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">{t('admin.users.colVerified', 'Doğrulama')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">{t('admin.users.colStatus', 'Durum')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('admin.users.colClinic', 'Klinik')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-[110px]">{t('admin.users.colRegistered', 'Kayıt')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 w-[120px]">{t('admin.users.colActions', 'İşlemler')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => {
                  const roleMeta = getRoleMeta(u.role_id);
                  const RoleIcon = roleMeta.icon;
                  const isLoadingThis = actionLoading === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/40 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar || '/images/default/default-avatar.svg'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 leading-tight">{u.fullname}</p>
                            {u.mobile && <p className="text-[10px] text-gray-400">{u.mobile}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>

                      {/* Role — with inline dropdown */}
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setRoleDropdown(roleDropdown === u.id ? null : u.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleMeta.color} hover:opacity-80 transition-opacity`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleMeta.label}
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        {roleDropdown === u.id && (
                          <div className="absolute z-20 mt-1 left-4 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1">
                            {ROLES.map(r => (
                              <button
                                key={r.key}
                                onClick={() => handleRoleChange(u.id, r.key)}
                                disabled={r.key === u.role_id || isLoadingThis}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-left transition-colors ${
                                  r.key === u.role_id ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-600'
                                } disabled:opacity-50`}
                              >
                                <r.icon className="w-3.5 h-3.5" />
                                {r.label}
                                {r.key === u.role_id && <span className="ml-auto text-[9px] text-gray-400">current</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Verified */}
                      <td className="px-4 py-3 text-center">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> {t('admin.users.verified', 'Doğrulanmış')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            <ShieldX className="w-3 h-3" /> {t('admin.users.notVerified', 'Bekliyor')}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t('admin.users.active', 'Aktif')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                            <Ban className="w-3 h-3" /> {t('admin.users.suspendedLabel', 'Askıda')}
                          </span>
                        )}
                      </td>

                      {/* Clinic */}
                      <td className="px-4 py-3 text-xs text-gray-500">{u.clinic?.fullname || '—'}</td>

                      {/* Registered */}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        {isLoadingThis ? (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin mx-auto" />
                        ) : u.is_active ? (
                          <button
                            onClick={() => handleSuspendToggle(u.id, true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                            title={t('admin.users.suspend', 'Askıya Al')}
                          >
                            <Ban className="w-3 h-3" /> {t('admin.users.suspend', 'Askıya Al')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendToggle(u.id, false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            title={t('admin.users.reactivate', 'Aktif Et')}
                          >
                            <RotateCcw className="w-3 h-3" /> {t('admin.users.reactivate', 'Aktif Et')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {t('admin.users.pageInfo', 'Sayfa {{page}} / {{lastPage}} — {{total}} kullanıcı', { page, lastPage, total })}
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

      {/* Security notice */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">{t('admin.users.securityTitle', 'Güvenlik & Denetim')}</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              {t('admin.users.securityDesc', 'Tüm rol değişiklikleri ve askıya alma işlemleri Denetim Günlükleri\'nde kayıt altına alınır. Yetkisiz değişikliklere karşı düzenli kontrol yapınız.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
