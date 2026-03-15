import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, CalendarDays, DollarSign, TrendingUp, Clock,
  Search, ChevronLeft, ChevronRight, Star, Loader2, UserPlus,
  UserMinus, Eye, Edit3, X, CheckCircle2, AlertTriangle,
  Activity, BarChart3, Briefcase, Percent, FileText, ArrowUpRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { clinicManagerAPI } from '../../lib/api';

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (v) => {
  if (v == null) return '0';
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtInt = (v) => Number(v || 0).toLocaleString();

const StatCard = ({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-gray-200/60 p-4 hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <p className="text-xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const RatingStars = ({ rating, size = 'w-3 h-3' }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} className={`${size} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
    ))}
  </span>
);

// ─── Overview Tab ────────────────────────────────────────────
const OverviewTab = ({ t }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicManagerAPI.overview()
      .then(res => setData(res?.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-teal-500 animate-spin" /></div>;
  if (!data) return <p className="text-center text-gray-400 py-12">{t('crm.manager.noData', 'No data available')}</p>;

  const stats = [
    { icon: Users, label: t('crm.manager.doctors', 'Doctors'), value: fmtInt(data.doctor_count), iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
    { icon: Users, label: t('crm.manager.patients', 'Patients'), value: fmtInt(data.patient_count), iconBg: 'bg-teal-50', iconColor: 'text-teal-500' },
    { icon: CalendarDays, label: t('crm.manager.todayAppts', 'Today'), value: fmtInt(data.today_appointments), sub: t('crm.manager.appointments', 'appointments'), iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { icon: CalendarDays, label: t('crm.manager.monthAppts', 'This Month'), value: fmtInt(data.month_appointments), sub: t('crm.manager.appointments', 'appointments'), iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
    { icon: Activity, label: t('crm.manager.occupancy', 'Occupancy Rate'), value: `${data.occupancy_rate}%`, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { icon: DollarSign, label: t('crm.manager.monthRevenue', 'Month Revenue'), value: `€${fmt(data.month_revenue)}`, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { icon: DollarSign, label: t('crm.manager.totalRevenue', 'Total Revenue'), value: `€${fmt(data.total_revenue)}`, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { icon: Clock, label: t('crm.manager.pending', 'Pending'), value: `€${fmt(data.pending_amount)}`, iconBg: 'bg-red-50', iconColor: 'text-red-500' },
  ];

  const statusMap = {
    confirmed: { label: t('crm.manager.confirmed', 'Confirmed'), color: 'bg-blue-500' },
    completed: { label: t('crm.manager.completed', 'Completed'), color: 'bg-emerald-500' },
    cancelled: { label: t('crm.manager.cancelled', 'Cancelled'), color: 'bg-red-400' },
    no_show:   { label: t('crm.manager.noShow', 'No Show'), color: 'bg-gray-400' },
    pending:   { label: t('crm.manager.pendingStatus', 'Pending'), color: 'bg-amber-400' },
  };
  const breakdown = data.status_breakdown || {};
  const breakdownTotal = Object.values(breakdown).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Clinic Info */}
      {data.clinic && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{data.clinic.name}</h2>
              <p className="text-sm text-teal-100">{t('crm.manager.managedBy', 'Managed by')} {data.clinic.owner}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">{t('crm.manager.apptBreakdown', 'Appointment Status (This Month)')}</h3>
        <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
          {Object.entries(breakdown).map(([status, count]) => (
            <div key={status} className={`${statusMap[status]?.color || 'bg-gray-300'} transition-all`}
              style={{ width: `${(count / breakdownTotal) * 100}%` }} title={`${statusMap[status]?.label || status}: ${count}`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(breakdown).map(([status, count]) => (
            <span key={status} className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <span className={`w-2 h-2 rounded-full ${statusMap[status]?.color || 'bg-gray-300'}`} />
              {statusMap[status]?.label || status}: <strong>{count}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Weekly Trend */}
      {data.weekly_trend?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">{t('crm.manager.weeklyTrend', 'Weekly Appointment Trend')}</h3>
          <div className="flex items-end gap-2 h-24">
            {data.weekly_trend.map((w, i) => {
              const max = Math.max(...data.weekly_trend.map(x => x.count || 0), 1);
              const height = ((w.count || 0) / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-gray-700">{w.count}</span>
                  <div className="w-full bg-teal-500 rounded-t-lg transition-all" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="text-[9px] text-gray-400">{w.week?.split('-')[1] ? `W${w.week.split('-')[1]}` : `W${i + 1}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Doctor Detail Modal ─────────────────────────────────────
const DoctorDetailModal = ({ doctorId, onClose, t }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicManagerAPI.doctorDetail(doctorId)
      .then(res => setData(res?.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  );
  if (!data) return null;

  const doc = data.doctor || {};
  const profile = doc.doctor_profile || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{t('crm.manager.doctorPerformance', 'Doctor Performance')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Doctor Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center text-xl font-bold text-violet-600">
              {doc.fullname?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{doc.fullname}</h3>
              <p className="text-xs text-gray-500">{profile.specialty} · {profile.experience_years || 0} {t('crm.manager.yearsExp', 'years exp.')}</p>
              <div className="flex items-center gap-2 mt-1">
                <RatingStars rating={data.reviews?.avg_rating || 0} />
                <span className="text-xs text-gray-500">{data.reviews?.avg_rating || 0} ({data.reviews?.review_count || 0})</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-700">{fmtInt(data.appointments?.total)}</p>
              <p className="text-[10px] text-blue-500">{t('crm.manager.totalAppts', 'Total Appointments')}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">€{fmt(data.revenue?.total)}</p>
              <p className="text-[10px] text-emerald-500">{t('crm.manager.totalRevenue', 'Total Revenue')}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-700">€{fmt(data.revenue?.month)}</p>
              <p className="text-[10px] text-amber-500">{t('crm.manager.monthRevenue', 'Month Revenue')}</p>
            </div>
          </div>

          {/* Revenue Trend */}
          {data.revenue?.trend?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">{t('crm.manager.revenueTrend', 'Revenue Trend (6 months)')}</h4>
              <div className="flex items-end gap-1.5 h-20">
                {data.revenue.trend.map((m, i) => {
                  const max = Math.max(...data.revenue.trend.map(x => x.revenue || 0), 1);
                  const h = ((m.revenue || 0) / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] font-medium text-gray-500">€{Math.round(m.revenue || 0)}</span>
                      <div className="w-full bg-teal-500 rounded-t-lg" style={{ height: `${Math.max(h, 3)}%` }} />
                      <span className="text-[8px] text-gray-400">{m.period?.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          {data.reviews?.recent?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">{t('crm.manager.recentReviews', 'Recent Reviews')}</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.reviews.recent.slice(0, 5).map(r => (
                  <div key={r.id} className="bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={r.rating} />
                      <span className="text-[10px] text-gray-500">{r.patient?.fullname}</span>
                    </div>
                    {r.comment && <p className="text-xs text-gray-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operating Hours */}
          {profile.operating_hours?.length === 7 && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2">{t('crm.manager.operatingHours', 'Operating Hours')}</h4>
              <div className="grid grid-cols-7 gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const h = profile.operating_hours[i];
                  const active = h?.is_active || h?.start;
                  return (
                    <div key={day} className={`text-center rounded-lg py-1.5 ${active ? 'bg-teal-50' : 'bg-gray-50'}`}>
                      <p className="text-[10px] font-semibold text-gray-600">{day}</p>
                      <p className="text-[9px] text-gray-400">{active ? `${h.start || '09:00'}-${h.end || '17:00'}` : 'Off'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Doctors Tab ─────────────────────────────────────────────
const DoctorsTab = ({ t }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const perPage = 10;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      const res = await clinicManagerAPI.doctors(params);
      const d = res?.data || res;
      setDoctors(d?.data || []);
      setTotal(d?.total || 0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 max-w-sm">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input type="text" placeholder={t('crm.manager.searchDoctors', 'Search doctors...')} value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-full" />
      </div>

      {/* Doctor List */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-7 h-7 text-teal-500 animate-spin" /></div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium">{t('crm.manager.noDoctors', 'No doctors found')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">{t('crm.manager.doctor', 'Doctor')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">{t('crm.manager.specialty', 'Specialty')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase text-center">{t('crm.manager.appts', 'Appts')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase text-right">{t('crm.manager.revenue', 'Revenue')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase text-center">{t('crm.manager.rating', 'Rating')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase text-center">{t('crm.manager.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {doctors.map(doc => {
                    const s = doc.stats || {};
                    const profile = doc.doctor_profile || {};
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-sm font-bold text-violet-600 flex-shrink-0">
                              {doc.fullname?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{doc.fullname}</p>
                              <p className="text-[10px] text-gray-400">{doc.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{profile.specialty || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-gray-900">{fmtInt(s.appointments?.total)}</span>
                          <span className="text-[10px] text-gray-400 block">{fmtInt(s.appointments?.month)} {t('crm.manager.thisMonth', 'this mo.')}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-gray-900">€{fmt(s.revenue?.total)}</span>
                          <span className="text-[10px] text-gray-400 block">€{fmt(s.revenue?.month)} {t('crm.manager.thisMonth', 'this mo.')}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <RatingStars rating={s.reviews?.avg_rating || 0} />
                            <span className="text-[10px] text-gray-400 mt-0.5">{s.reviews?.avg_rating || 0} ({s.reviews?.count || 0})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setSelectedDoctor(doc.id)}
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
                            <Eye className="w-3.5 h-3.5" />{t('crm.manager.viewDetail', 'Detail')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}</p>
                <div className="flex items-center gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center disabled:opacity-40"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedDoctor && <DoctorDetailModal doctorId={selectedDoctor} onClose={() => setSelectedDoctor(null)} t={t} />}
    </div>
  );
};

// ─── Financials Tab ──────────────────────────────────────────
const FinancialsTab = ({ t }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicManagerAPI.financials()
      .then(res => setData(res?.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-teal-500 animate-spin" /></div>;
  if (!data) return <p className="text-center text-gray-400 py-12">{t('crm.manager.noData', 'No data available')}</p>;

  const commPct = (data.commission_rate * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label={t('crm.manager.grossRevenue', 'Gross Revenue')} value={`€${fmt(data.gross_revenue)}`} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard icon={Percent} label={t('crm.manager.commission', `Commission (${commPct}%)`)} value={`€${fmt(data.commission)}`} iconBg="bg-red-50" iconColor="text-red-500" />
        <StatCard icon={Briefcase} label={t('crm.manager.netPayout', 'Net Payout')} value={`€${fmt(data.net_payout)}`} iconBg="bg-teal-50" iconColor="text-teal-600" />
        <StatCard icon={Clock} label={t('crm.manager.pendingPayments', 'Pending')} value={`€${fmt(data.pending_amount)}`} sub={`${data.pending_count} ${t('crm.manager.invoices', 'invoices')}`} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Monthly Breakdown Table */}
      {data.monthly?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">{t('crm.manager.monthlyBreakdown', 'Monthly Breakdown')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">{t('crm.manager.period', 'Period')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-right">{t('crm.manager.gross', 'Gross')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-right">{t('crm.manager.commShort', 'Comm.')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-right">{t('crm.manager.net', 'Net')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-center">{t('crm.manager.invoiceCount', 'Invoices')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.monthly.map(m => (
                  <tr key={m.period} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-700">{m.period}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-900 text-right font-semibold">€{fmt(m.gross)}</td>
                    <td className="px-4 py-2.5 text-xs text-red-500 text-right">-€{fmt(m.commission)}</td>
                    <td className="px-4 py-2.5 text-xs text-teal-600 text-right font-semibold">€{fmt(m.net)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 text-center">{m.invoice_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctor Revenue Breakdown */}
      {data.doctor_revenue?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">{t('crm.manager.revenueByDoctor', 'Revenue by Doctor')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">{t('crm.manager.doctor', 'Doctor')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-right">{t('crm.manager.gross', 'Gross')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-right">{t('crm.manager.commShort', 'Comm.')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-right">{t('crm.manager.net', 'Net')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase text-center">{t('crm.manager.invoiceCount', 'Invoices')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.doctor_revenue.map(dr => (
                  <tr key={dr.doctor_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-xs font-bold text-violet-600">{dr.fullname?.charAt(0)}</div>
                        <span className="text-xs font-medium text-gray-900">{dr.fullname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-900 text-right font-semibold">€{fmt(dr.total_revenue)}</td>
                    <td className="px-4 py-2.5 text-xs text-red-500 text-right">-€{fmt(dr.commission)}</td>
                    <td className="px-4 py-2.5 text-xs text-teal-600 text-right font-semibold">€{fmt(dr.net)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 text-center">{dr.invoice_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CRMClinicManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview',   label: t('crm.manager.tabOverview', 'Overview'),   icon: BarChart3 },
    { id: 'doctors',    label: t('crm.manager.tabDoctors', 'Doctors'),     icon: Users },
    { id: 'financials', label: t('crm.manager.tabFinancials', 'Financials'), icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.manager.title', 'Clinic Management')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('crm.manager.subtitle', 'Manage your clinic, doctors and finances')}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab t={t} />}
      {activeTab === 'doctors' && <DoctorsTab t={t} />}
      {activeTab === 'financials' && <FinancialsTab t={t} />}
    </div>
  );
};

export default CRMClinicManager;
