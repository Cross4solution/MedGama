import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldX, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { adminAPI } from '../../lib/api';

export default function AdminVerification() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | verified
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page };
      if (filter === 'pending') params.verified = false;
      if (filter === 'verified') params.verified = true;
      if (search.trim()) params.search = search.trim();

      const res = await adminAPI.doctors(params);
      setDoctors(res?.data || []);
      setLastPage(res?.last_page || res?.meta?.last_page || 1);
    } catch {
      setDoctors([]);
    }
    setLoading(false);
  }, [filter, search, page]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);
  useEffect(() => { setPage(1); }, [filter, search]);

  const handleVerify = async (id, verified) => {
    setActionLoading(id);
    try {
      await adminAPI.verifyDoctor(id, verified);
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, is_verified: verified } : d));
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Doctor Verification</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and verify doctor registrations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'verified', label: 'Verified' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No doctors found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Doctor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Clinic</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doctors.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={d.avatar || '/images/default/default-avatar.svg'} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="font-medium text-gray-900">{d.fullname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.email}</td>
                    <td className="px-4 py-3 text-gray-600">{d.clinic?.fullname || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {d.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldX className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {actionLoading === d.id ? (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                        ) : d.is_verified ? (
                          <button
                            onClick={() => handleVerify(d.id, false)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(d.id, true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Page {page} of {lastPage}</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
