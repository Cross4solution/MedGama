import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DollarSign, TrendingUp, Download, CreditCard, Banknote,
  ChevronLeft, ChevronRight, Search, PieChart as PieChartIcon,
  BarChart3, Receipt, Loader2, RefreshCw, Wallet, ArrowRightLeft,
  FileSpreadsheet, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { billingAPI, financeAPI } from '../../lib/api';
import ProTeaser from '../../components/crm/ProTeaser';
import { exportPDF, exportExcel } from '../../utils/exportUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────
const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', TRY: '₺', GBP: '£' };
const fmt = (v, cur = 'EUR') => {
  const sym = CURRENCY_SYMBOLS[cur] || cur + ' ';
  return `${sym}${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const fmtK = (v, cur = 'EUR') => {
  const sym = CURRENCY_SYMBOLS[cur] || cur + ' ';
  if (v >= 1000) return `${sym}${(v / 1000).toFixed(1)}k`;
  return `${sym}${Number(v || 0).toFixed(0)}`;
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#6366F1'];

const PaymentStatusBadge = ({ status }) => {
  const c = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    partial: 'bg-blue-50 text-blue-700 border-blue-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${c[status] || c.pending}`}>{status}</span>;
};

// ─── Main Component ──────────────────────────────────────────
const CRMRevenue = () => {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();

  const isSuperAdmin = user?.role === 'superAdmin' || user?.role_id === 'superAdmin' || user?.role === 'saasAdmin' || user?.role_id === 'saasAdmin';

  // State
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [currency, setCurrency] = useState('EUR');
  const [currencies, setCurrencies] = useState(['EUR']);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [payout, setPayout] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const perPage = 8;

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch all data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes, servicesRes, payoutRes] = await Promise.all([
        billingAPI.stats({ currency }).catch(() => ({ data: null })),
        billingAPI.revenueChart({ period, currency }).catch(() => ({ data: [] })),
        financeAPI.topServices({ currency, limit: 8 }).catch(() => ({ data: [] })),
        financeAPI.payout({ currency }).catch(() => ({ data: null })),
      ]);

      const sd = statsRes?.data || statsRes;
      setStats(sd);
      if (sd?.available_currencies?.length) setCurrencies(sd.available_currencies);

      const cd = chartRes?.data || chartRes;
      setChartData(Array.isArray(cd) ? cd : []);

      const svd = servicesRes?.data || servicesRes;
      setTopServices(Array.isArray(svd) ? svd : []);

      const pd = payoutRes?.data || payoutRes;
      setPayout(pd);

      // Fetch platform overview if superadmin
      if (isSuperAdmin) {
        const platformRes = await financeAPI.platformOverview({ currency }).catch(() => ({ data: null }));
        setPlatformData(platformRes?.data || platformRes);
      }
    } catch (err) {
      console.error('Finance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currency, period, isSuperAdmin]);

  // ── Fetch invoices ──
  const fetchInvoices = useCallback(async () => {
    try {
      const params = { per_page: perPage, page: invoicePage };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await billingAPI.invoices(params);
      const d = res?.data || res;
      setInvoices(d?.data || []);
      setInvoiceTotal(d?.total || d?.meta?.total || 0);
    } catch (err) {
      console.error('Invoice list error:', err);
    }
  }, [invoicePage, statusFilter, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const totalPages = Math.ceil(invoiceTotal / perPage);

  // ── Build export payload from current data ──
  const buildExportData = () => {
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    const summaryCards = [
      { label: 'Total Revenue', value: `${sym}${Number(stats?.total_revenue || 0).toLocaleString()}` },
      { label: 'This Month', value: `${sym}${Number(stats?.monthly_revenue || 0).toLocaleString()}` },
      { label: 'Pending', value: fmt(stats?.pending_amount || 0, currency) },
      { label: 'Receivable', value: fmt(stats?.receivable_amount || 0, currency) },
    ];

    const tables = [];

    // Revenue Trend table
    if (chartData.length > 0) {
      tables.push({
        title: 'Revenue Trend',
        headers: ['Period', `Revenue (${currency})`],
        rows: chartData.map(d => [d.label || '', fmt(d.total || 0, currency)]),
      });
    }

    // Top Services table
    if (topServices.length > 0) {
      tables.push({
        title: 'Top Services',
        headers: ['Service', `Revenue (${currency})`, 'Share (%)'],
        rows: topServices.map(s => [s.category || 'Other', fmt(s.total_revenue, currency), `${s.percent || 0}%`]),
      });
    }

    // Payout breakdown
    if (payout?.monthly?.length > 0) {
      tables.push({
        title: 'Payout Summary',
        headers: ['Period', 'Gross', 'Commission', 'Net', 'Invoices'],
        rows: payout.monthly.map(m => [m.period, fmt(m.gross, currency), fmt(m.commission, currency), fmt(m.net, currency), String(m.invoice_count || 0)]),
      });
    }

    // Recent Invoices table
    if (invoices.length > 0) {
      tables.push({
        title: 'Recent Invoices',
        headers: ['Invoice #', 'Patient', 'Date', 'Amount', 'Paid', 'Status'],
        rows: invoices.map(inv => [
          inv.invoice_number || '',
          inv.patient?.fullname || '—',
          inv.issue_date || '',
          fmt(inv.grand_total, inv.currency),
          fmt(inv.paid_amount, inv.currency),
          inv.status || '',
        ]),
      });
    }

    return { summaryCards, tables };
  };

  const handleExportPDF = () => {
    setExporting(true);
    setExportOpen(false);
    try {
      const { summaryCards, tables } = buildExportData();
      exportPDF({
        title: 'Revenue & Finance Report',
        subtitle: `Currency: ${currency} — Period: ${period} — ${new Date().toLocaleDateString()}`,
        summary: summaryCards,
        tables,
        filename: `revenue-report-${currency.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) {
      console.error('PDF Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    setExporting(true);
    setExportOpen(false);
    try {
      const { summaryCards, tables } = buildExportData();
      exportExcel({
        title: 'Revenue & Finance',
        summary: summaryCards,
        tables,
        filename: `revenue-report-${currency.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    } catch (err) {
      console.error('Excel Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  // ── Pie chart data for top services ──
  const pieData = useMemo(() => {
    return topServices.map((s, i) => ({
      name: s.category || 'Other',
      value: s.total_revenue,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [topServices]);

  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="revenue" />;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.revenue.title', 'Revenue & Finance')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.revenue.subtitle', 'Track income, payments and financial reports')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-200">
            <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer">
              {currencies.map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c] || c})</option>)}
            </select>
          </div>
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[
              { key: 'daily', label: t('crm.revenue.daily', 'Daily') },
              { key: 'weekly', label: t('crm.revenue.week', 'Week') },
              { key: 'monthly', label: t('crm.revenue.month', 'Month') },
            ].map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{p.label}</button>
            ))}
          </div>
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button onClick={() => setExportOpen(p => !p)} disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('common.export', 'Export')}</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-200/60 z-30 overflow-hidden animate-fadeIn">
                <button onClick={handleExportPDF}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Export as PDF</span>
                </button>
                <button onClick={handleExportExcel}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Export as Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: t('crm.revenue.totalRevenue', 'Total Revenue'), value: fmtK(stats?.total_revenue || 0, currency), icon: DollarSign, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
          { label: t('crm.revenue.monthlyRev', 'This Month'), value: fmtK(stats?.monthly_revenue || 0, currency), icon: TrendingUp, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
          { label: t('common.pending', 'Pending'), value: fmt(stats?.pending_amount || 0, currency), icon: Receipt, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
          { label: t('crm.revenue.receivable', 'Receivable'), value: fmt(stats?.receivable_amount || 0, currency), icon: Banknote, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 sm:p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Charts Row (Recharts) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">{t('crm.revenue.monthlyRevenue', 'Revenue Trend')}</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-600">{fmt(chartData.reduce((s, d) => s + (d.total || 0), 0), currency)}</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v, currency)} />
                <Tooltip formatter={(v) => fmt(v, currency)} labelStyle={{ fontSize: 12, fontWeight: 600 }} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="total" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">{t('common.noData', 'No data available')}</div>
          )}
        </div>

        {/* Top Services Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">{t('crm.revenue.topServices', 'Top Services')}</h2>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {topServices.slice(0, 5).map((s, i) => (
                  <div key={s.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-700 font-medium">{s.category || 'Other'}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{fmt(s.total_revenue, currency)} ({s.percent}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">{t('common.noData', 'No data')}</div>
          )}
        </div>
      </div>

      {/* ─── Payout / Hakediş Section ─── */}
      {payout && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Wallet className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">{t('crm.revenue.payoutSummary', 'Payout Summary (Hakediş)')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
            <div className="bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
              <p className="text-[10px] font-semibold text-emerald-500 uppercase">{t('crm.revenue.grossRevenue', 'Gross Revenue')}</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">{fmt(payout.gross_revenue, currency)}</p>
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              <p className="text-[10px] font-semibold text-red-500 uppercase">{t('crm.revenue.commission', 'Platform Commission')} ({(payout.commission_rate * 100).toFixed(0)}%)</p>
              <p className="text-lg font-bold text-red-600 mt-1">-{fmt(payout.commission, currency)}</p>
            </div>
            <div className="bg-teal-50 rounded-xl px-4 py-3 border border-teal-100">
              <p className="text-[10px] font-semibold text-teal-500 uppercase">{t('crm.revenue.netPayout', 'Net Payout')}</p>
              <p className="text-lg font-bold text-teal-700 mt-1">{fmt(payout.net_payout, currency)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">{t('crm.revenue.monthlyBreakdown', 'Periods')}</p>
              <p className="text-lg font-bold text-gray-700 mt-1">{payout.monthly?.length || 0}</p>
            </div>
          </div>
          {/* Monthly payout breakdown */}
          {payout.monthly?.length > 0 && (
            <div className="overflow-x-auto border-t border-gray-100">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase px-5 py-2.5">{t('crm.revenue.period', 'Period')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase px-3 py-2.5">{t('crm.revenue.gross', 'Gross')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase px-3 py-2.5">{t('crm.revenue.commission', 'Commission')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase px-5 py-2.5">{t('crm.revenue.net', 'Net')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase px-3 py-2.5">{t('crm.revenue.invoiceCount', 'Invoices')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payout.monthly.map((m) => (
                    <tr key={m.period} className="hover:bg-gray-50/50">
                      <td className="px-5 py-2.5 text-sm font-medium text-gray-900">{m.period}</td>
                      <td className="px-3 py-2.5 text-sm text-right text-gray-700">{fmt(m.gross, currency)}</td>
                      <td className="px-3 py-2.5 text-sm text-right text-red-500">-{fmt(m.commission, currency)}</td>
                      <td className="px-5 py-2.5 text-sm text-right font-semibold text-teal-700">{fmt(m.net, currency)}</td>
                      <td className="px-3 py-2.5 text-sm text-right text-gray-500">{m.invoice_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── SuperAdmin Platform Overview ─── */}
      {isSuperAdmin && platformData && (
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <CreditCard className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-bold text-gray-900">{t('crm.revenue.platformOverview', 'Platform Finance Overview')}</h2>
            <span className="ml-auto text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">SUPER ADMIN</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">{t('crm.revenue.totalPlatformRevenue', 'Total Platform Revenue')}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{fmt(platformData.total_gross_revenue, currency)}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-violet-200 shadow-sm">
              <p className="text-[10px] font-semibold text-violet-500 uppercase">{t('crm.revenue.totalCommission', 'Platform Commission')}</p>
              <p className="text-lg font-bold text-violet-700 mt-1">{fmt(platformData.total_commission, currency)}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-amber-200 shadow-sm">
              <p className="text-[10px] font-semibold text-amber-500 uppercase">{t('crm.revenue.pendingPayments', 'Pending Payments')}</p>
              <p className="text-lg font-bold text-amber-700 mt-1">{fmt(platformData.pending_amount, currency)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{platformData.pending_count} {t('crm.revenue.invoices', 'invoices')}</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">{t('crm.revenue.totalInvoices', 'Total Invoices')}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{platformData.total_invoices}</p>
            </div>
          </div>

          {/* Top Doctors */}
          {platformData.top_doctors?.length > 0 && (
            <div className="px-5 pb-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">{t('crm.revenue.topDoctors', 'Top Revenue Doctors')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {platformData.top_doctors.slice(0, 6).map((d, i) => (
                  <div key={d.doctor_id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{d.fullname}</p>
                      <p className="text-[10px] text-gray-400">{d.invoice_count} inv.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">{fmt(d.total_revenue, currency)}</p>
                      <p className="text-[10px] text-violet-500">{t('crm.revenue.comm', 'Comm')}: {fmt(d.commission, currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Recent Invoices Table ─── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{t('crm.revenue.recentTransactions', 'Recent Transactions')}</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder={t('common.search', 'Search...')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setInvoicePage(1); }}
                className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-full" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setInvoicePage(1); }}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600">
              <option value="all">{t('crm.revenue.allStatus', 'All Status')}</option>
              <option value="paid">{t('crm.revenue.paid', 'Paid')}</option>
              <option value="pending">{t('common.pending', 'Pending')}</option>
              <option value="partial">{t('crm.revenue.partial', 'Partial')}</option>
              <option value="cancelled">{t('common.cancelled', 'Cancelled')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('crm.revenue.invoice', 'Invoice')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.patient', 'Patient')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.date', 'Date')}</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.amount', 'Amount')}</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.revenue.paidAmt', 'Paid')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('common.status', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3"><span className="text-xs font-mono font-medium text-teal-600">{inv.invoice_number}</span></td>
                  <td className="px-3 py-3"><p className="text-sm font-medium text-gray-900">{inv.patient?.fullname || '—'}</p></td>
                  <td className="px-3 py-3"><span className="text-xs text-gray-600">{inv.issue_date}</span></td>
                  <td className="px-3 py-3 text-right"><span className="text-sm font-bold text-gray-900">{fmt(inv.grand_total, inv.currency)}</span></td>
                  <td className="px-3 py-3 text-right"><span className="text-sm text-emerald-600">{fmt(inv.paid_amount, inv.currency)}</span></td>
                  <td className="px-5 py-3"><PaymentStatusBadge status={inv.status} /></td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">{t('common.noData', 'No data')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">{t('common.showing', 'Showing')} {(invoicePage - 1) * perPage + 1}–{Math.min(invoicePage * perPage, invoiceTotal)} / {invoiceTotal}</p>
            <div className="flex items-center gap-1">
              <button disabled={invoicePage === 1} onClick={() => setInvoicePage(p => p - 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setInvoicePage(page)} className={`w-8 h-8 rounded-lg text-xs font-medium ${page === invoicePage ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
              ))}
              <button disabled={invoicePage === totalPages} onClick={() => setInvoicePage(p => p + 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMRevenue;
