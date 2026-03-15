import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X, User, Mail, Phone, FileText, Clock, CalendarDays,
  Video, Globe, Stethoscope, Scissors, HeartPulse,
  ChevronLeft, ChevronRight, Plus, Filter, RefreshCw,
  ExternalLink, Building2, AlertCircle, Loader2,
  PhoneCall, Ban, PlayCircle, CheckCircle,
} from 'lucide-react';
import { appointmentAPI, doctorProfileAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const POLL_INTERVAL = 30000; // 30s

const DAYS_MAP = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };

// ─── Status Badge ────────────────────────────────────────────
const STATUS_CONFIG = {
  confirmed:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: '#10B981' },
  pending:    { cls: 'bg-amber-50 text-amber-700 border-amber-200', color: '#F59E0B' },
  cancelled:  { cls: 'bg-red-50 text-red-600 border-red-200', color: '#EF4444' },
  completed:  { cls: 'bg-gray-50 text-gray-600 border-gray-200', color: '#9CA3AF' },
};

const StatusBadge = ({ status, t }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      {t(`crm.calendar.status_${status}`, status)}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CRMSmartCalendar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [operatingHours, setOperatingHours] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // ── Fetch events from API ──
  const fetchEvents = useCallback(async (start, end) => {
    try {
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await appointmentAPI.calendarEvents(params);
      const data = res?.events || res?.data?.events || [];
      setEvents(data);
      setLastSync(new Date());
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // ── Fetch operating hours ──
  useEffect(() => {
    if (user?.role === 'doctor' || user?.role_id === 'doctor') {
      doctorProfileAPI.get().then(res => {
        const dp = res?.profile || res?.data?.profile;
        if (dp?.operating_hours?.length === 7) {
          setOperatingHours(dp.operating_hours);
        }
      }).catch(() => {});
    }
  }, [user]);

  // ── Initial load + polling ──
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchEvents(dateRange.start, dateRange.end);
    }
  }, [dateRange, fetchEvents]);

  useEffect(() => {
    if (!dateRange.start) return;
    const interval = setInterval(() => {
      fetchEvents(dateRange.start, dateRange.end);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [dateRange, fetchEvents]);

  // ── Generate closed-hours background events from operating hours ──
  const availabilityEvents = useMemo(() => {
    if (!operatingHours.length || !dateRange.start) return [];
    const bgEvents = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0=sun
      const dayData = operatingHours.find(oh => DAYS_MAP[oh.day] === dayOfWeek);
      if (!dayData) continue;

      const dateStr = d.toISOString().slice(0, 10);

      if (dayData.is_closed) {
        bgEvents.push({
          id: `closed-${dateStr}`,
          start: `${dateStr}T07:00:00`,
          end: `${dateStr}T20:00:00`,
          display: 'background',
          backgroundColor: 'rgba(156,163,175,0.15)',
          classNames: ['closed-hours-bg'],
        });
      } else {
        // Before open
        if (dayData.open && dayData.open > '07:00') {
          bgEvents.push({
            id: `before-${dateStr}`,
            start: `${dateStr}T07:00:00`,
            end: `${dateStr}T${dayData.open}:00`,
            display: 'background',
            backgroundColor: 'rgba(156,163,175,0.12)',
            classNames: ['closed-hours-bg'],
          });
        }
        // After close
        if (dayData.close && dayData.close < '20:00') {
          bgEvents.push({
            id: `after-${dateStr}`,
            start: `${dateStr}T${dayData.close}:00`,
            end: `${dateStr}T20:00:00`,
            display: 'background',
            backgroundColor: 'rgba(156,163,175,0.12)',
            classNames: ['closed-hours-bg'],
          });
        }
        // Breaks
        (dayData.breaks || []).forEach((brk, bi) => {
          bgEvents.push({
            id: `break-${dateStr}-${bi}`,
            start: `${dateStr}T${brk.start}:00`,
            end: `${dateStr}T${brk.end}:00`,
            display: 'background',
            backgroundColor: 'rgba(251,191,36,0.10)',
            classNames: ['break-hours-bg'],
          });
        });
      }
    }
    return bgEvents;
  }, [operatingHours, dateRange]);

  // ── Merge appointment events + availability bg events ──
  const allCalendarEvents = useMemo(() => {
    return [...events, ...availabilityEvents];
  }, [events, availabilityEvents]);

  // ── Drag & Drop reschedule ──
  const handleEventDrop = useCallback(async (info) => {
    const { event } = info;
    if (event.display === 'background') return;

    const newStart = event.start;
    const newDate = newStart.toISOString().slice(0, 10);
    const newTime = newStart.toTimeString().slice(0, 5);
    const appointmentId = event.extendedProps?.appointment_id || event.id;

    try {
      await appointmentAPI.reschedule(appointmentId, {
        appointment_date: newDate,
        appointment_time: newTime,
      });
      // Optimistic update already applied by FullCalendar
      setLastSync(new Date());
    } catch (err) {
      console.error('Reschedule failed:', err);
      info.revert();
    }
  }, []);

  // ── Event resize ──
  const handleEventResize = useCallback((info) => {
    // We don't persist resize — just allow visual feedback
  }, []);

  // ── Click handler — open quick action modal ──
  const handleEventClick = useCallback((info) => {
    if (info.event.display === 'background') return;
    const ep = info.event.extendedProps;
    setSelectedEvent({ ...ep, title: info.event.title, start: info.event.startStr, end: info.event.endStr });
    setShowModal(true);
  }, []);

  // ── Quick actions ──
  const handleQuickAction = async (action) => {
    if (!selectedEvent) return;
    const id = selectedEvent.appointment_id;
    setActionLoading(action);
    try {
      if (action === 'start') {
        navigate(`/crm/examination?id=${id}`);
        return;
      }
      if (action === 'call') {
        if (selectedEvent.patient?.mobile) {
          window.open(`tel:${selectedEvent.patient.mobile}`);
        }
        setActionLoading(null);
        return;
      }
      if (action === 'telehealth') {
        navigate(`/crm/telehealth?id=${id}`);
        return;
      }
      if (action === 'cancel') {
        await appointmentAPI.update(id, { status: 'cancelled' });
        setEvents(prev => prev.map(e => e.id === id ? { ...e, extendedProps: { ...e.extendedProps, status: 'cancelled' }, borderColor: '#EF4444', backgroundColor: '#FEF2F2', textColor: '#991B1B' } : e));
        setShowModal(false);
      }
      if (action === 'confirm') {
        await appointmentAPI.update(id, { status: 'confirmed' });
        setEvents(prev => prev.map(e => e.id === id ? { ...e, extendedProps: { ...e.extendedProps, status: 'confirmed' }, borderColor: '#10B981', backgroundColor: '#ECFDF5', textColor: '#065F46' } : e));
        setShowModal(false);
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Calendar navigation ──
  const goToday = () => calendarRef.current?.getApi().today();
  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();
  const changeView = (view) => {
    calendarRef.current?.getApi().changeView(view);
    setCurrentView(view);
  };

  // ── Dates-set callback: track visible date range ──
  const handleDatesSet = useCallback((dateInfo) => {
    const start = dateInfo.startStr?.slice(0, 10);
    const end = dateInfo.endStr?.slice(0, 10);
    setDateRange({ start, end });
  }, []);

  // ── Stats ──
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      todayCount: events.filter(e => e.start?.slice(0, 10) === today).length,
      confirmed: events.filter(e => e.extendedProps?.status === 'confirmed').length,
      pending: events.filter(e => e.extendedProps?.status === 'pending').length,
      total: events.length,
    };
  }, [events]);

  // ── Custom event render ──
  const renderEventContent = (eventInfo) => {
    if (eventInfo.event.display === 'background') return null;
    const ep = eventInfo.event.extendedProps;
    const statusCfg = STATUS_CONFIG[ep?.status] || STATUS_CONFIG.pending;
    const isOnline = ep?.appointment_type === 'online';

    return (
      <div className="flex items-start gap-1.5 px-1.5 py-1 w-full overflow-hidden cursor-pointer group">
        {isOnline ? <Video className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: statusCfg.color }} /> : <Stethoscope className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: statusCfg.color }} />}
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold truncate block" style={{ color: eventInfo.event.textColor }}>
            {eventInfo.event.title}
          </span>
          <p className="text-[10px] opacity-70 truncate" style={{ color: eventInfo.event.textColor }}>
            {eventInfo.timeText} · {t(`crm.calendar.status_${ep?.status}`, ep?.status)}
          </p>
        </div>
      </div>
    );
  };

  const manualRefresh = () => {
    if (dateRange.start) fetchEvents(dateRange.start, dateRange.end);
  };

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.calendar.title', 'Smart Calendar')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('crm.calendar.subtitle', 'Manage all appointments from a single calendar')}
            {lastSync && (
              <span className="ml-2 text-[10px] text-gray-400">
                {t('crm.calendar.lastSync', 'Synced')}: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={manualRefresh} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </button>
          <button
            onClick={() => navigate('/crm/appointments')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            {t('crm.appointments.newAppointment', 'New Appointment')}
          </button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('crm.calendar.todayAppointments', "Today's Appointments"), value: stats.todayCount, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CalendarDays },
          { label: t('crm.calendar.totalVisible', 'Total Visible'), value: stats.total, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: Globe },
          { label: t('crm.calendar.status_confirmed', 'Confirmed'), value: stats.confirmed, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
          { label: t('crm.calendar.status_pending', 'Pending'), value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg} flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filters & View ─── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          {/* Status Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('crm.calendar.filterByStatus', 'Status')}:</span>
            {['all', 'confirmed', 'pending', 'cancelled', 'completed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${statusFilter === s ? 'ring-2 ring-teal-400 ring-offset-1 shadow-sm' : 'opacity-70 hover:opacity-100'} ${s === 'all' ? 'bg-gray-50 border-gray-200 text-gray-600' : STATUS_CONFIG[s]?.cls || ''}`}>
                {s === 'all' ? t('common.all', 'All') : t(`crm.calendar.status_${s}`, s)}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: 'timeGridDay', label: t('crm.calendar.day', 'Day') },
                { key: 'timeGridWeek', label: t('crm.calendar.week', 'Week') },
                { key: 'dayGridMonth', label: t('crm.calendar.month', 'Month') },
              ].map((v) => (
                <button key={v.key} onClick={() => changeView(v.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${currentView === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Availability legend */}
        {operatingHours.length > 0 && (
          <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-50 bg-gray-50/50">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('crm.calendar.availability', 'Availability')}:</span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium"><span className="w-3 h-3 rounded bg-white border border-emerald-300" /> {t('crm.calendar.openHours', 'Open Hours')}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium"><span className="w-3 h-3 rounded bg-gray-200/60 border border-gray-300" /> {t('crm.calendar.closedHours', 'Closed / Off Hours')}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-medium"><span className="w-3 h-3 rounded bg-amber-100/60 border border-amber-300" /> {t('crm.calendar.breakTime', 'Break')}</div>
          </div>
        )}

        {/* ─── Calendar Navigation ─── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToday} className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200">
              {t('crm.calendar.today', 'Today')}
            </button>
            <button onClick={goNext} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <AlertCircle className="w-3.5 h-3.5" />
            {t('crm.calendar.dragHint', 'Drag & drop to reschedule appointments')}
          </div>
        </div>

        {/* ─── FullCalendar ─── */}
        <div className="p-4 smart-calendar-wrapper relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={false}
            events={allCalendarEvents}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            allDaySlot={false}
            nowIndicator={true}
            dayMaxEvents={3}
            expandRows={true}
            stickyHeaderDates={true}
            height="auto"
            contentHeight={650}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'short' }}
            locale={localStorage.getItem('preferred_language') || 'en'}
          />
        </div>
      </div>

      {/* ═══════════ Quick Action Modal ═══════════ */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="rounded-t-2xl px-6 py-4 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{t('crm.calendar.quickActions', 'Quick Actions')}</h2>
                  <StatusBadge status={selectedEvent.status} t={t} />
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-white/60 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient Info */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                  {selectedEvent.patient?.fullname?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900">{selectedEvent.patient?.fullname || selectedEvent.title}</p>
                  <p className="text-xs text-gray-500">{selectedEvent.patient?.email}</p>
                </div>
              </div>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1"><CalendarDays className="w-3.5 h-3.5 text-gray-400" /><p className="text-[10px] font-semibold text-gray-400 uppercase">{t('common.date', 'Date')}</p></div>
                  <p className="text-sm text-gray-800 font-medium">{selectedEvent.appointment_date || selectedEvent.start?.slice(0, 10)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-gray-400" /><p className="text-[10px] font-semibold text-gray-400 uppercase">{t('common.time', 'Time')}</p></div>
                  <p className="text-sm text-gray-800 font-medium">{selectedEvent.appointment_time || selectedEvent.start?.slice(11, 16)}</p>
                </div>
              </div>

              {/* Notes */}
              {(selectedEvent.confirmation_note || selectedEvent.doctor_note) && (
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1"><FileText className="w-3.5 h-3.5 text-gray-400" /><p className="text-[10px] font-semibold text-gray-400 uppercase">{t('common.notes', 'Notes')}</p></div>
                  <p className="text-sm text-gray-600">{selectedEvent.confirmation_note || selectedEvent.doctor_note}</p>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleQuickAction('start')} disabled={!!actionLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50">
                  {actionLoading === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  {t('crm.calendar.startExam', 'Start Exam')}
                </button>
                <button onClick={() => handleQuickAction('call')} disabled={!!actionLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50">
                  {actionLoading === 'call' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                  {t('crm.calendar.callPatient', 'Call Patient')}
                </button>
                {selectedEvent.appointment_type === 'online' && (
                  <button onClick={() => handleQuickAction('telehealth')} disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-all shadow-sm disabled:opacity-50">
                    <Video className="w-4 h-4" />
                    {t('crm.calendar.joinTelehealth', 'Join Telehealth')}
                  </button>
                )}
                {selectedEvent.status === 'pending' && (
                  <button onClick={() => handleQuickAction('confirm')} disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50">
                    {actionLoading === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {t('crm.calendar.confirmAppt', 'Confirm')}
                  </button>
                )}
                {selectedEvent.status !== 'cancelled' && selectedEvent.status !== 'completed' && (
                  <button onClick={() => handleQuickAction('cancel')} disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all disabled:opacity-50">
                    {actionLoading === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                    {t('crm.calendar.cancelAppt', 'Cancel')}
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">
                {t('common.close', 'Close')}
              </button>
              <button onClick={() => { setShowModal(false); navigate(`/crm/patient-360?id=${selectedEvent.patient?.id || selectedEvent.patient_id}`); }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
                <ExternalLink className="w-3.5 h-3.5" />
                {t('crm.calendar.goToPatient', 'Go to Patient')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom FullCalendar Styles ─── */}
      <style>{`
        .smart-calendar-wrapper .fc {
          font-family: inherit;
          --fc-border-color: #E5E7EB;
          --fc-today-bg-color: rgba(13, 148, 136, 0.04);
          --fc-now-indicator-color: #EF4444;
          --fc-event-border-color: transparent;
        }
        .smart-calendar-wrapper .fc .fc-col-header-cell {
          padding: 10px 0;
          background: #F9FAFB;
          border-bottom: 2px solid #E5E7EB;
        }
        .smart-calendar-wrapper .fc .fc-col-header-cell-cushion {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-decoration: none;
        }
        .smart-calendar-wrapper .fc .fc-timegrid-slot-label-cushion {
          font-size: 11px;
          font-weight: 500;
          color: #9CA3AF;
        }
        .smart-calendar-wrapper .fc .fc-timegrid-event {
          border-radius: 8px;
          border-left-width: 3px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
        }
        .smart-calendar-wrapper .fc .fc-timegrid-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 10 !important;
        }
        .smart-calendar-wrapper .fc .fc-daygrid-event {
          border-radius: 6px;
          border-left-width: 3px;
          padding: 2px 4px;
          cursor: pointer;
        }
        .smart-calendar-wrapper .fc .fc-timegrid-now-indicator-line {
          border-color: #EF4444;
          border-width: 2px;
        }
        .smart-calendar-wrapper .fc .fc-timegrid-now-indicator-arrow {
          border-color: #EF4444;
        }
        .smart-calendar-wrapper .fc .fc-day-today {
          background-color: var(--fc-today-bg-color) !important;
        }
        .smart-calendar-wrapper .fc .fc-scrollgrid {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #E5E7EB;
        }
        .smart-calendar-wrapper .fc .fc-scrollgrid td:last-child {
          border-right: none;
        }
        .smart-calendar-wrapper .fc .fc-timegrid-slot {
          height: 3em;
        }
        .smart-calendar-wrapper .fc .fc-event-dragging {
          opacity: 0.7;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .smart-calendar-wrapper .fc .closed-hours-bg {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 5px,
            rgba(156,163,175,0.08) 5px,
            rgba(156,163,175,0.08) 10px
          );
        }
        .smart-calendar-wrapper .fc .break-hours-bg {
          background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(251,191,36,0.06) 4px,
            rgba(251,191,36,0.06) 8px
          );
        }
      `}</style>
    </div>
  );
};

export default CRMSmartCalendar;
