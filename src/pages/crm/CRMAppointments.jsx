import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays, Clock, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Video, Phone, MapPin, MoreVertical, X, User, Mail, FileText,
  CheckCircle2, XCircle, AlertCircle, Edit3, Trash2, Eye, Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { appointmentAPI } from '../../lib/api';

// ─── Mock Data ───────────────────────────────────────────────
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MOCK_APPOINTMENTS = [
  { id: 1, date: '2026-02-16', time: '09:00', endTime: '09:30', patient: 'Zeynep Kaya', email: 'zeynep@mail.com', phone: '+90 532 111 2233', age: 34, gender: 'F', type: 'Check-up', status: 'completed', method: 'in-person', notes: 'Annual physical exam', doctor: 'Dr. Ahmet' },
  { id: 2, date: '2026-02-16', time: '09:30', endTime: '10:00', patient: 'Ali Yilmaz', email: 'ali@mail.com', phone: '+90 533 222 3344', age: 45, gender: 'M', type: 'Follow-up', status: 'completed', method: 'video', notes: 'Post-surgery follow-up', doctor: 'Dr. Ahmet' },
  { id: 3, date: '2026-02-16', time: '10:00', endTime: '10:30', patient: 'Selin Acar', email: 'selin@mail.com', phone: '+90 534 333 4455', age: 28, gender: 'F', type: 'Consultation', status: 'in-progress', method: 'in-person', notes: 'Dermatology consultation', doctor: 'Dr. Ahmet' },
  { id: 4, date: '2026-02-16', time: '10:30', endTime: '11:00', patient: 'Mehmet Ozkan', email: 'mehmet@mail.com', phone: '+90 535 444 5566', age: 52, gender: 'M', type: 'Lab Review', status: 'upcoming', method: 'phone', notes: 'Blood test results review', doctor: 'Dr. Ahmet' },
  { id: 5, date: '2026-02-16', time: '11:00', endTime: '11:30', patient: 'Ayse Demir', email: 'ayse@mail.com', phone: '+90 536 555 6677', age: 38, gender: 'F', type: 'Check-up', status: 'upcoming', method: 'in-person', notes: 'Routine check-up', doctor: 'Dr. Ahmet' },
  { id: 6, date: '2026-02-16', time: '13:00', endTime: '13:30', patient: 'Burak Sahin', email: 'burak@mail.com', phone: '+90 537 666 7788', age: 29, gender: 'M', type: 'New Patient', status: 'upcoming', method: 'in-person', notes: 'Initial assessment', doctor: 'Dr. Ahmet' },
  { id: 7, date: '2026-02-16', time: '14:00', endTime: '14:45', patient: 'Elif Arslan', email: 'elif@mail.com', phone: '+90 538 777 8899', age: 42, gender: 'F', type: 'Procedure', status: 'upcoming', method: 'in-person', notes: 'Minor procedure scheduled', doctor: 'Dr. Ahmet' },
  { id: 8, date: '2026-02-16', time: '15:00', endTime: '15:30', patient: 'Can Yildiz', email: 'can@mail.com', phone: '+90 539 888 9900', age: 55, gender: 'M', type: 'Consultation', status: 'cancelled', method: 'video', notes: 'Cancelled by patient', doctor: 'Dr. Ahmet' },
  { id: 9, date: '2026-02-17', time: '09:00', endTime: '09:30', patient: 'Deniz Korkmaz', email: 'deniz@mail.com', phone: '+90 540 111 2233', age: 33, gender: 'F', type: 'Follow-up', status: 'upcoming', method: 'phone', notes: 'Medication adjustment', doctor: 'Dr. Ahmet' },
  { id: 10, date: '2026-02-17', time: '10:00', endTime: '10:30', patient: 'Pinar Dogan', email: 'pinar@mail.com', phone: '+90 541 222 3344', age: 47, gender: 'F', type: 'Check-up', status: 'upcoming', method: 'in-person', notes: 'Cardiology referral review', doctor: 'Dr. Ahmet' },
  { id: 11, date: '2026-02-18', time: '11:00', endTime: '11:30', patient: 'Serkan Aydin', email: 'serkan@mail.com', phone: '+90 542 333 4455', age: 39, gender: 'M', type: 'Lab Review', status: 'upcoming', method: 'in-person', notes: 'Thyroid panel review', doctor: 'Dr. Ahmet' },
  { id: 12, date: '2026-02-19', time: '09:30', endTime: '10:00', patient: 'Fatma Koc', email: 'fatma@mail.com', phone: '+90 543 444 5566', age: 61, gender: 'F', type: 'Follow-up', status: 'upcoming', method: 'video', notes: 'Diabetes management', doctor: 'Dr. Ahmet' },
];

