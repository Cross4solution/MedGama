import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { doctorProfileAPI, authAPI, catalogAPI } from '../lib/api';
import {
  User, Building2, Clock, FileCheck, Check, ChevronRight, ChevronLeft,
  Plus, X, Loader2, Upload, Camera, PartyPopper
} from 'lucide-react';
import GlobalSuggest from '../components/forms/GlobalSuggest';
import resolveStorageUrl from '../utils/resolveStorageUrl';

/* ────────── Constants ────────── */
const STEPS = [
  { id: 0, icon: User },
  { id: 1, icon: Clock },
  { id: 2, icon: FileCheck },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS.map(d => [d, {
    enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d),
    start: '09:00',
    end: '17:00',
  }])
);

const DOC_TYPES = [
  { value: 'diploma', labelKey: 'onboarding.docDiploma' },
  { value: 'specialty_certificate', labelKey: 'onboarding.docSpecialty' },
  { value: 'clinic_license', labelKey: 'onboarding.docLicense' },
  { value: 'id_card', labelKey: 'onboarding.docIdCard' },
  { value: 'other', labelKey: 'onboarding.docOther' },
];

/* ────────── OnboardingWizard ────────── */
export default function OnboardingWizard() {
  const { user, updateUser, fetchCurrentUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [showWelcome, setShowWelcome] = useState(false);

  /* ── Step 0: Professional Profile ── */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  /* ── Step 1: Operational Setup ── */
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [services, setServices] = useState([{ name: '', description: '' }]);
  const [onlineConsultation, setOnlineConsultation] = useState(false);

  /* ── Step 2: Verification ── */
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [docType, setDocType] = useState('diploma');
  const [docNotes, setDocNotes] = useState('');
  const docInputRef = useRef(null);

  const isClinic = user?.role === 'clinic' || user?.role_id === 'clinicOwner';

  /* ────────── Load existing data ────────── */
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await doctorProfileAPI.get();
        const p = res?.profile || res?.data?.profile;
        if (p) {
          if (p.onboarding_completed) { navigate('/doctor/dashboard'); return; }
          setStep(Math.min(p.onboarding_step || 0, 2));
          if (p.title) setTitle(p.title);
          if (p.specialty) setSpecialty(p.specialty);
          if (p.bio) setBio(p.bio);
          if (p.languages?.length) setLanguages(p.languages);
          if (p.operating_hours && typeof p.operating_hours === 'object') {
            setSchedule(prev => ({ ...prev, ...p.operating_hours }));
          }
          if (p.services?.length) setServices(p.services);
          if (p.online_consultation) setOnlineConsultation(p.online_consultation);
        }
      } catch {}
      if (user) {
        const parts = (user.fullname || user.name || '').split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        if (user.avatar) setAvatarPreview(resolveStorageUrl(user.avatar));
      }
      catalogAPI.specialties().then(res => {
        // Pre-load for future use
      }).catch(() => {});
      doctorProfileAPI.getVerificationRequests().then(res => {
        const docs = res?.data?.verification_requests || res?.verification_requests || [];
        setDocuments(Array.isArray(docs) ? docs : []);
      }).catch(() => {});
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ────────── Validation ────────── */
  const validateStep = useCallback(() => {
    const e = {};
    if (step === 0) {
      if (!firstName.trim()) e.firstName = t('onboarding.required');
      if (!lastName.trim()) e.lastName = t('onboarding.required');
      if (!title.trim()) e.title = t('onboarding.required');
      if (isClinic && !clinicName.trim()) e.clinicName = t('onboarding.required');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [step, firstName, lastName, title, clinicName, isClinic, t]);

  /* ────────── Save step ────────── */
  const saveCurrentStep = useCallback(async (nextStep) => {
    if (!validateStep()) return false;
    setSaving(true);
    try {
      if (step === 0) {
        const fullname = `${firstName.trim()} ${lastName.trim()}`.trim();
        await authAPI.updateProfile({ fullname });
        if (avatarFile) {
          try {
            const avatarRes = await authAPI.uploadAvatar(avatarFile);
            // Response after axios interceptor: { data: { avatar }, avatar_url, url }
            const newAvatar = avatarRes?.data?.avatar
              || avatarRes?.avatar_url
              || avatarRes?.url
              || avatarRes?.data?.profile_image
              || avatarRes?.avatar;
            if (newAvatar) updateUser({ avatar: newAvatar, profile_image: newAvatar });
          } catch (e) {
            console.warn('Avatar upload failed during onboarding:', e);
          }
        }
        updateUser({ fullname, name: fullname });
        await doctorProfileAPI.updateOnboarding({ step: 0, title, specialty, bio, languages });
      } else if (step === 1) {
        await doctorProfileAPI.updateOnboarding({
          step: 1,
          operating_hours: schedule,
          services: services.filter(s => s.name),
          online_consultation: onlineConsultation,
        });
      } else if (step === 2) {
        await doctorProfileAPI.updateOnboarding({ step: 2 });
      }
      if (nextStep !== undefined) setStep(nextStep);
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [step, firstName, lastName, avatarFile, title, specialty, bio, languages,
      schedule, services, onlineConsultation, validateStep, updateUser]);

  /* ────────── Navigation ────────── */
  const handleNext = async () => {
    if (step < 2) {
      await saveCurrentStep(step + 1);
    } else {
      setSaving(true);
      try {
        await doctorProfileAPI.updateOnboarding({ step: 2 });
        setShowWelcome(true);
      } catch {}
      finally { setSaving(false); }
    }
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleComplete = async () => {
    setShowWelcome(false);
    updateUser({ onboarding_completed: true });
    // Refresh user from backend to persist onboarding_completed in auth state
    try { await fetchCurrentUser(); } catch {}
    navigate('/doctor/dashboard');
  };

  /* ────────── Avatar ────────── */
  const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, avatar: t('onboarding.avatarFormatError', 'Profile photo must be JPG, PNG or WebP format.') }));
      e.target.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setErrors(prev => ({ ...prev, avatar: t('onboarding.avatarSizeError', 'Profile photo must be under 2 MB.') }));
      e.target.value = '';
      return;
    }
    setErrors(prev => ({ ...prev, avatar: undefined }));
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  /* ────────── Schedule helpers ────────── */
  const toggleDay = (day) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  };
  const updateTime = (day, field, value) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  /* ────────── Document upload ────────── */
  const uploadDocument = useCallback(async (file) => {
    if (uploading) return;
    if (file.size > 10 * 1024 * 1024) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('document_type', docType);
      fd.append('document_label', file.name);
      if (docNotes.trim()) fd.append('notes', docNotes.trim());
      const res = await doctorProfileAPI.submitVerification(fd);
      const vr = res?.data?.verification_request || res?.verification_request;
      if (vr) setDocuments(prev => [...prev, vr]);
      setDocNotes('');
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(false); }
  }, [uploading, docType, docNotes]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) uploadDocument(files[0]);
  }, [uploadDocument]);

  const handleDocSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadDocument(file);
  };

  /* ────────── Styles ────────── */
  const inputCls = "w-full h-10 border border-gray-300 rounded-xl px-4 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all";
  const inputErrCls = "w-full h-10 border border-red-400 rounded-xl px-4 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all";
  const labelCls = "block text-xs sm:text-sm font-medium text-gray-700 mb-1.5";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col overflow-y-auto">
      {/* ── Header + Progress ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('onboarding.title')}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('onboarding.subtitle', { name: user?.name || '' })}
              </p>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex items-center gap-1.5 transition-all ${i <= step ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                    i < step ? 'bg-teal-600 text-white' :
                    i === step ? 'bg-white text-teal-700 ring-2 ring-teal-500 shadow-sm' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:block ${i === step ? 'text-teal-700' : 'text-gray-500'}`}>
                    {t(`onboarding.step${i + 1}Title`)}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full ${i < step ? 'bg-teal-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8">

        {/* ═══ Step 0: Professional Profile ═══ */}
        {step === 0 && (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    : <Camera className="w-6 h-6 text-gray-400" />}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-600 text-white rounded-lg flex items-center justify-center shadow-md hover:bg-teal-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('onboarding.profilePhoto')}</p>
                <p className="text-xs text-gray-500">{t('onboarding.profilePhotoHint')}</p>
                {errors.avatar && <p className="text-red-500 text-xs font-medium mt-1">{errors.avatar}</p>}
              </div>
            </div>

            {/* Name fields — side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('auth.firstName')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(er => ({ ...er, firstName: undefined })); }}
                    placeholder={t('auth.firstName')} className={`${errors.firstName ? inputErrCls : inputCls} pl-9`} />
                </div>
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('auth.lastName')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={lastName} onChange={e => { setLastName(e.target.value); setErrors(er => ({ ...er, lastName: undefined })); }}
                    placeholder={t('auth.lastName')} className={`${errors.lastName ? inputErrCls : inputCls} pl-9`} />
                </div>
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Clinic Name — only for clinic role */}
            {isClinic && (
              <div>
                <label className={labelCls}>{t('auth.clinicName')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={clinicName} onChange={e => { setClinicName(e.target.value); setErrors(er => ({ ...er, clinicName: undefined })); }}
                    placeholder={t('auth.clinicName')} className={`${errors.clinicName ? inputErrCls : inputCls} pl-9`} />
                </div>
                {errors.clinicName && <p className="text-red-500 text-xs mt-1">{errors.clinicName}</p>}
              </div>
            )}

            {/* Professional Title & Specialty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('onboarding.professionalTitle')} <span className="text-red-500">*</span></label>
                <input value={title} onChange={e => { setTitle(e.target.value); setErrors(er => ({ ...er, title: undefined })); }}
                  placeholder="e.g. Kardiyoloji Uzmanı" className={errors.title ? inputErrCls : inputCls} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('onboarding.specialty')}</label>
                <input value={specialty} onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology" className={inputCls} />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className={labelCls}>{t('onboarding.bio')}</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder={t('onboarding.bioPlaceholder')}
                className={inputCls + ' h-auto py-2.5 resize-none'} />
            </div>

            {/* Languages */}
            <div>
              <GlobalSuggest
                type="language"
                label={t('onboarding.languages')}
                value={languages.map(l => typeof l === 'string' ? { name: l } : l)}
                onChange={(newVal) => setLanguages(newVal)}
                multi={true}
                allowCustom={true}
                maxTags={15}
                placeholder={t('onboarding.searchLanguages', 'Search languages...')}
              />
            </div>
          </div>
        )}

        {/* ═══ Step 1: Operational Setup ═══ */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Weekly Schedule */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('onboarding.weeklySchedule')}</h3>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {DAYS.map((day, i) => {
                  const d = schedule[day] || { enabled: false, start: '09:00', end: '17:00' };
                  return (
                    <div key={day} className={`flex items-center gap-3 px-4 py-3 ${i < DAYS.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <button type="button" onClick={() => toggleDay(day)}
                        className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${d.enabled ? 'bg-teal-600' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${d.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      <span className={`text-sm font-medium w-24 capitalize ${d.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        {t(`onboarding.${day}`)}
                      </span>
                      {d.enabled ? (
                        <div className="flex items-center gap-2 text-sm">
                          <select value={d.start} onChange={e => updateTime(day, 'start', e.target.value)}
                            className="h-8 border border-gray-200 rounded-lg px-2 text-xs bg-white outline-none focus:border-teal-400">
                            {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                          </select>
                          <span className="text-gray-400">—</span>
                          <select value={d.end} onChange={e => updateTime(day, 'end', e.target.value)}
                            className="h-8 border border-gray-200 rounded-lg px-2 text-xs bg-white outline-none focus:border-teal-400">
                            {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{t('onboarding.closed')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Online Consultation */}
            <label className="flex items-center gap-3 p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 cursor-pointer">
              <input type="checkbox" checked={onlineConsultation} onChange={e => setOnlineConsultation(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <div>
                <span className="text-sm font-medium text-gray-900">{t('onboarding.onlineConsultation')}</span>
                <p className="text-xs text-gray-500">{t('onboarding.onlineConsultationHint')}</p>
              </div>
            </label>

            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">{t('onboarding.services')}</h3>
                <button type="button" onClick={() => setServices(s => [...s, { name: '', description: '' }])}
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> {t('common.add')}
                </button>
              </div>
              <div className="space-y-2">
                {services.map((svc, i) => (
                  <div key={i} className="grid sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                    {services.length > 1 && (
                      <button type="button" onClick={() => setServices(s => s.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    )}
                    <input value={svc.name} onChange={e => { const n = [...services]; n[i].name = e.target.value; setServices(n); }}
                      placeholder={t('onboarding.serviceName')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                    <input value={svc.description} onChange={e => { const n = [...services]; n[i].description = e.target.value; setServices(n); }}
                      placeholder={t('onboarding.serviceDesc')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Step 2: Verification & Legal ═══ */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('onboarding.verificationTitle')}</h3>
              <p className="text-xs text-gray-500 mb-4">{t('onboarding.verificationHint')}</p>

              {/* Document Type */}
              <div className="mb-4">
                <label className={labelCls}>{t('onboarding.documentType')}</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full sm:w-64 h-10 border border-gray-300 rounded-xl px-4 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white">
                  {DOC_TYPES.map(dt => (
                    <option key={dt.value} value={dt.value}>{t(dt.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className={labelCls}>{t('onboarding.notes')}</label>
                <input value={docNotes} onChange={e => setDocNotes(e.target.value)}
                  placeholder={t('onboarding.notesPlaceholder')} className={inputCls} />
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => docInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/30'
                }`}
              >
                <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleDocSelect} className="hidden" />
                {uploading
                  ? <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
                  : <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-teal-600' : 'text-gray-400'}`} />}
                <p className="text-sm font-medium text-gray-700">{t('onboarding.dropHere')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('onboarding.dropFormats')}</p>
              </div>
            </div>

            {/* Uploaded Documents */}
            {documents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('onboarding.uploadedDocs')}</h4>
                <div className="space-y-2">
                  {documents.map((doc, i) => (
                    <div key={doc.id || i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                      <FileCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name || doc.document_label}</p>
                        <p className="text-xs text-gray-500">{doc.document_type} • {doc.status || 'pending'}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{doc.status || 'pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <button onClick={handleBack} disabled={step === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <ChevronLeft className="w-4 h-4" /> {t('common.back')}
          </button>
          <button onClick={handleNext} disabled={saving}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 2 ? t('onboarding.complete') : t('common.next')}
            {step < 2 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Welcome Modal ── */}
      {showWelcome && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-8 pt-10 pb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{t('onboarding.welcomeTitle')}</h2>
              <p className="text-teal-100 text-sm">{t('onboarding.welcomeSubtitle')}</p>
            </div>
            <div className="px-8 py-6 text-center">
              <p className="text-gray-600 text-sm leading-relaxed mb-1">
                {t('onboarding.welcomeMessage', { name: user?.name || '' })}
              </p>
              <p className="text-gray-500 text-xs mb-6">{t('onboarding.welcomeHint')}</p>
              <button onClick={handleComplete}
                className="w-full py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all">
                {t('onboarding.goToDashboard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
