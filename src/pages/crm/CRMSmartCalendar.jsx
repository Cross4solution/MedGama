import React, { useState, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X, User, Mail, Phone, FileText, Clock, CalendarDays,
  MapPin, Video, Globe, Stethoscope, Scissors, HeartPulse,
  ChevronLeft, ChevronRight, Plus, Filter, RefreshCw,
  ExternalLink, Building2, AlertCircle,
} from 'lucide-react';

// ─── Appointment Categories & Color Codes ────────────────────
const CATEGORY_CONFIG = {
  examination: { label: 'examination', color: '#3B82F6', bgColor: '#EFF6FF', borderColor: '#3B82F6', icon: Stethoscope },
  surgery:     { label: 'surgery',     color: '#EF4444', bgColor: '#FEF2F2', borderColor: '#EF4444', icon: Scissors },
  checkup:     { label: 'checkup',     color: '#10B981', bgColor: '#ECFDF5', borderColor: '#10B981', icon: HeartPulse },
  consultation:{ label: 'consultation',color: '#8B5CF6', bgColor: '#F5F3FF', borderColor: '#8B5CF6', icon: FileText },
  followUp:    { label: 'followUp',    color: '#F59E0B', bgColor: '#FFFBEB', borderColor: '#F59E0B', icon: RefreshCw },
};

