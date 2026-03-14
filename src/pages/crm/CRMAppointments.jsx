import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  CalendarDays, Clock, Plus, Search, ChevronLeft, ChevronRight,
  Video, Phone, MapPin, X, User, Mail,
  CheckCircle2, XCircle, AlertCircle, Eye, Loader2, Stethoscope,
  ArrowRight, Check, UserPlus, CalendarCheck, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { appointmentAPI } from '../../lib/api';
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

  if (!isOpen) return null;

  const stepTitles = ['Appointment Type', 'Date & Time', 'Confirm'];
  const TypeIcon = TYPE_CONFIG[form.appointment_type]?.icon || MapPin;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <Plus className="w-4.5 h-4.5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">New Appointment</h2>
              <p className="text-[11px] text-gray-500">Step {step} of 3 — {stepTitles[step - 1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-teal-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Step Content */}
        <div className="px-6 py-5 min-h-[260px]">
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">Select the appointment type:</p>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const selected = form.appointment_type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, appointment_type: key }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      selected ? 'border-teal-500 bg-teal-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) => setForm(f => ({ ...f, appointment_date: e.target.value }))}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Time *</label>
                  <select
                    value={form.appointment_time}
                    onChange={(e) => setForm(f => ({ ...f, appointment_time: e.target.value }))}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                  </select>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Patient Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.patient_name}
                    onChange={(e) => setForm(f => ({ ...f, patient_name: e.target.value }))}
                    className="w-full h-10 pl-9 pr-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Patient full name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.patient_email}
                    onChange={(e) => setForm(f => ({ ...f, patient_email: e.target.value }))}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.patient_phone}
                    onChange={(e) => setForm(f => ({ ...f, patient_phone: e.target.value }))}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="+90 5XX XXX XXXX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-teal-600" />
                  Appointment Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Type</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TypeIcon className="w-3.5 h-3.5" style={{ color: TYPE_CONFIG[form.appointment_type]?.color }} />
                      <span className="text-sm font-medium text-gray-800">{TYPE_CONFIG[form.appointment_type]?.label}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Date</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{form.appointment_date || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Time</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{form.appointment_time || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Patient</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{form.patient_name || 'Self'}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.confirmation_note}
                  onChange={(e) => setForm(f => ({ ...f, confirmation_note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Appointment'}
            </button>
          )}
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
  const { user } = useAuth();
  const { notify } = useToast();
  const calendarRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaults, setCreateDefaults] = useState({ date: '', time: '' });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    const dateStr = selectInfo.startStr?.split('T')[0] || selectInfo.startStr;
    const timeStr = selectInfo.startStr?.includes('T') ? selectInfo.startStr.split('T')[1]?.slice(0, 5) : '';
    setCreateDefaults({ date: dateStr, time: timeStr });
    setShowCreateModal(true);
    const calApi = calendarRef.current?.getApi();
    if (calApi) calApi.unselect();
  }, []);

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
              onClick={() => { setCreateDefaults({ date: '', time: '' }); setShowCreateModal(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
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

      {/* ── Detail Modal ── */}
      {selectedAppointment && (
        <DetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onStatusChange={handleStatusChange}
          updating={updating}
        />
      )}
    </div>
  );
};

export default CRMAppointments;
