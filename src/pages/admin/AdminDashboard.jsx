import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Calendar, FileText, ShieldCheck, ShieldAlert, AlertTriangle,
  TrendingUp, UserCheck, UserX, Building2, BarChart3, Stethoscope, Activity,
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

function StatCard({ icon: Icon, label, value, color = 'teal', sub, to }) {
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
    <Wrapper {...wrapperProps} className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow block">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
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
        <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            {t('admin.dashboard.title', 'Platform Dashboard')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('admin.dashboard.period', 'Dönem')}: {data?.period || t('admin.dashboard.currentMonth', 'Bu ay')}
          </p>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label={t('admin.dashboard.totalUsers', 'Toplam Kullanıcı')} value={u.total} color="blue" to="/admin/users" />
        <StatCard icon={Stethoscope} label={t('admin.dashboard.doctors', 'Doktor')} value={u.doctors} color="teal" sub={`${u.verified_doctors || 0} ${t('admin.dashboard.verifiedSuffix', 'doğrulanmış')}`} to="/admin/verification" />
        <StatCard icon={UserCheck} label={t('admin.dashboard.patients', 'Hasta')} value={u.patients} color="emerald" />
        <StatCard icon={Building2} label={t('admin.dashboard.clinics', 'Klinik')} value={c.total} color="purple" sub={`+${c.new_this_month || 0} ${t('admin.dashboard.thisMonth', 'bu ay')}`} />
        <StatCard icon={Calendar} label={t('admin.dashboard.appointments', 'Randevu')} value={a.total} color="indigo" sub={t('admin.dashboard.thisMonth', 'bu ay')} />
        <StatCard icon={TrendingUp} label={t('admin.dashboard.newUsers', 'Yeni Kullanıcı')} value={u.new_this_month} color="amber" sub={t('admin.dashboard.thisMonth', 'bu ay')} />
      </div>

      {/* Verification Alert */}
      {u.unverified_doctors > 0 && (
        <Link to="/admin/verification" className="block rounded-2xl border border-amber-200 bg-amber-50/80 p-4 hover:bg-amber-50 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {u.unverified_doctors} {t('admin.dashboard.pendingVerification', 'doktor onay bekliyor')}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{t('admin.dashboard.clickToReview', 'İncelemek için tıklayın')}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Charts Row: Growth Trend + Appointment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Growth Area Chart — 2/3 width */}
        {growth && growth.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('admin.dashboard.growthTrend', 'Aylık Büyüme Trendi (Son 12 Ay)')}
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
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Area type="monotone" dataKey="users" name={t('admin.dashboard.newUsersLegend', 'Yeni Kullanıcı')} stroke={COLORS.indigo} fill="url(#gradUsers)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="doctors" name={t('admin.dashboard.newDoctorsLegend', 'Yeni Doktor')} stroke={COLORS.teal} fill="url(#gradDoctors)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="clinics" name={t('admin.dashboard.newClinicsLegend', 'Yeni Klinik')} stroke={COLORS.purple} fill="url(#gradClinics)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Appointment Pie Chart — 1/3 width */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('admin.dashboard.appointmentBreakdown', 'Randevu Dağılımı')}
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
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              {t('admin.dashboard.noAppointments', 'Bu ay henüz randevu yok')}
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
              {t('admin.dashboard.monthlyRegistrations', 'Aylık Kayıt Sayıları')}
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="patients" name={t('admin.dashboard.patients', 'Hasta')} fill={COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="doctors" name={t('admin.dashboard.doctors', 'Doktor')} fill={COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="clinics" name={t('admin.dashboard.clinics', 'Klinik')} fill={COLORS.purple} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom Row: Appointment Stats + MedStream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Appointment Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            {t('admin.dashboard.appointmentsThisMonth', 'Randevular (Bu Ay)')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Calendar} label={t('admin.dashboard.totalAppt', 'Toplam')} value={a.total} color="blue" />
            <StatCard icon={ShieldCheck} label={t('admin.dashboard.completed', 'Tamamlanan')} value={a.completed} color="emerald" />
            <StatCard icon={Calendar} label={t('admin.dashboard.pending', 'Bekleyen')} value={a.pending} color="amber" />
            <StatCard icon={AlertTriangle} label={t('admin.dashboard.cancelled', 'İptal')} value={a.cancelled} color="red" />
          </div>
        </div>

        {/* MedStream Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">MedStream</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={FileText} label={t('admin.dashboard.totalPosts', 'Toplam Gönderi')} value={m.total_posts} color="blue" />
            <StatCard
              icon={AlertTriangle}
              label={t('admin.dashboard.pendingReports', 'Bekleyen Şikayet')}
              value={m.pending_reports}
              color={m.pending_reports > 0 ? 'red' : 'emerald'}
              to={m.pending_reports > 0 ? '/admin/moderation' : undefined}
            />
          </div>
          {m.pending_reports > 0 && (
            <Link to="/admin/moderation" className="mt-3 block bg-white rounded-2xl border border-red-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-red-700">{t('admin.dashboard.reviewReports', 'Şikayetleri İncele')} →</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
