import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarClock, CheckCircle2, XCircle, Clock, Video, MapPin, Phone, Loader2, Inbox, CheckCheck, Plus } from 'lucide-react';
import { appointmentAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  };
  const labels = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || map.pending}`}>{labels[status] || status}</span>;
};

const MethodIcon = ({ type }) => {
  if (type === 'online') return <Video className="w-3.5 h-3.5 text-sky-500" />;
  return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
};

export default function DoctorAppointmentManager() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming'); // incoming | confirmed
  const [updating, setUpdating] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await appointmentAPI.list({ per_page: 100 });
      const list = res?.data || [];
      setAppointments(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const incoming = useMemo(() => appointments.filter(a => a.status === 'pending'), [appointments]);
  const confirmed = useMemo(() => appointments.filter(a => a.status === 'confirmed'), [appointments]);

  const handleAction = async (id, newStatus) => {
    setUpdating(id);
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    try {
      await appointmentAPI.update(id, { status: newStatus });
    } catch {
      // Rollback
      fetchAppointments();
    } finally {
      setUpdating(null);
    }
  };

  const displayList = activeTab === 'incoming' ? incoming : confirmed;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
            <CalendarClock className="w-4.5 h-4.5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Appointment Requests</h2>
            <p className="text-[11px] text-gray-400">Manage incoming patient appointments</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'incoming'
              ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          Incoming Requests
          {incoming.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-amber-500 text-white">{incoming.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${
            activeTab === 'confirmed'
              ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Confirmed
          {confirmed.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-blue-500 text-white">{confirmed.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin mb-2 text-teal-500" />
            <p className="text-xs font-medium">Loading appointments...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            {activeTab === 'incoming' ? (
              <>
                <Inbox className="w-10 h-10 mb-2 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No pending requests</p>
                <p className="text-xs text-gray-400 mt-0.5">New appointment requests will appear here</p>
              </>
            ) : (
              <>
                <CheckCheck className="w-10 h-10 mb-2 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No confirmed appointments</p>
                <p className="text-xs text-gray-400 mt-0.5">Confirmed appointments will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((apt) => (
              <div key={apt.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                      {(apt.patient?.fullname || 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient?.fullname || 'Patient'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MethodIcon type={apt.appointment_type} />
                        <span className="text-[11px] text-gray-500 capitalize">{apt.appointment_type === 'online' ? 'Video Call' : 'In-Person'}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>

                <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    {apt.appointment_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {apt.appointment_time}
                  </span>
                </div>

                {apt.confirmation_note && (
                  <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{apt.confirmation_note}</p>
                )}

                {/* Action Buttons */}
                {activeTab === 'incoming' && apt.status === 'pending' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleAction(apt.id, 'confirmed')}
                      disabled={updating === apt.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-all disabled:opacity-50"
                    >
                      {updating === apt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(apt.id, 'cancelled')}
                      disabled={updating === apt.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      {updating === apt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      Reject
                    </button>
                  </div>
                )}

                {activeTab === 'confirmed' && apt.status === 'confirmed' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleAction(apt.id, 'completed')}
                      disabled={updating === apt.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {updating === apt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleAction(apt.id, 'cancelled')}
                      disabled={updating === apt.id}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
