import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Mail, Phone, Shield, ShieldCheck, ShieldAlert,
  MoreVertical, X, Loader2, Eye, EyeOff, Stethoscope, Clock, CheckCircle,
  Building2, Copy, AlertCircle, Trash2, Lock, Briefcase,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { clinicAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';
import CRMModal, { ModalLabel, ModalInput, ModalPrimaryButton, ModalCancelButton } from '../../components/crm/CRMModal';

// ═══════════════════════════════════════════════════
// Add Doctor Modal
// ═══════════════════════════════════════════════════
const AddDoctorModal = ({ isOpen, onClose, onCreated, clinicId }) => {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [form, setForm] = useState({
    fullname: '', email: '', password: '', mobile: '',
    title: '', specialty: '', experience_years: '',
  });
  const [creating, setCreating] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, password: pass }));
    setShowPass(true);
  };

  const handleCreate = async () => {
    if (!form.fullname?.trim()) { notify({ type: 'error', message: 'Doctor name is required.' }); return; }
    if (!form.email?.trim()) { notify({ type: 'error', message: 'Email is required.' }); return; }
    if (!form.password || form.password.length < 6) { notify({ type: 'error', message: 'Password must be at least 6 characters.' }); return; }

    setCreating(true);
    try {
      const res = await clinicAPI.createStaff(clinicId, {
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        password: form.password,
        mobile: form.mobile?.trim() || undefined,
        title: form.title?.trim() || undefined,
        specialty: form.specialty?.trim() || undefined,
        experience_years: form.experience_years?.trim() || undefined,
      });
      const doctor = res?.doctor || res?.data?.doctor;
      setGeneratedCreds({ email: form.email, password: form.password, name: form.fullname });
      notify({ type: 'success', message: t('crm.staff.doctorCreated', 'Doctor account created successfully!') });
      onCreated?.(doctor);
    } catch (err) {
      const msg = err?.message || err?.data?.message || err?.response?.data?.message || 'Failed to create doctor account.';
      notify({ type: 'error', message: msg });
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = () => {
    if (!generatedCreds) return;
    const text = `Email: ${generatedCreds.email}\nPassword: ${generatedCreds.password}`;
    navigator.clipboard?.writeText(text).then(() => {
      notify({ type: 'success', message: t('crm.staff.credsCopied', 'Credentials copied to clipboard!') });
    });
  };

  const handleClose = () => {
    setForm({ fullname: '', email: '', password: '', mobile: '', title: '', specialty: '', experience_years: '' });
    setGeneratedCreds(null);
    setShowPass(false);
    onClose();
  };

  return (
    <CRMModal
      isOpen={isOpen}
      onClose={handleClose}
      title={generatedCreds ? t('crm.staff.accountReady', 'Account Created!') : t('crm.staff.addDoctor', 'Add New Doctor')}
      subtitle={generatedCreds ? t('crm.staff.shareCredsDesc', 'Share these credentials with the doctor so they can log in.') : t('crm.staff.addDoctorDesc', 'Create a doctor account under your clinic')}
      icon={generatedCreds ? CheckCircle : UserPlus}
      footer={!generatedCreds ? (
        <>
          <ModalCancelButton onClick={handleClose}>{t('common.cancel', 'Cancel')}</ModalCancelButton>
          <ModalPrimaryButton onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {creating ? t('common.creating', 'Creating...') : t('crm.staff.createAccount', 'Create Account')}
          </ModalPrimaryButton>
        </>
      ) : null}
    >
      {generatedCreds ? (
        <div className="px-7 py-7 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.staff.doctorName', 'Name')}</span>
              <span className="text-sm font-semibold text-gray-900">{generatedCreds.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
              <span className="text-sm font-medium text-gray-900">{generatedCreds.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('common.password', 'Password')}</span>
              <span className="text-sm font-mono font-semibold text-gray-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">{generatedCreds.password}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <ModalPrimaryButton onClick={copyCredentials} className="flex-1">
              <Copy className="w-4 h-4" />
              {t('crm.staff.copyCreds', 'Copy Credentials')}
            </ModalPrimaryButton>
            <ModalCancelButton onClick={handleClose}>{t('common.close', 'Close')}</ModalCancelButton>
          </div>
        </div>
      ) : (
        <div className="px-7 py-7 space-y-6">
          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ModalLabel required icon={Users}>{t('crm.staff.fullName', 'Full Name')}</ModalLabel>
              <ModalInput
                type="text"
                value={form.fullname}
                onChange={(e) => setForm(f => ({ ...f, fullname: e.target.value }))}
                placeholder="Dr. John Doe"
              />
            </div>
            <div>
              <ModalLabel required icon={Mail}>Email</ModalLabel>
              <ModalInput
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="doctor@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <ModalLabel required icon={Lock}>{t('common.password', 'Password')}</ModalLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ModalInput
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap border border-gray-200"
              >
                {t('crm.staff.generate', 'Generate')}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <ModalLabel icon={Phone}>{t('auth.phoneNumber', 'Phone Number')} <span className="text-gray-400 font-normal">({t('common.optional', 'optional')})</span></ModalLabel>
            <ModalInput
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))}
              placeholder="+90 5XX XXX XXXX"
            />
          </div>

          {/* Title + Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ModalLabel icon={Briefcase}>{t('crm.staff.title', 'My Team')} <span className="text-gray-400 font-normal">({t('common.optional', 'optional')})</span></ModalLabel>
              <ModalInput
                type="text"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Dr. / Prof. / Uzm."
              />
            </div>
            <div>
              <ModalLabel icon={Stethoscope}>{t('crm.staff.specialty', 'Specialty')} <span className="text-gray-400 font-normal">({t('common.optional', 'optional')})</span></ModalLabel>
              <ModalInput
                type="text"
                value={form.specialty}
                onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))}
                placeholder="Cardiology, Dermatology..."
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <ModalLabel icon={Clock}>{t('crm.staff.experience', 'Experience')} <span className="text-gray-400 font-normal">({t('common.optional', 'optional')})</span></ModalLabel>
            <ModalInput
              type="text"
              value={form.experience_years}
              onChange={(e) => setForm(f => ({ ...f, experience_years: e.target.value }))}
              placeholder="5 years"
            />
          </div>
        </div>
      )}
    </CRMModal>
  );
};

// ═══════════════════════════════════════════════════
// Staff Card
// ═══════════════════════════════════════════════════
const StaffCard = ({ member }) => {
  const profile = member.doctor_profile || member.doctorProfile || {};
  const isVerified = member.is_verified;
  const avatarUrl = resolveStorageUrl(member.avatar, '/images/default/default-avatar.svg');

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">
        <img
          src={avatarUrl}
          alt={member.fullname}
          className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/default/default-avatar.svg'; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">{member.fullname}</h3>
            {isVerified ? (
              <ShieldCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
          {profile.specialty && (
            <p className="text-xs text-teal-600 font-medium mt-0.5">{profile.specialty}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5 truncate">{member.email}</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        {profile.title && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <Stethoscope className="w-3 h-3" />
            {profile.title}
          </span>
        )}
        {profile.experience_years && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            {profile.experience_years}
          </span>
        )}
        <span className={`ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isVerified ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {isVerified ? 'Verified' : 'Pending'}
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════
const CRMStaff = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notify } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const clinicId = user?.clinic_id || user?.clinic?.id;

  const fetchStaff = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await clinicAPI.staff(clinicId, { per_page: 100 });
      const list = res?.data || [];
      setStaff(Array.isArray(list) ? list : []);
    } catch (err) {
      notify({ type: 'error', message: 'Failed to load staff list.' });
    } finally {
      setLoading(false);
    }
  }, [clinicId, notify]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const filteredStaff = staff.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.fullname?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.doctor_profile?.specialty?.toLowerCase().includes(q)
    );
  });

  const doctors = filteredStaff.filter(m => m.role_id === 'doctor');
  const others = filteredStaff.filter(m => m.role_id !== 'doctor');

  if (!clinicId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">{t('crm.staff.noClinic', 'No Clinic Found')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('crm.staff.noClinicDesc', 'Your account is not associated with a clinic.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            {t('crm.staff.title', 'My Team')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('crm.staff.subtitle', 'Manage doctors and staff in your clinic')}
            {staff.length > 0 && <span className="ml-1 text-teal-600 font-semibold">({staff.length})</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          {t('crm.staff.addDoctor', 'Add New Doctor')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
          placeholder={t('crm.staff.searchPlaceholder', 'Search by name, email or specialty...')}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
          {searchQuery ? (
            <>
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">{t('crm.staff.noResults', 'No results found')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('crm.staff.noResultsDesc', 'Try a different search term.')}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-teal-50 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{t('crm.staff.empty', 'No team members yet')}</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {t('crm.staff.emptyDesc', 'Start building your team by adding doctors to your clinic.')}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                {t('crm.staff.addFirstDoctor', 'Add Your First Doctor')}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Doctors */}
          {doctors.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5" />
                {t('crm.staff.doctors', 'Doctors')} ({doctors.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {doctors.map(m => <StaffCard key={m.id} member={m} />)}
              </div>
            </div>
          )}

          {/* Other Staff */}
          {others.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                {t('crm.staff.otherStaff', 'Other Staff')} ({others.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {others.map(m => <StaffCard key={m.id} member={m} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Doctor Modal */}
      <AddDoctorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={(doctor) => {
          fetchStaff();
        }}
        clinicId={clinicId}
      />
    </div>
  );
};

export default CRMStaff;
