import React, { useState, useMemo, useEffect } from 'react';
import { appointmentAPI } from '../../lib/api';
import {
  CalendarDays,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Phone,
  Video,
  MapPin,
  MoreVertical,
  Plus,
  Filter,
  Bell,
  FileText,
  Stethoscope,
  Activity,
  ClipboardCheck,
  ArrowUpRight,
  Eye,
  MessageSquare,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

// ─── Mock Data ───────────────────────────────────────────────
const TODAY = new Date();
const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const MOCK_STATS = [
  { label: "Today's Appointments", value: 12, change: '+2', trend: 'up', icon: CalendarDays, color: 'blue', bgColor: 'bg-blue-50', iconColor: 'text-blue-600', borderColor: 'border-blue-100' },
  { label: 'Pending Approvals', value: 5, change: '-1', trend: 'down', icon: Clock, color: 'amber', bgColor: 'bg-amber-50', iconColor: 'text-amber-600', borderColor: 'border-amber-100' },
  { label: "Today's Revenue", value: '€2,450', change: '+18%', trend: 'up', icon: DollarSign, color: 'emerald', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
  { label: 'Total Patients', value: 1284, change: '+24', trend: 'up', icon: Users, color: 'violet', bgColor: 'bg-violet-50', iconColor: 'text-violet-600', borderColor: 'border-violet-100' },
];

const MOCK_APPOINTMENTS = [
  { id: 1, time: '09:00', endTime: '09:30', patient: 'Zeynep Kaya', age: 34, type: 'Check-up', status: 'completed', method: 'in-person', avatar: null, notes: 'Annual physical exam' },
  { id: 2, time: '09:30', endTime: '10:00', patient: 'Ali Yilmaz', age: 45, type: 'Follow-up', status: 'completed', method: 'video', avatar: null, notes: 'Post-surgery follow-up' },
  { id: 3, time: '10:00', endTime: '10:30', patient: 'Selin Acar', age: 28, type: 'Consultation', status: 'in-progress', method: 'in-person', avatar: null, notes: 'Dermatology consultation' },
  { id: 4, time: '10:30', endTime: '11:00', patient: 'Mehmet Ozkan', age: 52, type: 'Lab Review', status: 'upcoming', method: 'phone', avatar: null, notes: 'Blood test results review' },
  { id: 5, time: '11:00', endTime: '11:30', patient: 'Ayse Demir', age: 38, type: 'Check-up', status: 'upcoming', method: 'in-person', avatar: null, notes: 'Routine check-up' },
  { id: 6, time: '11:30', endTime: '12:00', patient: 'Fatma Koc', age: 61, type: 'Follow-up', status: 'upcoming', method: 'video', avatar: null, notes: 'Diabetes management' },
  { id: 7, time: '13:00', endTime: '13:30', patient: 'Burak Sahin', age: 29, type: 'New Patient', status: 'upcoming', method: 'in-person', avatar: null, notes: 'Initial assessment' },
  { id: 8, time: '14:00', endTime: '14:45', patient: 'Elif Arslan', age: 42, type: 'Procedure', status: 'upcoming', method: 'in-person', avatar: null, notes: 'Minor procedure scheduled' },
  { id: 9, time: '15:00', endTime: '15:30', patient: 'Can Yildiz', age: 55, type: 'Consultation', status: 'cancelled', method: 'video', avatar: null, notes: 'Cancelled by patient' },
  { id: 10, time: '15:30', endTime: '16:00', patient: 'Deniz Korkmaz', age: 33, type: 'Follow-up', status: 'upcoming', method: 'phone', avatar: null, notes: 'Medication adjustment' },
  { id: 11, time: '16:00', endTime: '16:30', patient: 'Pinar Dogan', age: 47, type: 'Check-up', status: 'upcoming', method: 'in-person', avatar: null, notes: 'Cardiology referral review' },
  { id: 12, time: '16:30', endTime: '17:00', patient: 'Serkan Aydin', age: 39, type: 'Lab Review', status: 'upcoming', method: 'in-person', avatar: null, notes: 'Thyroid panel review' },
];

const MOCK_URGENT_NOTES = [
  { id: 1, type: 'critical', from: 'MedaGama System', message: 'Lab results for Mehmet Ozkan show abnormal values — requires immediate review.', time: '8 min ago', read: false },
  { id: 2, type: 'warning', from: 'Secretary', message: 'Patient Fatma Koc requested urgent appointment reschedule for tomorrow.', time: '25 min ago', read: false },
  { id: 3, type: 'info', from: 'MedaGama', message: 'New prescription regulation update effective from March 1st. Please review.', time: '1 hour ago', read: true },
  { id: 4, type: 'warning', from: 'Secretary', message: 'Insurance pre-authorization pending for Elif Arslan procedure.', time: '2 hours ago', read: true },
  { id: 5, type: 'info', from: 'System', message: 'Monthly report for January is ready for review.', time: '3 hours ago', read: true },
];

const MOCK_RECENT_PATIENTS = [
  { name: 'Zeynep Kaya', lastVisit: 'Today', condition: 'Healthy', risk: 'low' },
  { name: 'Ali Yilmaz', lastVisit: 'Today', condition: 'Post-Op', risk: 'medium' },
  { name: 'Selin Acar', lastVisit: 'Today', condition: 'Under Review', risk: 'low' },
  { name: 'Mehmet Ozkan', lastVisit: '3 days ago', condition: 'Abnormal Labs', risk: 'high' },
  { name: 'Fatma Koc', lastVisit: '1 week ago', condition: 'Diabetes Mgmt', risk: 'medium' },
];

const WEEKLY_REVENUE = [
  { day: 'Mon', amount: 1800 },
  { day: 'Tue', amount: 2200 },
  { day: 'Wed', amount: 1950 },
  { day: 'Thu', amount: 2450 },
  { day: 'Fri', amount: 0 },
  { day: 'Sat', amount: 0 },
  { day: 'Sun', amount: 0 },
];

// ─── Sub-components ──────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const config = {
    completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'in-progress': { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' },
    upcoming: { label: 'Upcoming', className: 'bg-gray-50 text-gray-600 border-gray-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200 line-through' },
    'no-show': { label: 'No Show', className: 'bg-orange-50 text-orange-600 border-orange-200' },
  };
  const c = config[status] || config.upcoming;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.className}`}>{c.label}</span>;
};

const MethodIcon = ({ method }) => {
  if (method === 'video') return <Video className="w-3.5 h-3.5 text-sky-500" />;
  if (method === 'phone') return <Phone className="w-3.5 h-3.5 text-violet-500" />;
  return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
};

const RiskBadge = ({ risk }) => {
  const config = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${config[risk] || config.low}`}>{risk}</span>;
};

