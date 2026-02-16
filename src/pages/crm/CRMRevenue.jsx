import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter,
  CreditCard, Banknote, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight,
  Eye, FileText, Search, PieChart, BarChart3, Receipt,
} from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 1, date: '2026-02-16', patient: 'Zeynep Kaya', type: 'Consultation', amount: 350, method: 'Credit Card', status: 'paid', invoice: 'INV-2026-0048' },
  { id: 2, date: '2026-02-16', patient: 'Ali Yilmaz', type: 'Follow-up', amount: 200, method: 'Insurance', status: 'paid', invoice: 'INV-2026-0047' },
  { id: 3, date: '2026-02-16', patient: 'Selin Acar', type: 'Consultation', amount: 450, method: 'Credit Card', status: 'paid', invoice: 'INV-2026-0046' },
  { id: 4, date: '2026-02-16', patient: 'Mehmet Ozkan', type: 'Lab Review', amount: 150, method: 'Cash', status: 'pending', invoice: 'INV-2026-0045' },
  { id: 5, date: '2026-02-16', patient: 'Ayse Demir', type: 'Check-up', amount: 300, method: 'Insurance', status: 'pending', invoice: 'INV-2026-0044' },
  { id: 6, date: '2026-02-15', patient: 'Fatma Koc', type: 'Follow-up', amount: 200, method: 'Credit Card', status: 'paid', invoice: 'INV-2026-0043' },
  { id: 7, date: '2026-02-15', patient: 'Elif Arslan', type: 'Procedure', amount: 1200, method: 'Insurance', status: 'paid', invoice: 'INV-2026-0042' },
  { id: 8, date: '2026-02-15', patient: 'Can Yildiz', type: 'Consultation', amount: 350, method: 'Credit Card', status: 'refunded', invoice: 'INV-2026-0041' },
  { id: 9, date: '2026-02-14', patient: 'Deniz Korkmaz', type: 'Follow-up', amount: 200, method: 'Cash', status: 'paid', invoice: 'INV-2026-0040' },
  { id: 10, date: '2026-02-14', patient: 'Pinar Dogan', type: 'Check-up', amount: 300, method: 'Insurance', status: 'paid', invoice: 'INV-2026-0039' },
  { id: 11, date: '2026-02-13', patient: 'Serkan Aydin', type: 'Lab Review', amount: 150, method: 'Credit Card', status: 'paid', invoice: 'INV-2026-0038' },
  { id: 12, date: '2026-02-13', patient: 'Burak Sahin', type: 'New Patient', amount: 500, method: 'Cash', status: 'paid', invoice: 'INV-2026-0037' },
  { id: 13, date: '2026-02-12', patient: 'Zeynep Kaya', type: 'Follow-up', amount: 200, method: 'Credit Card', status: 'paid', invoice: 'INV-2026-0036' },
  { id: 14, date: '2026-02-11', patient: 'Ali Yilmaz', type: 'Procedure', amount: 2500, method: 'Insurance', status: 'paid', invoice: 'INV-2026-0035' },
  { id: 15, date: '2026-02-10', patient: 'Mehmet Ozkan', type: 'Consultation', amount: 350, method: 'Cash', status: 'overdue', invoice: 'INV-2026-0034' },
];

const MONTHLY_DATA = [
  { month: 'Sep', revenue: 18500 },
  { month: 'Oct', revenue: 22300 },
  { month: 'Nov', revenue: 19800 },
  { month: 'Dec', revenue: 24100 },
  { month: 'Jan', revenue: 21700 },
  { month: 'Feb', revenue: 8450 },
];

const REVENUE_BY_TYPE = [
  { type: 'Consultation', amount: 4200, percent: 32, color: 'bg-blue-500' },
  { type: 'Procedure', amount: 3700, percent: 28, color: 'bg-emerald-500' },
  { type: 'Follow-up', amount: 2400, percent: 18, color: 'bg-violet-500' },
  { type: 'Check-up', amount: 1500, percent: 12, color: 'bg-amber-500' },
  { type: 'Lab Review', amount: 800, percent: 6, color: 'bg-pink-500' },
  { type: 'New Patient', amount: 500, percent: 4, color: 'bg-cyan-500' },
];

const PaymentStatusBadge = ({ status }) => {
  const c = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${c[status] || c.pending}`}>{status}</span>;
};

const CRMRevenue = () => {
  const [period, setPeriod] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    return MOCK_TRANSACTIONS.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery && !t.patient.toLowerCase().includes(searchQuery.toLowerCase()) && !t.invoice.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const stats = useMemo(() => {
    const paid = MOCK_TRANSACTIONS.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
    const pending = MOCK_TRANSACTIONS.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);
    const overdue = MOCK_TRANSACTIONS.filter(t => t.status === 'overdue').reduce((s, t) => s + t.amount, 0);
    const refunded = MOCK_TRANSACTIONS.filter(t => t.status === 'refunded').reduce((s, t) => s + t.amount, 0);
    return { total: paid + pending, paid, pending, overdue, refunded };
  }, []);

  const maxMonthly = Math.max(...MONTHLY_DATA.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Revenue & Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track income, payments and financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {['week', 'month', 'year'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{p}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Revenue', value: `€${(stats.total / 1000).toFixed(1)}k`, change: '+18%', trend: 'up', icon: DollarSign, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
          { label: 'Collected', value: `€${(stats.paid / 1000).toFixed(1)}k`, change: '+12%', trend: 'up', icon: CreditCard, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
          { label: 'Pending', value: `€${stats.pending}`, change: '2 invoices', trend: 'neutral', icon: Receipt, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
          { label: 'Overdue', value: `€${stats.overdue}`, change: '1 invoice', trend: 'down', icon: Banknote, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 sm:p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <span className={`text-xs font-semibold ${s.trend === 'up' ? 'text-emerald-600' : s.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                {s.change}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Monthly Revenue</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-600">€{MONTHLY_DATA.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-40">
            {MONTHLY_DATA.map((d, i) => {
              const h = Math.max(8, (d.revenue / maxMonthly) * 100);
              const isLast = i === MONTHLY_DATA.length - 1;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-500">€{(d.revenue / 1000).toFixed(1)}k</span>
                  <div className={`w-full max-w-[40px] rounded-lg transition-all ${isLast ? 'bg-gradient-to-t from-teal-600 to-teal-400 shadow-sm shadow-teal-200' : 'bg-gray-200 hover:bg-gray-300'}`} style={{ height: `${h}%` }} />
                  <span className={`text-[10px] font-medium ${isLast ? 'text-teal-600 font-bold' : 'text-gray-400'}`}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Type */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Revenue by Type</h2>
          </div>
          <div className="space-y-3">
            {REVENUE_BY_TYPE.map((r) => (
              <div key={r.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{r.type}</span>
                  <span className="text-xs font-semibold text-gray-900">€{r.amount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.color} transition-all`} style={{ width: `${r.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Recent Transactions</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-full" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Invoice</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">Patient</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">Type</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">Date</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">Method</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">Amount</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono font-medium text-teal-600">{t.invoice}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900">{t.patient}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600">{t.type}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600">{t.date}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600">{t.method}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-sm font-bold ${t.status === 'refunded' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>€{t.amount}</span>
                  </td>
                  <td className="px-5 py-3"><PaymentStatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">Showing {(currentPage-1)*perPage+1}–{Math.min(currentPage*perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-medium ${page === currentPage ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMRevenue;
