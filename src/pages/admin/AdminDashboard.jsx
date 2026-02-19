import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, FileText, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, UserCheck, UserX } from 'lucide-react';
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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard().then(res => {
      setData(res?.data || res);
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
