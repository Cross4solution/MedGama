import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, FileText, ShieldCheck, ShieldAlert, AlertTriangle,
  TrendingUp, UserCheck, UserX, Building2, BarChart3,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

function StatCard({ icon: Icon, label, value, color = 'teal', sub }) {
  const colors = {
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
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

// Simple bar chart component (no external dependency)
function MiniBarChart({ data, dataKey, color = '#0D9488', label }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d[dataKey] || 0), 1);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-end gap-[3px] h-24">
        {data.map((d, i) => {
          const h = Math.max(((d[dataKey] || 0) / maxVal) * 100, 2);
          return (
            <div key={i} className="flex-1 group relative flex flex-col items-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                {d[dataKey] || 0}
              </div>
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{ height: `${h}%`, backgroundColor: color, minHeight: '2px' }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-gray-400">{data[0]?.label}</span>
        <span className="text-[9px] text-gray-400">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Period: {data?.period || 'Current month'}</p>
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Users</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Users" value={u.total} color="blue" />
          <StatCard icon={UserCheck} label="Doctors" value={u.doctors} color="teal" sub={`${u.verified_doctors || 0} verified`} />
          <StatCard icon={Users} label="Patients" value={u.patients} color="emerald" />
          <StatCard icon={TrendingUp} label="New This Month" value={u.new_this_month} color="purple" />
        </div>
      </div>

      {/* Clinics */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Clinics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Building2} label="Total Clinics" value={c.total} color="blue" />
          <StatCard icon={TrendingUp} label="New This Month" value={c.new_this_month} color="purple" />
        </div>
      </div>

      {/* Verification Alert */}
      {u.unverified_doctors > 0 && (
        <Link to="/admin/verification" className="block rounded-2xl border border-amber-200 bg-amber-50/80 p-4 hover:bg-amber-50 transition-colors">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{u.unverified_doctors} doctor(s) pending verification</p>
              <p className="text-xs text-amber-600 mt-0.5">Click to review and verify</p>
            </div>
          </div>
        </Link>
      )}

      {/* Growth Trend Chart */}
      {growth && growth.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Monthly Growth Trend (Last 12 Months)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MiniBarChart data={growth} dataKey="users" color="#6366F1" label="New Users" />
            <MiniBarChart data={growth} dataKey="doctors" color="#0D9488" label="New Doctors" />
            <MiniBarChart data={growth} dataKey="clinics" color="#8B5CF6" label="New Clinics" />
          </div>
        </div>
      )}

      {/* Appointment Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Appointments (This Month)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Calendar} label="Total" value={a.total} color="blue" />
          <StatCard icon={ShieldCheck} label="Completed" value={a.completed} color="emerald" />
          <StatCard icon={Calendar} label="Confirmed" value={a.confirmed} color="teal" />
          <StatCard icon={Calendar} label="Pending" value={a.pending} color="amber" />
          <StatCard icon={AlertTriangle} label="Cancelled" value={a.cancelled} color="red" />
        </div>
      </div>

      {/* MedStream Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">MedStream</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={FileText} label="Total Posts" value={m.total_posts} color="blue" />
          <StatCard icon={AlertTriangle} label="Pending Reports" value={m.pending_reports} color={m.pending_reports > 0 ? 'red' : 'emerald'} />
          {m.pending_reports > 0 && (
            <Link to="/admin/moderation" className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
              <UserX className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-700">Review Reports →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
