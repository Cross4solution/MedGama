import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { clinicAPI } from '../lib/api';
import { resolveStorageUrl } from '../utils/resolveStorageUrl';
import {
  Users, UserPlus, Stethoscope, Loader2, Search, Mail, Phone,
  MoreVertical, Edit3, UserX, CheckCircle2, XCircle, X,
  ChevronLeft, Building2, LayoutGrid, List, Clock, Shield
} from 'lucide-react';

export default function ClinicTeam() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null); // doctor obj or null
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Add doctor form
  const [form, setForm] = useState({ fullname: '', email: '', specialty: '', password: '', mobile: '' });

  // Fetch clinic data
  useEffect(() => {
    clinicAPI.onboardingProfile().then(res => {
      if (res?.clinic?.id) setClinicId(res.clinic.id);
      if (res?.doctors) setDoctors(res.doctors);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredDoctors = doctors.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.fullname || '').toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q);
  });

  const activeDoctors = filteredDoctors.filter(d => d.is_active !== false);
  const inactiveDoctors = filteredDoctors.filter(d => d.is_active === false);

  const resetForm = () => {
    setForm({ fullname: '', email: '', specialty: '', password: '', mobile: '' });
    setError('');
  };

  const handleAddDoctor = async () => {
    if (!form.fullname || !form.email) {
      setError(t('clinicTeam.nameEmailRequired', 'Name and email are required.'));
      return;
    }
    if (!clinicId) {
      setError(t('clinicTeam.clinicNotFound', 'Clinic not found. Please complete onboarding first.'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await clinicAPI.createStaff(clinicId, {
        ...form,
        password: form.password || 'Temp1234!',
      });
      const doc = res?.doctor;
      if (doc) {
        setDoctors(prev => [...prev, { id: doc.id, fullname: doc.fullname, email: doc.email, is_active: true }]);
      }
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Failed to add doctor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (doc) => {
    if (!clinicId) return;
    try {
      await clinicAPI.update(clinicId, { deactivate_doctor_id: doc.id });
    } catch {}
    setDoctors(prev => prev.map(d => d.id === doc.id ? { ...d, is_active: false } : d));
  };

  const handleReactivate = async (doc) => {
    if (!clinicId) return;
    try {
      await clinicAPI.update(clinicId, { reactivate_doctor_id: doc.id });
    } catch {}
    setDoctors(prev => prev.map(d => d.id === doc.id ? { ...d, is_active: true } : d));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/clinic/dashboard" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('clinicTeam.title', 'My Team')}</h1>
              <p className="text-xs text-gray-500">{t('clinicTeam.subtitle', 'Manage your clinic\'s doctors and staff')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-400'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => { resetForm(); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md shadow-teal-200/50">
              <UserPlus className="w-4 h-4" />
              {t('clinicTeam.addDoctor', 'Add Doctor')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
            placeholder={t('clinicTeam.searchPlaceholder', 'Search by name or email...')} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-semibold text-gray-500">
            {activeDoctors.length} {t('clinicTeam.active', 'Active')}
          </span>
          {inactiveDoctors.length > 0 && (
            <span className="text-xs font-semibold text-gray-400">
              {inactiveDoctors.length} {t('clinicTeam.inactive', 'Inactive')}
            </span>
          )}
        </div>

        {/* Empty state */}
        {doctors.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200/60">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{t('clinicTeam.emptyTitle', 'No team members yet')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('clinicTeam.emptyDesc', 'Add your first doctor to get started.')}</p>
            <button onClick={() => { resetForm(); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
              <UserPlus className="w-4 h-4" /> {t('clinicTeam.addDoctor', 'Add Doctor')}
            </button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredDoctors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map(doc => (
              <DoctorCard key={doc.id} doc={doc} t={t}
                onDeactivate={() => handleDeactivate(doc)}
                onReactivate={() => handleReactivate(doc)}
                onEdit={() => setShowEditModal(doc)} />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredDoctors.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden divide-y divide-gray-50">
            {filteredDoctors.map(doc => (
              <DoctorRow key={doc.id} doc={doc} t={t}
                onDeactivate={() => handleDeactivate(doc)}
                onReactivate={() => handleReactivate(doc)}
                onEdit={() => setShowEditModal(doc)} />
            ))}
          </div>
        )}

        {/* Add Doctor Modal */}
        {showAddModal && (
          <ModalOverlay onClose={() => setShowAddModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/60 w-full max-w-lg mx-4 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{t('clinicTeam.addDoctorTitle', 'Add New Doctor')}</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicTeam.fullName', 'Full Name')} *</label>
                  <input value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    placeholder="Dr. John Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicTeam.email', 'Email')} *</label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    placeholder="doctor@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicTeam.specialty', 'Specialty')}</label>
                    <input value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                      placeholder="Cardiology" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicTeam.phone', 'Phone')}</label>
                    <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                      placeholder="+90 555..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clinicTeam.tempPassword', 'Temporary Password')}</label>
                  <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} type="password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    placeholder={t('clinicTeam.tempPasswordHint', 'Min 6 characters (default: Temp1234!)')} />
                </div>
                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-end gap-3">
                <button onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button onClick={handleAddDoctor} disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {t('clinicTeam.addToTeam', 'Add to Team')}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function ModalOverlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function DoctorCard({ doc, t, onDeactivate, onReactivate, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const inactive = doc.is_active === false;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 relative transition-all hover:shadow-md ${inactive ? 'border-gray-200 opacity-60' : 'border-gray-200/60'}`}>
      {/* Menu */}
      <div className="absolute top-4 right-4">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-36 z-10">
            {!inactive ? (
              <button onClick={() => { onDeactivate(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                <UserX className="w-3.5 h-3.5" /> {t('clinicTeam.deactivate', 'Deactivate')}
              </button>
            ) : (
              <button onClick={() => { onReactivate(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('clinicTeam.reactivate', 'Reactivate')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-teal-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{doc.fullname}</p>
          <p className="text-[11px] text-gray-400 truncate">{doc.email}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          !inactive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-gray-100 text-gray-500 border border-gray-200/60'
        }`}>
          {!inactive ? t('clinicTeam.active', 'Active') : t('clinicTeam.inactive', 'Inactive')}
        </span>
      </div>
    </div>
  );
}

function DoctorRow({ doc, t, onDeactivate, onReactivate, onEdit }) {
  const inactive = doc.is_active === false;

  return (
    <div className={`px-5 py-3.5 flex items-center gap-3 ${inactive ? 'opacity-50' : ''}`}>
      <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Stethoscope className="w-4 h-4 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{doc.fullname}</p>
        <p className="text-[11px] text-gray-400 truncate">{doc.email}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        !inactive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
      }`}>
        {!inactive ? t('clinicTeam.active', 'Active') : t('clinicTeam.inactive', 'Inactive')}
      </span>
      <div className="flex items-center gap-1">
        {!inactive ? (
          <button onClick={onDeactivate} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors" title={t('clinicTeam.deactivate', 'Deactivate')}>
            <UserX className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={onReactivate} className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-colors" title={t('clinicTeam.reactivate', 'Reactivate')}>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
