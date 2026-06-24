'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@/compat/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI } from '../lib/api';
import useAppointmentSync from '../hooks/useAppointmentSync';
import AddToCalendar from '../components/AddToCalendar';
import resolveStorageUrl from '../utils/resolveStorageUrl';
import { Calendar, Clock, Video, Building2, Loader2, Check, XCircle, CalendarClock } from 'lucide-react';

// Lightweight incoming-appointments view for doctors & clinics (not the full CRM).
// Manage your own schedule: confirm / cancel / join — no filters, charts or leads.
export default function DoctorAppointments() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.list({ per_page: 200 });
      setAppointments(res?.data || []);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useAppointmentSync(fetchAppointments);

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      await appointmentAPI.update(id, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {} finally { setBusyId(null); }
  };

  const isUpcoming = (a) => ['pending', 'confirmed'].includes(a.status);
  const list = appointments.filter((a) => (filter === 'upcoming' ? isUpcoming(a) : !isUpcoming(a)));

  const statusBadge = (s) => {
    const map = {
      pending: ['bg-amber-50 text-amber-700', isTr ? 'Onay Bekliyor' : 'Pending'],
      confirmed: ['bg-teal-50 text-teal-700', isTr ? 'Onaylandı' : 'Confirmed'],
      completed: ['bg-gray-100 text-gray-600', isTr ? 'Tamamlandı' : 'Completed'],
      cancelled: ['bg-red-50 text-red-600', isTr ? 'İptal' : 'Cancelled'],
      no_show: ['bg-red-50 text-red-600', isTr ? 'Gelmedi' : 'No-show'],
    };
    const [cls, label] = map[s] || ['bg-gray-100 text-gray-600', s];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="w-7 h-7 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('myAppointments.title', 'Randevularım')}</h1>
            <p className="text-sm text-gray-500">{t('myAppointments.subtitle', 'Gelen randevularınızı yönetin')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[['upcoming', isTr ? 'Yaklaşan' : 'Upcoming'], ['past', isTr ? 'Geçmiş' : 'Past']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === k ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CalendarClock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">{t('myAppointments.empty', 'Randevu bulunmuyor.')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                <img src={resolveStorageUrl(a.patient?.avatar)} alt="" loading="lazy"
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{a.patient?.fullname || (isTr ? 'Hasta' : 'Patient')}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{a.appointment_date}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{(a.appointment_time || '').slice(0, 5) || '--:--'}</span>
                    <span className="inline-flex items-center gap-1">
                      {a.appointment_type === 'online' ? <><Video className="w-3.5 h-3.5" />{isTr ? 'Online' : 'Online'}</> : <><Building2 className="w-3.5 h-3.5" />{isTr ? 'Klinik' : 'In-person'}</>}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {statusBadge(a.status)}
                  <div className="flex items-center gap-2">
                    {isUpcoming(a) && a.appointment_type === 'online' && (
                      <button onClick={() => navigate(`/telehealth/call/${a.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700">
                        <Video className="w-3.5 h-3.5" />{isTr ? 'Katıl' : 'Join'}
                      </button>
                    )}
                    {a.status === 'pending' && (
                      <button onClick={() => setStatus(a.id, 'confirmed')} disabled={busyId === a.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-50 disabled:opacity-50">
                        {busyId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}{isTr ? 'Onayla' : 'Confirm'}
                      </button>
                    )}
                    {isUpcoming(a) && (
                      <button onClick={() => setStatus(a.id, 'cancelled')} disabled={busyId === a.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5" />{isTr ? 'İptal' : 'Cancel'}
                      </button>
                    )}
                    <AddToCalendar appointment={{
                      id: a.id,
                      title: `${a.patient?.fullname || (isTr ? 'Hasta' : 'Patient')} — MedaGama`,
                      date: a.appointment_date,
                      time: a.appointment_time,
                      durationMin: 30,
                      description: a.appointment_type === 'online' ? (isTr ? 'Online görüşme' : 'Online consultation') : '',
                      location: a.appointment_type === 'online' ? (isTr ? 'Online' : 'Online') : (a.clinic?.fullname || ''),
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