// ─── Source Types (Med-Gama sync indicator) ──────────────────
const SOURCE_CONFIG = {
  platform: { label: 'platform', icon: Globe,     color: '#0D9488', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  manual:   { label: 'manual',   icon: User,      color: '#6B7280', bg: 'bg-gray-50 text-gray-600 border-gray-200' },
  external: { label: 'external', icon: Building2,  color: '#7C3AED', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
};

// ─── Mock Calendar Events ────────────────────────────────────
const MOCK_EVENTS = [
  { id: '1',  title: 'Zeynep Kaya',       start: '2026-02-16T09:00:00', end: '2026-02-16T09:30:00', category: 'examination',  source: 'platform', patient: { name: 'Zeynep Kaya', age: 34, gender: 'F', email: 'zeynep@mail.com', phone: '+90 532 111 2233', id: 'P001' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Annual physical exam', status: 'confirmed' },
  { id: '2',  title: 'Ali Yilmaz',        start: '2026-02-16T09:30:00', end: '2026-02-16T10:00:00', category: 'followUp',     source: 'platform', patient: { name: 'Ali Yilmaz', age: 45, gender: 'M', email: 'ali@mail.com', phone: '+90 533 222 3344', id: 'P002' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Post-surgery follow-up', status: 'confirmed' },
  { id: '3',  title: 'Selin Acar',        start: '2026-02-16T10:00:00', end: '2026-02-16T10:45:00', category: 'consultation', source: 'manual',   patient: { name: 'Selin Acar', age: 28, gender: 'F', email: 'selin@mail.com', phone: '+90 534 333 4455', id: 'P003' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Dermatology consultation', status: 'in-progress' },
  { id: '4',  title: 'Mehmet Ozkan',      start: '2026-02-16T11:00:00', end: '2026-02-16T12:00:00', category: 'surgery',      source: 'platform', patient: { name: 'Mehmet Ozkan', age: 52, gender: 'M', email: 'mehmet@mail.com', phone: '+90 535 444 5566', id: 'P004' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Minor surgical procedure — local anesthesia', status: 'upcoming' },
  { id: '5',  title: 'Ayse Demir',        start: '2026-02-16T13:00:00', end: '2026-02-16T13:30:00', category: 'checkup',      source: 'external', patient: { name: 'Ayse Demir', age: 38, gender: 'F', email: 'ayse@mail.com', phone: '+90 536 555 6677', id: 'P005' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Routine check-up', status: 'upcoming' },
  { id: '6',  title: 'Burak Sahin',       start: '2026-02-16T14:00:00', end: '2026-02-16T14:30:00', category: 'examination',  source: 'platform', patient: { name: 'Burak Sahin', age: 29, gender: 'M', email: 'burak@mail.com', phone: '+90 537 666 7788', id: 'P006' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Initial assessment — new patient', status: 'upcoming' },
  { id: '7',  title: 'Elif Arslan',       start: '2026-02-16T15:00:00', end: '2026-02-16T16:00:00', category: 'surgery',      source: 'manual',   patient: { name: 'Elif Arslan', age: 42, gender: 'F', email: 'elif@mail.com', phone: '+90 538 777 8899', id: 'P007' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Endoscopy procedure', status: 'upcoming' },
  { id: '8',  title: 'Can Yildiz',        start: '2026-02-17T09:00:00', end: '2026-02-17T09:30:00', category: 'checkup',      source: 'platform', patient: { name: 'Can Yildiz', age: 55, gender: 'M', email: 'can@mail.com', phone: '+90 539 888 9900', id: 'P008' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Blood pressure monitoring', status: 'upcoming' },
  { id: '9',  title: 'Deniz Korkmaz',     start: '2026-02-17T10:00:00', end: '2026-02-17T10:30:00', category: 'followUp',     source: 'external', patient: { name: 'Deniz Korkmaz', age: 33, gender: 'F', email: 'deniz@mail.com', phone: '+90 540 111 2233', id: 'P009' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Medication adjustment follow-up', status: 'upcoming' },
  { id: '10', title: 'Pinar Dogan',       start: '2026-02-17T11:00:00', end: '2026-02-17T12:00:00', category: 'consultation', source: 'platform', patient: { name: 'Pinar Dogan', age: 47, gender: 'F', email: 'pinar@mail.com', phone: '+90 541 222 3344', id: 'P010' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Cardiology referral review', status: 'upcoming' },
  { id: '11', title: 'Serkan Aydin',      start: '2026-02-18T09:00:00', end: '2026-02-18T10:00:00', category: 'examination',  source: 'manual',   patient: { name: 'Serkan Aydin', age: 39, gender: 'M', email: 'serkan@mail.com', phone: '+90 542 333 4455', id: 'P011' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Thyroid panel review', status: 'upcoming' },
  { id: '12', title: 'Fatma Koc',         start: '2026-02-19T09:30:00', end: '2026-02-19T10:00:00', category: 'followUp',     source: 'platform', patient: { name: 'Fatma Koc', age: 61, gender: 'F', email: 'fatma@mail.com', phone: '+90 543 444 5566', id: 'P012' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Diabetes management follow-up', status: 'upcoming' },
  { id: '13', title: 'Hakan Celik',       start: '2026-02-18T14:00:00', end: '2026-02-18T15:30:00', category: 'surgery',      source: 'platform', patient: { name: 'Hakan Celik', age: 48, gender: 'M', email: 'hakan@mail.com', phone: '+90 544 555 6677', id: 'P013' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Arthroscopy — right knee', status: 'upcoming' },
  { id: '14', title: 'Merve Ozturk',      start: '2026-02-19T13:00:00', end: '2026-02-19T13:30:00', category: 'checkup',      source: 'external', patient: { name: 'Merve Ozturk', age: 26, gender: 'F', email: 'merve@mail.com', phone: '+90 545 666 7788', id: 'P014' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Pre-employment health screening', status: 'upcoming' },
  { id: '15', title: 'Emre Kara',         start: '2026-02-20T10:00:00', end: '2026-02-20T10:45:00', category: 'examination',  source: 'manual',   patient: { name: 'Emre Kara', age: 36, gender: 'M', email: 'emre@mail.com', phone: '+90 546 777 8899', id: 'P015' }, doctor: 'Dr. Ahmet Yilmaz', notes: 'Skin lesion evaluation', status: 'upcoming' },
];

// ─── Status Badge ────────────────────────────────────────────
const StatusBadge = ({ status, t }) => {
  const cfg = {
    confirmed:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    upcoming:      'bg-amber-50 text-amber-700 border-amber-200',
    cancelled:     'bg-red-50 text-red-600 border-red-200',
    completed:     'bg-gray-50 text-gray-600 border-gray-200',
  };
  const labels = {
    confirmed: t('crm.calendar.confirmed', 'Confirmed'),
    'in-progress': t('crm.appointments.inProgress'),
    upcoming: t('crm.appointments.upcoming'),
    cancelled: t('crm.appointments.cancelled'),
    completed: t('common.completed'),
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg[status] || cfg.upcoming}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CRMSmartCalendar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  const [events, setEvents] = useState(MOCK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentView, setCurrentView] = useState('timeGridWeek');

  // Convert mock events to FullCalendar format
  const calendarEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
        if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
        return true;
      })
      .map((e) => {
        const cat = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG.examination;
        return {
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          backgroundColor: cat.bgColor,
          borderColor: cat.borderColor,
          textColor: cat.color,
          extendedProps: { ...e },
        };
      });
  }, [events, categoryFilter, sourceFilter]);

  // Drag & Drop handler
  const handleEventDrop = useCallback((info) => {
    const { event } = info;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, start: event.start.toISOString(), end: event.end.toISOString() }
          : e
      )
    );
  }, []);

  // Resize handler
  const handleEventResize = useCallback((info) => {
    const { event } = info;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, start: event.start.toISOString(), end: event.end.toISOString() }
          : e
      )
    );
  }, []);

  // Click handler — open modal
  const handleEventClick = useCallback((info) => {
    const ep = info.event.extendedProps;
    setSelectedEvent(ep);
    setShowModal(true);
  }, []);

  // Navigate to patient detail
  const goToPatient = (patientId) => {
    setShowModal(false);
    navigate(`/crm/patients?id=${patientId}`);
  };

  // Calendar navigation helpers
  const goToday = () => calendarRef.current?.getApi().today();
  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();
  const changeView = (view) => {
    calendarRef.current?.getApi().changeView(view);
    setCurrentView(view);
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      todayCount: events.filter((e) => e.start.slice(0, 10) === today).length,
      weekSurgeries: events.filter((e) => e.category === 'surgery').length,
      platformCount: events.filter((e) => e.source === 'platform').length,
      manualCount: events.filter((e) => e.source === 'manual').length,
    };
  }, [events]);

  // Custom event render
  const renderEventContent = (eventInfo) => {
    const ep = eventInfo.event.extendedProps;
    const cat = CATEGORY_CONFIG[ep.category] || CATEGORY_CONFIG.examination;
    const src = SOURCE_CONFIG[ep.source] || SOURCE_CONFIG.manual;
    const CatIcon = cat.icon;
    const SrcIcon = src.icon;

    return (
      <div className="flex items-start gap-1.5 px-1.5 py-1 w-full overflow-hidden cursor-pointer group">
        <CatIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: cat.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold truncate" style={{ color: cat.color }}>
              {eventInfo.event.title}
            </span>
            <SrcIcon className="w-3 h-3 flex-shrink-0 opacity-60" style={{ color: src.color }} />
          </div>
          <p className="text-[10px] opacity-70 truncate" style={{ color: cat.color }}>
            {eventInfo.timeText}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.calendar.title', 'Smart Calendar')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.calendar.subtitle', 'Manage all operations from a single calendar')}</p>
        </div>
        <button
          onClick={() => navigate('/crm/appointments')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          {t('crm.appointments.newAppointment')}
        </button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('crm.calendar.todayAppointments', "Today's Appointments"), value: stats.todayCount, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CalendarDays },
          { label: t('crm.calendar.weeklySurgeries', 'Weekly Surgeries'), value: stats.weekSurgeries, color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: Scissors },
          { label: t('crm.calendar.platformBookings', 'Platform Bookings'), value: stats.platformCount, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: Globe },
          { label: t('crm.calendar.manualEntries', 'Manual Entries'), value: stats.manualCount, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: User },
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

      {/* ─── Legend & Filters ─── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          {/* Color Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('crm.calendar.legend', 'Legend')}:</span>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    categoryFilter === key
                      ? 'ring-2 ring-offset-1 shadow-sm'
                      : categoryFilter === 'all'
                      ? 'opacity-90 hover:opacity-100'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{
                    backgroundColor: cfg.bgColor,
                    borderColor: cfg.borderColor,
                    color: cfg.color,
                    ...(categoryFilter === key ? { ringColor: cfg.color } : {}),
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(`crm.calendar.${cfg.label}`, cfg.label)}
                </button>
              );
            })}
          </div>

          {/* Source Filter & View Toggle */}
          <div className="flex items-center gap-2">
            {/* Source filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">{t('crm.calendar.allSources', 'All Sources')}</option>
                <option value="platform">{t('crm.calendar.platformSource', 'Med-Gama Platform')}</option>
                <option value="manual">{t('crm.calendar.manualSource', 'Manual Entry')}</option>
                <option value="external">{t('crm.calendar.externalSource', 'External')}</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: 'timeGridDay', label: t('crm.calendar.day', 'Day') },
                { key: 'timeGridWeek', label: t('crm.calendar.week', 'Week') },
                { key: 'dayGridMonth', label: t('crm.calendar.month', 'Month') },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => changeView(v.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentView === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Sync Indicator Legend ─── */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-50 bg-gray-50/50">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('crm.calendar.syncSource', 'Source')}:</span>
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border ${cfg.bg}`}>
                <Icon className="w-3 h-3" />
                {t(`crm.calendar.source_${key}`, key === 'platform' ? 'Med-Gama' : key === 'manual' ? 'Manual' : 'External')}
              </div>
            );
          })}
        </div>

        {/* ─── Calendar Navigation ─── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200">
              {t('crm.appointments.today')}
            </button>
            <button onClick={goNext} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <AlertCircle className="w-3.5 h-3.5" />
            {t('crm.calendar.dragHint', 'Drag & drop to reschedule appointments')}
          </div>
        </div>

        {/* ─── FullCalendar ─── */}
        <div className="p-4 smart-calendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate="2026-02-16"
            headerToolbar={false}
            events={calendarEvents}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
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

      {/* ─── Appointment Detail Modal ─── */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with category color bar */}
            <div
              className="rounded-t-2xl px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: CATEGORY_CONFIG[selectedEvent.category]?.bgColor || '#F3F4F6' }}
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const CatIcon = CATEGORY_CONFIG[selectedEvent.category]?.icon || Stethoscope;
                  return (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${CATEGORY_CONFIG[selectedEvent.category]?.color}20` }}
                    >
                      <CatIcon className="w-5 h-5" style={{ color: CATEGORY_CONFIG[selectedEvent.category]?.color }} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-base font-bold text-gray-900">{t('crm.appointments.appointmentDetails')}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_CONFIG[selectedEvent.category]?.color}15`,
                        color: CATEGORY_CONFIG[selectedEvent.category]?.color,
                      }}
                    >
                      {String(t(`crm.calendar.${selectedEvent.category}`, selectedEvent.category))}
                    </span>
                    {(() => {
                      const src = SOURCE_CONFIG[selectedEvent.source] || SOURCE_CONFIG.manual;
                      const SrcIcon = src.icon;
                      return (
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${src.bg}`}>
                          <SrcIcon className="w-3 h-3" />
                          {String(t(`crm.calendar.source_${selectedEvent.source}`, selectedEvent.source))}
                        </span>
                      );
                    })()}
                  </div>
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
                  {selectedEvent.patient?.name?.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900">{selectedEvent.patient?.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedEvent.patient?.gender === 'F' ? t('crm.patients.female', 'Female') : t('crm.patients.male', 'Male')}, {selectedEvent.patient?.age} {t('crm.calendar.yearsOld', 'years old')}
                  </p>
                </div>
                <StatusBadge status={selectedEvent.status} t={t} />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('common.date')}</p>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{selectedEvent.start?.slice(0, 10)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('common.time')}</p>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {selectedEvent.start?.slice(11, 16)} – {selectedEvent.end?.slice(11, 16)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('common.email')}</p>
                  </div>
                  <p className="text-sm text-gray-800 font-medium truncate">{selectedEvent.patient?.email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('common.phone')}</p>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{selectedEvent.patient?.phone}</p>
                </div>
              </div>

              {/* Doctor */}
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('common.doctor')}</p>
                </div>
                <p className="text-sm text-gray-800 font-medium">{selectedEvent.doctor}</p>
              </div>

              {/* Notes */}
              {selectedEvent.notes && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('common.notes')}</p>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => goToPatient(selectedEvent.patient?.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm"
              >
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
      `}</style>
    </div>
  );
};

export default CRMSmartCalendar;
