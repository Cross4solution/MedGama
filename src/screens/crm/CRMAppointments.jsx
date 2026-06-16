import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  CalendarDays, Clock, Plus, Search, ChevronLeft, ChevronRight,
  Video, Phone, MapPin, X, User, Mail,
  CheckCircle2, XCircle, AlertCircle, Eye, Loader2, Stethoscope,
  ArrowRight, Check, UserPlus, CalendarCheck, FileText,
  ShieldAlert, Upload, Lock, FileCheck, CheckCircle, Crown, Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { appointmentAPI, doctorProfileAPI, clinicVerificationAPI } from '../../lib/api';
import CRMModal, { ModalLabel, ModalInput, ModalSelect, ModalTextarea, ModalPrimaryButton, ModalCancelButton } from '../../components/crm/CRMModal';
import ClinicVerificationModal from '../../components/crm/ClinicVerificationModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// ═══════════════════════════════════════════════════
// Constants & Helpers
// ═══════════════════════════════════════════════════
const TIME_SLOTS = [];
for (let h = 8; h <= 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
  if (h < 18) TIME_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
}

const TYPE_CONFIG = {
  inPerson: { label: 'In-Person', color: '#3b82f6', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-200', icon: MapPin },
  online:   { label: 'Video Call', color: '#10b981', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Video },
  phone:    { label: 'Phone', color: '#f59e0b', bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 border-amber-200', icon: Phone },
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border-red-200' },
  no_show:   { label: 'No Show', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>{cfg.label}</span>;
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.inPerson;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.light}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// Map API response to internal format
const mapApi = (a) => ({
  id: a.id,
  title: a.patient?.fullname || 'Patient',
  start: a.appointment_date?.split('T')[0] + 'T' + (a.appointment_time || '09:00'),
  date: a.appointment_date?.split('T')[0],
  time: a.appointment_time || '09:00',
  appointment_type: a.appointment_type || 'inPerson',
  status: a.status || 'pending',
  patient: a.patient || {},
  doctor: a.doctor || {},
  clinic: a.clinic || {},
  notes: a.confirmation_note || a.doctor_note || '',
  video_conference_link: a.video_conference_link || '',
  backgroundColor: (TYPE_CONFIG[a.appointment_type] || TYPE_CONFIG.inPerson).color,
  borderColor: (TYPE_CONFIG[a.appointment_type] || TYPE_CONFIG.inPerson).color,
  textColor: '#ffffff',
  classNames: a.status === 'cancelled' ? ['opacity-40 line-through'] : [],
});

// ═══════════════════════════════════════════════════
// Gatekeeper Modal — Verification & Upgrade
// ═══════════════════════════════════════════════════
const DOC_TYPES = [
  { value: 'diploma', label: 'Diploma / Medical Degree' },
  { value: 'specialty_certificate', label: 'Specialty Certificate' },
  { value: 'clinic_license', label: 'Clinic License' },
  { value: 'id_card', label: 'ID Card / Passport' },
  { value: 'other', label: 'Other' },
];

const GatekeeperModal = ({ isOpen, onClose, user, needsVerification, needsUpgrade }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [docType, setDocType] = useState('diploma');
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef(null);

  const stepsNeeded = (needsVerification ? 1 : 0) + (needsUpgrade ? 1 : 0);

  useEffect(() => {
    if (!isOpen || !needsVerification) return;
    doctorProfileAPI.getVerificationRequests().then(res => {
      const docs = res?.data?.verification_requests || res?.verification_requests || [];
      const list = Array.isArray(docs) ? docs : [];
      setDocuments(list);
      if (list.some(d => d.status === 'pending')) setSubmitted(true);
    }).catch(() => {});
  }, [isOpen, needsVerification]);

  const uploadDocument = async (file) => {
    if (uploading || !file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify({ type: 'error', message: t('onboarding.fileTooLarge', 'File must be under 10 MB.') });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('document_type', docType);
      fd.append('document_label', file.name);
      const res = await doctorProfileAPI.submitVerification(fd);
      const vr = res?.data?.verification_request || res?.verification_request;
      if (vr) setDocuments(prev => [...prev, vr]);
      setSubmitted(true);
      notify({ type: 'success', message: t('crm.verification.docUploaded', 'Document uploaded successfully. Under review.') });
    } catch (err) {
      notify({ type: 'error', message: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) uploadDocument(files[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:pl-[calc(16rem+1rem)]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Encouraging Header */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-6 py-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="relative">
            <div className="w-14 h-14 mx-auto mb-3 bg-white/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {t('crm.gatekeeper.title', 'Almost There!')}
            </h2>
            <p className="text-teal-100 text-sm mt-1.5">
              {stepsNeeded > 1
                ? t('crm.gatekeeper.subtitleMulti', 'Just 2 steps to start serving your patients')
                : t('crm.gatekeeper.subtitleSingle', 'One last step to start serving your patients')}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Step A: Verification ── */}
          {needsVerification && (
            <div className="rounded-xl border border-amber-200/60 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50/70 border-b border-amber-200/40">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    {t('crm.gatekeeper.verifyTitle', 'Verify Your Account')}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {t('crm.gatekeeper.verifyDesc', 'Upload your professional documents for review')}
                  </p>
                </div>
                {submitted && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-700 rounded-full">
                    {t('crm.gatekeeper.underReview', 'Under Review')}
                  </span>
                )}
              </div>

              <div className="px-4 py-4 space-y-3">
                {submitted ? (
                  <div className="text-center py-2">
                    <CheckCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {t('crm.gatekeeper.docsSubmitted', 'Your documents are being reviewed. We\'ll notify you once approved.')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t('onboarding.documentType', 'Document Type')}
                      </label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                      >
                        {DOC_TYPES.map(dt => (
                          <option key={dt.value} value={dt.value}>{dt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        dragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 bg-gray-50 hover:border-amber-400 hover:bg-amber-50/30'
                      }`}
                    >
                      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => { if (e.target.files?.[0]) uploadDocument(e.target.files[0]); }} className="hidden" />
                      {uploading
                        ? <Loader2 className="w-6 h-6 text-amber-600 animate-spin mx-auto mb-1.5" />
                        : <Upload className={`w-6 h-6 mx-auto mb-1.5 ${dragActive ? 'text-amber-600' : 'text-gray-400'}`} />}
                      <p className="text-xs font-medium text-gray-700">
                        {t('onboarding.dropHere', 'Drop file here or click to browse')}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">PDF, JPG, PNG · Max 10 MB</p>
                    </div>
                  </>
                )}

                {documents.length > 0 && (
                  <div className="space-y-1.5">
                    {documents.map((doc, i) => (
                      <div key={doc.id || i} className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                        <FileCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{doc.file_name || doc.document_label}</p>
                          <p className="text-[10px] text-gray-500">{doc.document_type}</p>
                        </div>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-700'
                            : doc.status === 'rejected' ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>{doc.status || 'pending'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step B: Upgrade to Professional ── */}
          {needsUpgrade && (
            <div className="rounded-xl border border-teal-200/60 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200/40">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    {t('crm.gatekeeper.upgradeTitle', 'Upgrade to Professional')}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {t('crm.gatekeeper.upgradeDesc', 'Unlock appointments, telehealth, and advanced CRM features')}
                  </p>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: CalendarDays, label: t('crm.gatekeeper.feat1', 'Smart Calendar') },
                    { icon: Video, label: t('crm.gatekeeper.feat2', 'Telehealth') },
                    { icon: FileText, label: t('crm.gatekeeper.feat3', 'Medical Archive') },
                    { icon: Stethoscope, label: t('crm.gatekeeper.feat4', 'Examination') },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2 p-2 rounded-lg bg-teal-50/50">
                      <f.icon className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="text-[11px] font-medium text-gray-700">{f.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { onClose(); navigate('/crm/billing'); }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl text-sm font-bold hover:from-teal-700 hover:to-emerald-600 transition-all shadow-lg shadow-teal-200/50 flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  {t('crm.gatekeeper.upgradeCta', 'Upgrade to Professional')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors text-center"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// 3-Step Appointment Creation Modal
// ═══════════════════════════════════════════════════
const CreateAppointmentModal = ({ isOpen, onClose, onCreated, defaultDate, defaultTime, user }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const { notify } = useToast();

  const [form, setForm] = useState({
    appointment_type: 'inPerson',
    appointment_date: defaultDate || '',
    appointment_time: defaultTime || '',
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    patient_id: '',
    confirmation_note: '',
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCreating(false);
      setForm(f => ({
        ...f,
        appointment_date: defaultDate || f.appointment_date || '',
        appointment_time: defaultTime || f.appointment_time || '',
      }));
    }
  }, [isOpen, defaultDate, defaultTime]);

  const canNext = () => {
    if (step === 1) return !!form.appointment_type;
    if (step === 2) return !!form.appointment_date && !!form.appointment_time;
    return true;
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        doctor_id: user?.id,
        appointment_type: form.appointment_type,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        confirmation_note: form.confirmation_note || undefined,
      };
      if (form.patient_id) {
        payload.patient_id = form.patient_id;
      } else if (form.patient_email) {
        payload.patient_name = form.patient_name;
        payload.patient_email = form.patient_email;
        payload.patient_phone = form.patient_phone || undefined;
      } else {
        payload.patient_id = user?.id;
      }
      await appointmentAPI.create(payload);
      notify({ type: 'success', message: 'Appointment created successfully.' });
      onCreated();
      onClose();
    } catch (err) {
      const msg = err?.errors ? Object.values(err.errors)[0]?.[0] : err?.message || 'Failed to create appointment.';
      notify({ type: 'error', message: msg });
    } finally {
      setCreating(false);
    }
  };

  const stepTitles = ['Appointment Type', 'Date & Time', 'Confirm'];
  const TypeIcon = TYPE_CONFIG[form.appointment_type]?.icon || MapPin;

  return (
    <CRMModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Appointment"
      subtitle={`Step ${step} of 3 — ${stepTitles[step - 1]}`}
      icon={CalendarDays}
      footer={
        <>
          <ModalCancelButton onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
            {step > 1 ? 'Back' : 'Cancel'}
          </ModalCancelButton>
          {step < 3 ? (
            <ModalPrimaryButton onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Next <ArrowRight className="w-3.5 h-3.5" />
            </ModalPrimaryButton>
          ) : (
            <ModalPrimaryButton onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Appointment'}
            </ModalPrimaryButton>
          )}
        </>
      }
    >
      {/* Progress Bar — thin modern line */}
      <div className="flex gap-2 px-7 pt-5 pb-1">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ backgroundColor: s <= step ? '#0A6E6F' : '#E5E7EB' }} />
        ))}
      </div>

      {/* Step Content */}
      <div className="px-7 py-6 min-h-[260px]">
        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Select the appointment type:</p>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const selected = form.appointment_type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, appointment_type: key }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selected ? 'border-[#0A6E6F] bg-[#0A6E6F]/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white ${cfg.bg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-gray-900">{cfg.label}</p>
                    <p className="text-xs text-gray-500">
                      {key === 'inPerson' && 'Face-to-face consultation at the clinic'}
                      {key === 'online' && 'Video call via secure link'}
                      {key === 'phone' && 'Phone consultation'}
                    </p>
                  </div>
                  {selected && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0A6E6F' }}>
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Date, Time & Patient */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ModalLabel required icon={CalendarDays}>Date</ModalLabel>
                <ModalInput
                  type="date"
                  value={form.appointment_date}
                  onChange={(e) => setForm(f => ({ ...f, appointment_date: e.target.value }))}
                />
              </div>
              <div>
                <ModalLabel required icon={Clock}>Time</ModalLabel>
                <ModalSelect
                  value={form.appointment_time}
                  onChange={(e) => setForm(f => ({ ...f, appointment_time: e.target.value }))}
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                </ModalSelect>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-5">
              <ModalLabel icon={UserPlus}>Patient Name</ModalLabel>
              <ModalInput
                type="text"
                value={form.patient_name}
                onChange={(e) => setForm(f => ({ ...f, patient_name: e.target.value }))}
                placeholder="Patient full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ModalLabel icon={Mail}>Email</ModalLabel>
                <ModalInput
                  type="email"
                  value={form.patient_email}
                  onChange={(e) => setForm(f => ({ ...f, patient_email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <ModalLabel icon={Phone}>Phone</ModalLabel>
                <ModalInput
                  type="tel"
                  value={form.patient_phone}
                  onChange={(e) => setForm(f => ({ ...f, patient_phone: e.target.value }))}
                  placeholder="+90 5XX XXX XXXX"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-teal-600" />
                Appointment Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TypeIcon className="w-3.5 h-3.5" style={{ color: TYPE_CONFIG[form.appointment_type]?.color }} />
                    <span className="text-sm font-semibold text-gray-800">{TYPE_CONFIG[form.appointment_type]?.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{form.appointment_date || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Time</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{form.appointment_time || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Patient</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{form.patient_name || 'Self'}</p>
                </div>
              </div>
            </div>
            <div>
              <ModalLabel icon={FileText}>Notes <span className="text-gray-400 font-normal">(optional)</span></ModalLabel>
              <ModalTextarea
                value={form.confirmation_note}
                onChange={(e) => setForm(f => ({ ...f, confirmation_note: e.target.value }))}
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </div>
        )}
      </div>
    </CRMModal>
  );
};

// ═══════════════════════════════════════════════════
// Appointment Detail Modal
// ═══════════════════════════════════════════════════
const DetailModal = ({ appointment, onClose, onStatusChange, updating }) => {
  const navigate = useNavigate();
  if (!appointment) return null;
  const a = appointment;
  const typeCfg = TYPE_CONFIG[a.appointment_type] || TYPE_CONFIG.inPerson;
  const TypeIcon = typeCfg.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-[calc(16rem+1rem)]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header with type color */}
        <div className="px-6 py-4 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${typeCfg.color}10, white)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: typeCfg.color }}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Appointment Details</h2>
                <TypeBadge type={a.appointment_type} />
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Patient info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(a.patient?.fullname || 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{a.patient?.fullname || 'Patient'}</p>
              <p className="text-xs text-gray-500">{a.patient?.email || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">{a.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Time</p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">{a.time}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Doctor</p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">{a.doctor?.fullname || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
              <div className="mt-0.5"><StatusBadge status={a.status} /></div>
            </div>
          </div>

          {a.notes && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{a.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
          <div className="flex items-center gap-2">
            {a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no_show' && (
              <>
                <button onClick={() => onStatusChange(a.id, 'cancelled')} disabled={!!updating}
                  className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={() => onStatusChange(a.id, 'no_show')} disabled={!!updating}
                  className="px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50">
                  No Show
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {a.status === 'pending' && (
              <button onClick={() => onStatusChange(a.id, 'confirmed')} disabled={!!updating}
                className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50">
                Confirm
              </button>
            )}
            {(a.status === 'confirmed' || a.status === 'pending') && (
              <button onClick={() => onStatusChange(a.id, 'completed')} disabled={!!updating}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50">
                Complete
              </button>
            )}
            {a.status === 'completed' && (
              <button
                onClick={() => { onClose(); navigate('/crm/examination'); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Start Examination
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Main CRMAppointments Component
// ═══════════════════════════════════════════════════
const CRMAppointments = () => {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();
  const { notify } = useToast();
  const calendarRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [createDefaults, setCreateDefaults] = useState({ date: '', time: '' });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Restriction flags
  const isDoctor = user?.role_id === 'doctor';
  const needsVerification = isDoctor && !user?.is_verified;
  const needsUpgrade = isDoctor && !isPro;

  // Clinic verification gating
  const isClinicOwner = user?.role_id === 'clinicOwner';
  const [clinicVerificationStatus, setClinicVerificationStatus] = useState(null);
  const [showClinicVerifyModal, setShowClinicVerifyModal] = useState(false);

  useEffect(() => {
    if (!isClinicOwner) return;
    clinicVerificationAPI.status().then(res => {
      const d = res?.data || res;
      setClinicVerificationStatus(d.verification_status || 'unverified');
    }).catch(() => {});
  }, [isClinicOwner]);

  const clinicNeedsVerification = isClinicOwner && clinicVerificationStatus && clinicVerificationStatus !== 'verified';
  const isRestricted = needsVerification || needsUpgrade || clinicNeedsVerification;

  // ── Fetch appointments ──
  const fetchAppointments = useCallback(async (dateFrom, dateTo) => {
    try {
      const params = { per_page: 200 };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await appointmentAPI.list(params);
      const list = res?.data || [];
      setAppointments(list.map(mapApi));
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Calendar date range change ──
  const handleDatesSet = useCallback((dateInfo) => {
    const from = dateInfo.startStr?.split('T')[0];
    const to = dateInfo.endStr?.split('T')[0];
    fetchAppointments(from, to);
  }, [fetchAppointments]);

  // ── Click on empty slot → open create modal with pre-filled date/time ──
  const handleDateSelect = useCallback((selectInfo) => {
    const calApi = calendarRef.current?.getApi();
    if (calApi) calApi.unselect();
    if (clinicNeedsVerification) {
      setShowClinicVerifyModal(true);
      return;
    }
    if (isRestricted) {
      setShowGatekeeper(true);
      return;
    }
    const dateStr = selectInfo.startStr?.split('T')[0] || selectInfo.startStr;
    const timeStr = selectInfo.startStr?.includes('T') ? selectInfo.startStr.split('T')[1]?.slice(0, 5) : '';
    setCreateDefaults({ date: dateStr, time: timeStr });
    setShowCreateModal(true);
  }, [isRestricted, clinicNeedsVerification]);

  // ── Click on event → open detail modal ──
  const handleEventClick = useCallback((clickInfo) => {
    const apt = appointments.find(a => a.id === clickInfo.event.id);
    if (apt) setSelectedAppointment(apt);
  }, [appointments]);

  // ── Drag-and-drop: reschedule ──
  const handleEventDrop = useCallback(async (dropInfo) => {
    const apt = appointments.find(a => a.id === dropInfo.event.id);
    if (!apt || apt.status === 'cancelled' || apt.status === 'completed') {
      dropInfo.revert();
      return;
    }
    const newDate = dropInfo.event.startStr?.split('T')[0];
    const newTime = dropInfo.event.startStr?.includes('T') ? dropInfo.event.startStr.split('T')[1]?.slice(0, 5) : apt.time;

    // Optimistic
    setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, date: newDate, time: newTime, start: `${newDate}T${newTime}` } : a));

    try {
      await appointmentAPI.update(apt.id, { appointment_date: newDate, appointment_time: newTime });
      notify({ type: 'success', message: 'Appointment rescheduled.' });
    } catch (err) {
      dropInfo.revert();
      setAppointments(prev => prev.map(a => a.id === apt.id ? apt : a));
      notify({ type: 'error', message: err?.message || 'Failed to reschedule.' });
    }
  }, [appointments, notify]);

  // ── Status update ──
  const handleStatusChange = useCallback(async (id, newStatus) => {
    setUpdating(id);
    const prev = [...appointments];
    setAppointments(a => a.map(apt => apt.id === id ? {
      ...apt,
      status: newStatus,
      classNames: newStatus === 'cancelled' ? ['opacity-40 line-through'] : [],
    } : apt));
    setSelectedAppointment(null);
    try {
      await appointmentAPI.update(id, { status: newStatus });
      const msgs = { confirmed: 'Appointment confirmed.', cancelled: 'Appointment cancelled.', completed: 'Appointment completed.', no_show: 'Marked as No Show.' };
      notify({ type: 'success', message: msgs[newStatus] || 'Updated.' });
    } catch (err) {
      setAppointments(prev);
      notify({ type: 'error', message: err?.message || 'Update failed.' });
    } finally {
      setUpdating(null);
    }
  }, [appointments, notify]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }), [appointments]);

  // ── Filtered events for FullCalendar ──
  const calendarEvents = useMemo(() => {
    let list = appointments;
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => (a.patient?.fullname || '').toLowerCase().includes(q) || a.title.toLowerCase().includes(q));
    }
    return list;
  }, [appointments, statusFilter, searchQuery]);

  // ── Pending requests ──
  const pendingRequests = useMemo(() => appointments.filter(a => a.status === 'pending'), [appointments]);

  // ── Custom event render ──
  const renderEventContent = useCallback((eventInfo) => {
    const apt = appointments.find(a => a.id === eventInfo.event.id);
    if (!apt) return null;
    const TypeIcon = (TYPE_CONFIG[apt.appointment_type] || TYPE_CONFIG.inPerson).icon;
    const isCompleted = apt.status === 'completed';
    return (
      <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden w-full cursor-pointer">
        <TypeIcon className="w-3 h-3 flex-shrink-0" />
        <span className="text-[10px] font-semibold truncate">{eventInfo.timeText}</span>
        <span className="text-[10px] truncate">{apt.title}</span>
        {isCompleted && <Stethoscope className="w-3 h-3 flex-shrink-0 text-white/70" />}
      </div>
    );
  }, [appointments]);

  return (
    <div className="space-y-5">
      {/* ── Pending Requests Banner ── */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200/60 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Pending Requests</h2>
                <p className="text-[11px] text-gray-500">{pendingRequests.length} awaiting confirmation</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-amber-50 max-h-48 overflow-y-auto">
            {pendingRequests.slice(0, 5).map((apt) => (
              <div key={apt.id} className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-amber-700 text-[10px] font-bold flex-shrink-0">
                    {(apt.patient?.fullname || 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient?.fullname || 'Patient'}</p>
                    <p className="text-[11px] text-gray-500">{apt.date} · {apt.time} · <TypeBadge type={apt.appointment_type} /></p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleStatusChange(apt.id, 'confirmed')} disabled={!!updating}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-semibold hover:bg-teal-700 disabled:opacity-50">
                    <CheckCircle2 className="w-3 h-3" /> Confirm
                  </button>
                  <button onClick={() => handleStatusChange(apt.id, 'cancelled')} disabled={!!updating}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 bg-red-50 rounded-lg text-[11px] font-semibold hover:bg-red-100 disabled:opacity-50">
                    <XCircle className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50 border-gray-200' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Calendar Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 max-w-xs">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 mr-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[10px] text-gray-500 font-medium">{cfg.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                if (isRestricted) { setShowGatekeeper(true); return; }
                setCreateDefaults({ date: '', time: '' });
                setShowCreateModal(true);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md whitespace-nowrap ${
                isRestricted
                  ? 'bg-teal-600/60 text-white/90 hover:bg-teal-600/70'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {isRestricted ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
              New Appointment
            </button>
          </div>
        </div>

        {/* FullCalendar */}
        <div className="p-4 fc-wrapper">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={calendarEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={3}
              weekends={true}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              slotDuration="00:30:00"
              eventDisplay="block"
              height="auto"
              contentHeight={650}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              datesSet={handleDatesSet}
              eventContent={renderEventContent}
              nowIndicator={true}
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day',
              }}
            />
          )}
        </div>
      </div>

      {/* ── Create Modal ── */}
      <CreateAppointmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => fetchAppointments()}
        defaultDate={createDefaults.date}
        defaultTime={createDefaults.time}
        user={user}
      />

      {/* ── Gatekeeper Modal (Verification & Upgrade) ── */}
      <GatekeeperModal
        isOpen={showGatekeeper}
        onClose={() => setShowGatekeeper(false)}
        user={user}
        needsVerification={needsVerification}
        needsUpgrade={needsUpgrade}
      />

      {/* ── Detail Modal ── */}
      {selectedAppointment && (
        <DetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onStatusChange={handleStatusChange}
          updating={updating}
        />
      )}

      {/* ── Clinic Verification Modal ── */}
      <ClinicVerificationModal
        isOpen={showClinicVerifyModal}
        onClose={() => setShowClinicVerifyModal(false)}
        onStatusChange={(status) => setClinicVerificationStatus(status)}
      />
    </div>
  );
};

export default CRMAppointments;
