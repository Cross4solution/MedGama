import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Search, ChevronLeft, ChevronRight, Shield, ShieldCheck, ShieldX,
  UserPlus, Stethoscope, Building2, Crown, Loader2,
  Ban, RotateCcw, ChevronDown, KeyRound, Eye, X, AlertTriangle, ExternalLink,
  Calendar, FileText, MessageSquare, Download, Activity, Mail, Phone, Clock,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

const ROLES = [
  { key: 'patient',     label: 'Patient',      icon: Users,       color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'doctor',      label: 'Doctor',        icon: Stethoscope, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { key: 'clinicOwner', label: 'Clinic Owner',  icon: Building2,   color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { key: 'superAdmin',  label: 'Super Admin',   icon: Crown,       color: 'bg-amber-50 text-amber-600 border-amber-200' },
];

const TABS = [
  { key: '',            label: 'All Users',  icon: Users },
  { key: 'doctor',      label: 'Doctors',    icon: Stethoscope },
  { key: 'patient',     label: 'Patients',   icon: UserPlus },
  { key: 'clinicOwner', label: 'Clinics',    icon: Building2 },
];

const getRoleMeta = (roleId) => ROLES.find(r => r.key === roleId) || ROLES[0];

/* ═══════════════════════════════════════════
   Password Reset Modal
   ═══════════════════════════════════════════ */
function PasswordResetModal({ user: targetUser, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await adminAPI.resetPassword(targetUser.id, password);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" /> Reset Password
          </h3>
          <p className="text-xs text-gray-500 mt-1">Set a new password for <strong>{targetUser.fullname}</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters..."
              minLength={8}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />} Reset
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   User Detail Drawer
   ═══════════════════════════════════════════ */
function UserDetailDrawer({ user: u, onClose }) {
  if (!u) return null;
  const roleMeta = getRoleMeta(u.role_id);
  const RoleIcon = roleMeta.icon;
  const isDoctor = u.role_id === 'doctor';
  const isClinicOwner = u.role_id === 'clinicOwner';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Eye className="w-4 h-4 text-purple-600" /> User 360</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Avatar + Name + Role Badge */}
          <div className="text-center">
            <img src={resolveStorageUrl(u.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-gray-100 shadow-sm" />
            <h4 className="text-lg font-bold text-gray-900 mt-3">{u.fullname}</h4>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleMeta.color} mt-1.5`}>
              <RoleIcon className="w-3 h-3" /> {roleMeta.label}
            </span>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-700 truncate">{u.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-700">{u.mobile || '—'}</span>
            </div>
            {(isDoctor || isClinicOwner) && u.clinic?.fullname && (
              <div className="flex items-center gap-2.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-700">{u.clinic.fullname}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">Registered {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl p-3 border ${u.is_active ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${u.is_active ? 'text-emerald-600' : 'text-red-600'}`}>Account</p>
              <p className={`text-sm font-bold ${u.is_active ? 'text-emerald-800' : 'text-red-800'}`}>{u.is_active ? 'Active' : 'Suspended'}</p>
            </div>
            <div className={`rounded-xl p-3 border ${u.is_verified ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${u.is_verified ? 'text-emerald-600' : 'text-amber-600'}`}>Verification</p>
              <p className={`text-sm font-bold ${u.is_verified ? 'text-emerald-800' : 'text-amber-800'}`}>{u.is_verified ? 'Verified' : 'Unverified'}</p>
            </div>
            <div className="rounded-xl p-3 border border-gray-200 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Last Login</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</p>
            </div>
            <div className="rounded-xl p-3 border border-gray-200 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Role</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">{roleMeta.label}</p>
            </div>
          </div>

          {/* Doctor-specific: Verification Docs + Appointments */}
          {isDoctor && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doctor Details</p>
              <Link
                to={`/admin/verification/review?id=${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">Verification Documents</p>
                  <p className="text-[10px] text-gray-400">View submitted certificates & ID</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500" />
              </Link>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">Appointments</p>
                  <p className="text-[10px] text-gray-400">{u.appointments_count ?? '—'} total</p>
                </div>
              </div>
            </div>
          )}

          {/* Clinic Owner specific */}
          {isClinicOwner && u.clinic && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clinic Info</p>
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-900">{u.clinic.fullname}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{u.clinic.address || 'No address'}</p>
                {u.clinic.phone && <p className="text-[10px] text-gray-400 mt-0.5">{u.clinic.phone}</p>}
              </div>
            </div>
          )}

          {/* Activity Summary */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activity</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-xl border border-gray-200 bg-white">
                <MessageSquare className="w-4 h-4 text-teal-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900 mt-1">{u.posts_count ?? '—'}</p>
                <p className="text-[9px] text-gray-400">Posts</p>
              </div>
              <div className="text-center p-2.5 rounded-xl border border-gray-200 bg-white">
                <Calendar className="w-4 h-4 text-indigo-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900 mt-1">{u.appointments_count ?? '—'}</p>
                <p className="text-[9px] text-gray-400">Appts</p>
              </div>
              <div className="text-center p-2.5 rounded-xl border border-gray-200 bg-white">
                <Activity className="w-4 h-4 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900 mt-1">{u.reviews_count ?? '—'}</p>
                <p className="text-[9px] text-gray-400">Reviews</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-300 text-center pt-2 border-t border-gray-100">ID: {u.id}</div>
        </div>
      </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 text-xs font-medium">{label}</span>
      <span className="text-gray-900 text-xs font-semibold text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function AdminUserManagement() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [roleDropdown, setRoleDropdown] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const dropdownRef = useRef(null);

  // Sync activeTab with URL query param
  useEffect(() => {
    const urlTab = searchParams.get('tab') || '';
    if (urlTab !== activeTab) setActiveTab(urlTab);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab) setSearchParams({ tab });
    else setSearchParams({});
  };

  // Close role dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setRoleDropdown(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch stats
  useEffect(() => {
    adminAPI.userStats().then(res => {
      setStats(res?.data || res);
    }).catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { per_page: 25, page };
      if (search.trim()) params.search = search.trim();
      if (activeTab) params.role = activeTab;
      if (statusFilter === 'active') params.is_active = true;
      if (statusFilter === 'suspended') params.is_active = false;
      if (statusFilter === 'verified') params.is_verified = true;
      if (statusFilter === 'unverified') params.is_verified = false;

      const res = await adminAPI.users(params);
      setUsers(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
      setTotal(res?.total || res?.meta?.total || 0);
    } catch (err) {
      setUsers([]);
      const status = err?.response?.status || err?.status;
      if (status === 403) setError('Access denied. You need SuperAdmin privileges.');
      else if (status === 401) setError('Not authenticated. Please log in again.');
      else setError(err?.message || 'Failed to load users. Please check your connection.');
    }
    setLoading(false);
  }, [page, search, activeTab, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, activeTab, statusFilter]);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: newRole } : u));
    } catch {}
    setActionLoading(null);
    setRoleDropdown(null);
  };

  const handleSuspendToggle = async (userId, currentlyActive) => {
    setActionLoading(userId);
    try {
      await adminAPI.suspendUser(userId, currentlyActive);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentlyActive } : u));
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="px-4 lg:px-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          {t('admin.users.title', 'User 360')}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('admin.users.subtitle', 'Manage all platform users, roles and access')}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Doctors', value: stats.doctors, icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Patients', value: stats.patients, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Clinics', value: stats.clinic_owners, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Admins', value: stats.admins, icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Suspended', value: stats.suspended, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Unverified', value: stats.unverified_doctors, icon: ShieldX, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/60 p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-6 h-6 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{(s.value || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs (Doctor / Patient / Clinic segmentation) */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/20 min-w-[140px]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={fetchUsers} className="text-xs font-medium underline hover:text-red-800">Retry</button>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : !error && users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No users found{search ? ` matching "${search}"` : ''}.</p>
        </div>
      ) : users.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden" ref={dropdownRef}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Verified</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => {
                  const roleMeta = getRoleMeta(u.role_id);
                  const RoleIcon = roleMeta.icon;
                  const isLoadingThis = actionLoading === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={resolveStorageUrl(u.avatar) || '/images/default/default-avatar.svg'} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 leading-tight">{u.fullname}</p>
                            {u.mobile && <p className="text-[10px] text-gray-400">{u.mobile}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>

                      {/* Role — inline dropdown */}
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

                      <td className="px-4 py-3 text-center">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            <ShieldX className="w-3 h-3" /> No
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {u.is_active ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {isLoadingThis ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => setDetailUser(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="View Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPasswordModal(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              {u.is_active ? (
                                <button
                                  onClick={() => handleSuspendToggle(u.id, true)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                                  title="Suspend"
                                >
                                  <Ban className="w-3 h-3" /> Block
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspendToggle(u.id, false)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Reactivate"
                                >
                                  <RotateCcw className="w-3 h-3" /> Unblock
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Page {page} of {lastPage} — {total.toLocaleString()} users
            </span>
            {lastPage > 1 && (
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">Security & Audit</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              All role changes, suspensions, and password resets are recorded in Audit Logs. Review regularly for unauthorized changes.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PasswordResetModal user={passwordModal} onClose={() => setPasswordModal(null)} />
      <UserDetailDrawer user={detailUser} onClose={() => setDetailUser(null)} />
    </div>
  );
}