const APPOINTMENT_TYPES = ['Check-up', 'Follow-up', 'Consultation', 'Lab Review', 'New Patient', 'Procedure', 'Emergency'];
const TIME_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];

// ─── Sub-components ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    upcoming: 'bg-gray-50 text-gray-600 border-gray-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    'no-show': 'bg-orange-50 text-orange-600 border-orange-200',
  };
  const labels = { completed: 'Completed', 'in-progress': 'In Progress', upcoming: 'Upcoming', cancelled: 'Cancelled', 'no-show': 'No Show' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c[status] || c.upcoming}`}>{labels[status] || status}</span>;
};

const MethodIcon = ({ method, size = 'sm' }) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  if (method === 'video') return <Video className={`${cls} text-sky-500`} />;
  if (method === 'phone') return <Phone className={`${cls} text-violet-500`} />;
  return <MapPin className={`${cls} text-emerald-500`} />;
};

// ─── Main Component ──────────────────────────────────────────
const mapApiToLocal = (a) => ({
  id: a.id,
  date: a.appointment_date,
  time: a.appointment_time || '09:00',
  endTime: '',
  patient: a.patient?.fullname || 'Patient',
  email: a.patient?.email || '',
  phone: a.patient?.mobile || '',
  age: '',
  gender: '',
  type: a.appointment_type === 'online' ? 'Video Call' : 'Check-up',
  status: a.status === 'pending' ? 'upcoming' : a.status,
  rawStatus: a.status,
  method: a.appointment_type === 'online' ? 'video' : 'in-person',
  notes: a.confirmation_note || a.doctor_note || '',
  doctor: a.doctor?.fullname || '',
});

const CRMAppointments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notify } = useToast();
  const [view, setView] = useState('list'); // list | calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [apiAppointments, setApiAppointments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(null); // holds appointment id being updated

  const refreshAppointments = async () => {
    try {
      const res = await appointmentAPI.list({ per_page: 100 });
      const list = res?.data || [];
      setApiAppointments(list.map(mapApiToLocal));
    } catch {
      // Keep existing data on refresh failure
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments from API
  useEffect(() => {
    refreshAppointments();
  }, []);

  const allAppointments = apiAppointments || MOCK_APPOINTMENTS;

  // New appointment form
  const [newForm, setNewForm] = useState({
    patient: '', email: '', phone: '', date: '', time: '', endTime: '', type: 'Check-up', method: 'in-person', notes: '',
  });

  const handleCreateAppointment = async () => {
    if (!newForm.date || !newForm.time) return;
    setCreating(true);
    try {
      await appointmentAPI.create({
        patient_id: user?.id,
        doctor_id: user?.id,
        appointment_type: newForm.method === 'video' ? 'online' : 'inPerson',
        appointment_date: newForm.date,
        appointment_time: newForm.time,
        confirmation_note: newForm.notes || undefined,
      });
      setShowNewModal(false);
      setNewForm({ patient: '', email: '', phone: '', date: '', time: '', endTime: '', type: 'Check-up', method: 'in-person', notes: '' });
      notify({ type: 'success', message: t('crm.appointments.created') || 'Appointment created successfully.' });
      refreshAppointments();
    } catch (err) {
      // Slot conflict handling
      const slotErr = err?.errors?.slot_id?.[0] || '';
      const isSlotConflict = err?.status === 422 && (slotErr.includes('no longer available') || slotErr.includes('slot'));
      if (isSlotConflict) {
        notify({ type: 'error', message: 'Bu saat dilimi az önce doldu. Lütfen başka bir saat seçin. / This time slot was just taken.' });
      } else if (err?.status === 422) {
        const firstErr = Object.values(err?.errors || {})?.[0]?.[0] || err?.message || 'Validation error';
        notify({ type: 'error', message: firstErr });
      } else {
        notify({ type: 'error', message: err?.message || 'Failed to create appointment.' });
      }
    } finally {
      setCreating(false);
    }
  };

  // ── Status Update (Confirm / Cancel / Complete) ──
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdating(appointmentId);
    try {
      await appointmentAPI.update(appointmentId, { status: newStatus });
      const labels = { confirmed: 'confirmed', cancelled: 'cancelled', completed: 'completed' };
      notify({ type: 'success', message: `Appointment ${labels[newStatus] || 'updated'} successfully.` });
      refreshAppointments();
      setShowDetailModal(false);
    } catch (err) {
      if (err?.status === 403) {
        notify({ type: 'error', message: 'You do not have permission to update this appointment.' });
      } else {
        notify({ type: 'error', message: err?.message || 'Failed to update appointment.' });
      }
    } finally {
      setUpdating(null);
    }
  };

  // Filter appointments
  const filtered = useMemo(() => {
    return allAppointments.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (searchQuery && !a.patient.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, typeFilter, searchQuery, allAppointments]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calendarMonth]);

  const getAppointmentsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allAppointments.filter((a) => a.date === dateStr);
  };

  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  const handleViewDetail = (apt) => {
    setSelectedAppointment(apt);
    setShowDetailModal(true);
  };

  const stats = useMemo(() => ({
    total: allAppointments.length,
    upcoming: allAppointments.filter(a => a.status === 'upcoming' || a.status === 'pending' || a.status === 'confirmed').length,
    completed: allAppointments.filter(a => a.status === 'completed').length,
    cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
  }), [allAppointments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.appointments.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.appointments.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          {t('crm.appointments.newAppointment')}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('common.total'), value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50 border-gray-200' },
          { label: t('crm.appointments.upcoming'), value: stats.upcoming, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: t('common.completed'), value: stats.completed, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: t('crm.appointments.cancelled'), value: stats.cancelled, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          {/* View Toggle + Search */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t('crm.appointments.listView')}
              </button>
              <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t('crm.appointments.calendarView')}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 max-w-xs">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('crm.patients.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent">
              <option value="all">{t('common.all')} {t('common.status')}</option>
              <option value="upcoming">{t('crm.appointments.upcoming')}</option>
              <option value="in-progress">{t('crm.appointments.inProgress')}</option>
              <option value="completed">{t('common.completed')}</option>
              <option value="cancelled">{t('crm.appointments.cancelled')}</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent">
              <option value="all">{t('common.all')} {t('common.type')}</option>
              {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('common.patient')}</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.date')} & {t('common.time')}</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.type')}</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.revenue.method')}</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.status')}</th>
                  <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">{t('crm.dashboard.noAppointments')}</td></tr>
                ) : (
                  filtered.map((apt) => (
                    <tr key={apt.id} className={`hover:bg-gray-50/50 transition-colors group ${apt.status === 'cancelled' ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                            {apt.patient.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{apt.patient}</p>
                            <p className="text-[11px] text-gray-400">{apt.gender === 'F' ? 'Female' : 'Male'}, {apt.age}y</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{apt.time} – {apt.endTime}</p>
                        <p className="text-[11px] text-gray-400">{apt.date}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">{apt.type}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <MethodIcon method={apt.method} />
                          <span className="text-xs text-gray-600 capitalize">{apt.method === 'in-person' ? 'In-Person' : apt.method}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5"><StatusBadge status={apt.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleViewDetail(apt)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 rounded-lg hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors" title="Cancel">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* CALENDAR VIEW */}
        {view === 'calendar' && (
          <div className="p-5">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-bold text-gray-900">{MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</h3>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-2">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-20 sm:h-24" />;
                const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayApts = getAppointmentsForDay(day);
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={day}
                    className={`h-20 sm:h-24 border rounded-xl p-1.5 cursor-pointer transition-colors hover:border-teal-300 hover:bg-teal-50/30 ${
                      isToday ? 'border-teal-400 bg-teal-50/40' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${isToday ? 'text-teal-600 bg-teal-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>{day}</span>
                      {dayApts.length > 0 && (
                        <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200">{dayApts.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayApts.slice(0, 2).map((a) => (
                        <div key={a.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${
                          a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          a.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {a.time} {a.patient.split(' ')[0]}
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <p className="text-[9px] text-gray-400 font-medium px-1">+{dayApts.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── New Appointment Modal ─── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Plus className="w-4.5 h-4.5 text-teal-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{t('crm.appointments.newAppointment')}</h2>
              </div>
              <button onClick={() => setShowNewModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.patient')} {t('common.name')} *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={newForm.patient} onChange={(e) => setNewForm({...newForm, patient: e.target.value})}
                    className="w-full h-10 pl-9 pr-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder={t('crm.patients.fullName')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.email')}</label>
                  <input type="email" value={newForm.email} onChange={(e) => setNewForm({...newForm, email: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.phone')}</label>
                  <input type="tel" value={newForm.phone} onChange={(e) => setNewForm({...newForm, phone: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="+90 5XX XXX XXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.date')} *</label>
                  <input type="date" value={newForm.date} onChange={(e) => setNewForm({...newForm, date: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.time')} *</label>
                  <select value={newForm.time} onChange={(e) => setNewForm({...newForm, time: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white">
                    <option value="">{t('crm.appointments.selectTime')}</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.type')}</label>
                  <select value={newForm.type} onChange={(e) => setNewForm({...newForm, type: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white">
                    {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.revenue.method')}</label>
                  <select value={newForm.method} onChange={(e) => setNewForm({...newForm, method: e.target.value})}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white">
                    <option value="in-person">{t('crm.appointments.inPerson')}</option>
                    <option value="video">{t('crm.appointments.videoCall')}</option>
                    <option value="phone">{t('common.phone')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.notes')}</label>
                <textarea value={newForm.notes} onChange={(e) => setNewForm({...newForm, notes: e.target.value})}
                  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" placeholder="Additional notes..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">{t('common.cancel')}</button>
              <button
                onClick={handleCreateAppointment}
                disabled={creating || !newForm.date || !newForm.time}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? 'Creating...' : t('crm.appointments.newAppointment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{t('crm.appointments.appointmentDetails')}</h2>
              <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                  {selectedAppointment.patient.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{selectedAppointment.patient}</p>
                  <p className="text-xs text-gray-500">{selectedAppointment.gender === 'F' ? 'Female' : 'Male'}, {selectedAppointment.age} years old</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('common.date'), value: selectedAppointment.date },
                  { label: t('common.time'), value: `${selectedAppointment.time} – ${selectedAppointment.endTime}` },
                  { label: t('common.type'), value: selectedAppointment.type },
                  { label: t('crm.revenue.method'), value: selectedAppointment.method === 'in-person' ? t('crm.appointments.inPerson') : selectedAppointment.method },
                  { label: t('common.email'), value: selectedAppointment.email },
                  { label: t('common.phone'), value: selectedAppointment.phone },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm text-gray-800 font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('common.status')}</p>
                <StatusBadge status={selectedAppointment.status} />
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('common.notes')}</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              {selectedAppointment.rawStatus !== 'cancelled' && selectedAppointment.rawStatus !== 'completed' && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelled')}
                  disabled={!!updating}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {updating === selectedAppointment.id ? '...' : (t('crm.appointments.cancelled') || 'Cancel')}
                </button>
              )}
              {(selectedAppointment.rawStatus === 'pending') && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                  disabled={!!updating}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {updating === selectedAppointment.id ? '...' : 'Confirm'}
                </button>
              )}
              {(selectedAppointment.rawStatus === 'confirmed' || selectedAppointment.rawStatus === 'pending') && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}
                  disabled={!!updating}
                  className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {updating === selectedAppointment.id ? '...' : (t('common.completed') || 'Complete')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMAppointments;