// ─── Main Dashboard ──────────────────────────────────────────

const CRMDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [apiAppointments, setApiAppointments] = useState(null);

  useEffect(() => {
    appointmentAPI.list({ per_page: 50 }).then(res => {
      const list = res?.data || [];
      if (list.length > 0) {
        setApiAppointments(list.map(a => ({
          id: a.id,
          date: a.appointment_date,
          time: a.appointment_time || '09:00',
          endTime: '',
          patient: a.patient?.fullname || 'Patient',
          age: '',
          type: a.appointment_type === 'online' ? 'Video Call' : 'In-Person',
          status: a.status || 'upcoming',
          method: a.appointment_type === 'online' ? 'video' : 'in-person',
          notes: a.confirmation_note || a.doctor_note || '',
          doctor: a.doctor?.fullname || '',
        })));
      }
    }).catch(() => {});
  }, []);

  const appointments = apiAppointments || MOCK_APPOINTMENTS;

  const filteredAppointments = useMemo(() => {
    if (appointmentFilter === 'all') return appointments;
    return appointments.filter((a) => a.status === appointmentFilter);
  }, [appointmentFilter, appointments]);

  const maxRevenue = Math.max(...WEEKLY_REVENUE.map((d) => d.amount), 1);
  const todayIndex = TODAY.getDay() === 0 ? 6 : TODAY.getDay() - 1; // Mon=0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Good {TODAY.getHours() < 12 ? 'Morning' : TODAY.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Doctor'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(TODAY)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/crm/appointments"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            {t('crm.dashboard.newAppointment')}
          </Link>
          <button className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {MOCK_STATS.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl border ${stat.borderColor} p-4 sm:p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Appointments + Right Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Appointments List — 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">{t('crm.dashboard.todayAppointments')}</h2>
                <p className="text-[11px] text-gray-400">{MOCK_APPOINTMENTS.length} appointments</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { key: 'all', label: 'All' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'in-progress', label: 'Active' },
                { key: 'completed', label: 'Done' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAppointmentFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    appointmentFilter === f.key
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appointment Rows */}
          <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
            {filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CalendarDays className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">{t('crm.dashboard.noAppointments')}</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group ${
                    apt.status === 'in-progress' ? 'bg-blue-50/30 border-l-2 border-l-blue-500' : ''
                  } ${apt.status === 'cancelled' ? 'opacity-50' : ''}`}
                >
                  {/* Time */}
                  <div className="w-14 sm:w-16 flex-shrink-0 text-center">
                    <p className={`text-sm font-bold ${apt.status === 'in-progress' ? 'text-blue-600' : 'text-gray-900'}`}>{apt.time}</p>
                    <p className="text-[10px] text-gray-400">{apt.endTime}</p>
                  </div>

                  {/* Divider */}
                  <div className={`w-0.5 h-10 rounded-full flex-shrink-0 ${
                    apt.status === 'completed' ? 'bg-emerald-300' :
                    apt.status === 'in-progress' ? 'bg-blue-400' :
                    apt.status === 'cancelled' ? 'bg-red-300' :
                    'bg-gray-200'
                  }`} />

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                    {apt.patient.split(' ').map((n) => n[0]).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient}</p>
                      <MethodIcon method={apt.method} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-500">{apt.type}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[11px] text-gray-400">Age {apt.age}</span>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={apt.status} />
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <Link to="/crm/appointments" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              {t('crm.dashboard.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Urgent Notes */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-red-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t('crm.dashboard.urgentAlerts')}</h2>
              </div>
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {MOCK_URGENT_NOTES.filter((n) => !n.read).length} new
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {MOCK_URGENT_NOTES.map((note) => (
                <div key={note.id} className={`px-5 py-3 hover:bg-gray-50/50 transition-colors ${!note.read ? 'bg-red-50/20' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      note.type === 'critical' ? 'bg-red-100' : note.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {note.type === 'critical' ? <AlertTriangle className="w-3 h-3 text-red-600" /> :
                       note.type === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-600" /> :
                       <Activity className="w-3 h-3 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-semibold text-gray-700">{note.from}</span>
                        <span className="text-[10px] text-gray-400">{note.time}</span>
                        {!note.read && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{note.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
              <button className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">{t('crm.dashboard.viewAll')}</button>
            </div>
          </div>

          {/* Weekly Revenue Chart */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t('crm.dashboard.weeklyRevenue')}</h2>
              </div>
              <span className="text-xs font-semibold text-emerald-600">€8,400</span>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-end justify-between gap-2 h-28">
                {WEEKLY_REVENUE.map((d, i) => {
                  const h = d.amount > 0 ? Math.max(12, (d.amount / maxRevenue) * 100) : 4;
                  const isToday = i === todayIndex;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-gray-500">
                        {d.amount > 0 ? `€${(d.amount / 1000).toFixed(1)}k` : '—'}
                      </span>
                      <div
                        className={`w-full max-w-[32px] rounded-lg transition-all ${
                          isToday ? 'bg-gradient-to-t from-teal-600 to-teal-400 shadow-sm shadow-teal-200' :
                          d.amount > 0 ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                      <span className={`text-[10px] font-medium ${isToday ? 'text-teal-600 font-bold' : 'text-gray-400'}`}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t('crm.dashboard.recentPatients')}</h2>
              </div>
              <Link to="/crm/patients" className="text-xs font-semibold text-teal-600 hover:text-teal-700">{t('crm.dashboard.viewAll')}</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {MOCK_RECENT_PATIENTS.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold flex-shrink-0">
                    {p.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.lastVisit} · {p.condition}</p>
                  </div>
                  <RiskBadge risk={p.risk} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">{t('crm.dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {[
            { label: 'New Patient', icon: UserPlus, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100', path: '/crm/patients' },
            { label: 'Write Prescription', icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', path: '/crm/prescriptions' },
            { label: 'Start Video Call', icon: Video, color: 'bg-sky-50 text-sky-600 hover:bg-sky-100', path: '/crm/appointments' },
            { label: 'View Reports', icon: FileText, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100', path: '/crm/reports' },
            { label: 'Send Message', icon: MessageSquare, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100', path: '/crm/messages' },
            { label: 'Revenue Report', icon: DollarSign, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100', path: '/crm/revenue' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${action.color} border border-transparent hover:border-gray-200 hover:shadow-sm`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
