import React, { useState, useEffect } from 'react';
import {
  CreditCard, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Search, ChevronLeft, ChevronRight, Download, Filter,
  DollarSign, Users, Calendar, Loader2, Crown,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const STATUS_MAP = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: XCircle },
  past_due: { label: 'Past Due', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle },
  trialing: { label: 'Trial', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Calendar },
};

function StatCard({ icon: Icon, label, value, sub, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminFinancials() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, activePro: 0, pastDue: 0, cancelled: 0 });
  const [subscriptions, setSubscriptions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Mock data for now — will connect to real API when backend endpoints are ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalRevenue: '$12,450',
        activePro: 47,
        pastDue: 3,
        cancelled: 8,
      });
      const mockSubs = Array.from({ length: 15 }, (_, i) => ({
        id: `sub-${i + 1}`,
        user: {
          name: `Dr. ${['Ahmet Yılmaz', 'Ayşe Kaya', 'Mehmet Demir', 'Fatma Çelik', 'Ali Öztürk', 'Elif Güneş', 'Can Aydın', 'Zeynep Koç', 'Emre Aksoy', 'Selin Toprak', 'Burak Arslan', 'Deniz Erdem', 'İrem Şahin', 'Onur Yıldız', 'Merve Çetin'][i]}`,
          email: `doctor${i + 1}@medagama.com`,
          avatar: null,
          role: i < 12 ? 'doctor' : 'clinicOwner',
        },
        plan: i % 3 === 0 ? 'Pro Annual' : 'Pro Monthly',
        amount: i % 3 === 0 ? '$199/yr' : '$19/mo',
        status: i < 10 ? 'active' : i < 13 ? 'cancelled' : 'past_due',
        startedAt: new Date(2025, 6 + Math.floor(i / 3), 1 + i).toLocaleDateString(),
        nextBilling: i < 10 ? new Date(2026, 3 + Math.floor(i / 4), 1 + i).toLocaleDateString() : '—',
      }));
      setSubscriptions(mockSubs);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = subscriptions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.user.name.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Name', 'Email', 'Role', 'Plan', 'Amount', 'Status', 'Started', 'Next Billing'];
    const rows = filtered.map(s => [
      s.user.name,
      s.user.email,
      s.user.role,
      s.plan,
      s.amount,
      (STATUS_MAP[s.status] || STATUS_MAP.active).label,
      s.startedAt,
      s.nextBilling,
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medagama-financials-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Financials
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Pro subscriptions, revenue, and billing overview</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV {filtered.length > 0 && `(${filtered.length})`}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Total Revenue" value={stats.totalRevenue} color="emerald" sub="All time" />
        <StatCard icon={Crown} label="Active Pro" value={stats.activePro} color="purple" sub="Current subscribers" />
        <StatCard icon={AlertTriangle} label="Past Due" value={stats.pastDue} color="red" sub="Payment failed" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} color="amber" sub="This month" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'all', label: 'All', count: subscriptions.length },
            { key: 'active', label: 'Active', count: subscriptions.filter(s => s.status === 'active').length },
            { key: 'past_due', label: 'Past Due', count: subscriptions.filter(s => s.status === 'past_due').length },
            { key: 'cancelled', label: 'Cancelled', count: subscriptions.filter(s => s.status === 'cancelled').length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f.label} <span className="ml-1 opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No subscriptions found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Started</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Next Billing</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(sub => {
                  const st = STATUS_MAP[sub.status] || STATUS_MAP.active;
                  const StIcon = st.icon;
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                            {sub.user.name.charAt(4)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{sub.user.name}</p>
                            <p className="text-[11px] text-gray-400">{sub.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" /> {sub.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 tabular-nums">{sub.amount}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{sub.startedAt}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{sub.nextBilling}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text} border ${st.border}`}>
                          <StIcon className="w-3 h-3" /> {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-600 min-w-[60px] text-center">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
