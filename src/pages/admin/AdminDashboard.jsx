import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Calendar, FileText, ShieldCheck, ShieldAlert, AlertTriangle,
  TrendingUp, UserCheck, UserX, Building2, BarChart3, Stethoscope, Activity,
  DollarSign, Crown, Megaphone, Wrench, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminAPI } from '../../lib/api';

const COLORS = {
  indigo: '#6366F1', teal: '#0D9488', purple: '#8B5CF6', blue: '#3B82F6',
  amber: '#F59E0B', emerald: '#10B981', red: '#EF4444', rose: '#F43F5E',
};

function StatCard({ icon: Icon, label, value, color = 'teal', sub, to, highlight }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };
  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};
  return (
    <Wrapper {...wrapperProps} className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all block ${highlight ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200/60'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Wrapper>
  );
}

function ChartTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    Promise.all([
      adminAPI.dashboard().then(res => res?.data?.data || res?.data || res),
      adminAPI.growthTrend().then(res => res?.data?.data || res?.data || res).catch(() => null),
    ]).then(([dash, trend]) => {
      setData(dash);
      setGrowth(trend);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  const u = data?.users || {};
  const c = data?.clinics || {};
  const a = data?.appointments || {};
  const m = data?.medstream || {};

  // Appointment breakdown for pie chart
  const appointmentPieData = [
    { name: t('admin.dashboard.completed', 'Completed'), value: a.completed || 0, color: COLORS.emerald },
    { name: t('admin.dashboard.confirmed', 'Confirmed'), value: a.confirmed || 0, color: COLORS.teal },
    { name: t('admin.dashboard.pending', 'Pending'), value: a.pending || 0, color: COLORS.amber },
    { name: t('admin.dashboard.cancelled', 'Cancelled'), value: a.cancelled || 0, color: COLORS.red },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            {t('admin.dashboard.title', 'Command Center')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('admin.dashboard.period', 'Period')}: {data?.period || t('admin.dashboard.currentMonth', 'This month')}
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMaintenanceMode(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              maintenanceMode
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            {maintenanceMode ? 'Maintenance ON' : 'Maintenance Mode'}
          </button>
          <button
            onClick={() => setAnnouncementOpen(v => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Megaphone className="w-3.5 h-3.5" />
            Announce
          </button>
        </div>
      </div>

      {/* Global Announcement Panel */}
      {announcementOpen && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-purple-600" /> Publish Global Announcement
          </h3>
          <textarea
            value={announcementText}
            onChange={e => setAnnouncementText(e.target.value)}
            placeholder="Type your announcement message here..."
            rows={3}
            className="w-full border border-purple-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setAnnouncementOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={() => { setAnnouncementOpen(false); setAnnouncementText(''); }}
              disabled={!announcementText.trim()}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-40 shadow-sm"
            >
              Publish
            </button>
          </div>
        </div>
      )}

      {/* Top KPI Cards — 4 Primary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Revenue" value={data?.revenue?.total || '—'} color="emerald" sub="All time" highlight to="/admin/financials" />
        <StatCard icon={Crown} label="Active Pro" value={data?.revenue?.active_pro || u.doctors || '—'} color="purple" sub="Subscriptions" highlight to="/admin/financials" />
        <StatCard icon={ShieldAlert} label="Pending Docs" value={u.unverified_doctors || 0} color="amber" sub="Awaiting review" to="/admin/verification" />
        <StatCard icon={Calendar} label="Today's Appts" value={a.today || a.completed || 0} color="indigo" sub="Completed today" />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label={t('admin.dashboard.totalUsers', 'Total Users')} value={u.total} color="blue" to="/admin/users" />
        <StatCard icon={Stethoscope} label={t('admin.dashboard.doctors', 'Doctors')} value={u.doctors} color="teal" sub={`${u.verified_doctors || 0} verified`} to="/admin/verification" />
        <StatCard icon={UserCheck} label={t('admin.dashboard.patients', 'Patients')} value={u.patients} color="emerald" />
        <StatCard icon={Building2} label={t('admin.dashboard.clinics', 'Clinics')} value={c.total} color="purple" sub={`+${c.new_this_month || 0} this month`} />
        <StatCard icon={Calendar} label={t('admin.dashboard.appointments', 'Appointments')} value={a.total} color="indigo" sub="This month" />
        <StatCard icon={TrendingUp} label={t('admin.dashboard.newUsers', 'New Users')} value={u.new_this_month} color="amber" sub="This month" />
      </div>

      {/* Verification Alert */}
      {u.unverified_doctors > 0 && (
        <Link to="/admin/verification" className="block rounded-2xl border border-amber-200 bg-amber-50/80 p-4 hover:bg-amber-50 transition-colors group">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {u.unverified_doctors} {t('admin.dashboard.pendingVerification', 'doctor(s) awaiting verification')}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{t('admin.dashboard.clickToReview', 'Click to review')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      )}

      {/* Charts Row: Growth Trend + Appointment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Growth Area Chart — 2/3 width */}
        {growth && growth.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('admin.dashboard.growthTrend', 'User Growth Trend (Last 12 Months)')}
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={growth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDoctors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClinics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="users" name={t('admin.dashboard.newUsersLegend', 'New Users')} stroke={COLORS.indigo} fill="url(#gradUsers)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="doctors" name={t('admin.dashboard.newDoctorsLegend', 'New Doctors')} stroke={COLORS.teal} fill="url(#gradDoctors)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="clinics" name={t('admin.dashboard.newClinicsLegend', 'New Clinics')} stroke={COLORS.purple} fill="url(#gradClinics)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Appointment Pie Chart — 1/3 width */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('admin.dashboard.appointmentBreakdown', 'Appointment Breakdown')}
            </h2>
          </div>
          {appointmentPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={appointmentPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {appointmentPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              {t('admin.dashboard.noAppointments', 'No appointments yet this month')}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Registration Bar Chart */}
      {growth && growth.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('admin.dashboard.monthlyRegistrations', 'Monthly Registrations')}
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="patients" name={t('admin.dashboard.patients', 'Patients')} fill={COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="doctors" name={t('admin.dashboard.doctors', 'Doctors')} fill={COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="clinics" name={t('admin.dashboard.clinics', 'Clinics')} fill={COLORS.purple} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom Row: Appointment Stats + MedStream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Appointment Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            {t('admin.dashboard.appointmentsThisMonth', 'Appointments (This Month)')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Calendar} label={t('admin.dashboard.totalAppt', 'Total')} value={a.total} color="blue" />
            <StatCard icon={ShieldCheck} label={t('admin.dashboard.completed', 'Completed')} value={a.completed} color="emerald" />
            <StatCard icon={Calendar} label={t('admin.dashboard.pending', 'Pending')} value={a.pending} color="amber" />
            <StatCard icon={AlertTriangle} label={t('admin.dashboard.cancelled', 'Cancelled')} value={a.cancelled} color="red" />
          </div>
        </div>

        {/* MedStream Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">MedStream</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={FileText} label={t('admin.dashboard.totalPosts', 'Total Posts')} value={m.total_posts} color="blue" />
            <StatCard
              icon={AlertTriangle}
              label={t('admin.dashboard.pendingReports', 'Pending Reports')}
              value={m.pending_reports}
              color={m.pending_reports > 0 ? 'red' : 'emerald'}
              to={m.pending_reports > 0 ? '/admin/moderation' : undefined}
            />
          </div>
          {m.pending_reports > 0 && (
            <Link to="/admin/moderation" className="mt-3 block bg-white rounded-2xl border border-red-200 p-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-red-700 flex-1">{t('admin.dashboard.reviewReports', 'Review Reports')} →</span>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
