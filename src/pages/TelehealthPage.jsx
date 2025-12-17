import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Video, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

const TelehealthPage = () => {
  const { notify } = useToast();
  // Helpers
  const fmtDateTime = (d) => {
    try {
      const date = new Date(d);
      return date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return String(d);
    }
  };

  const minutesUntil = (d) => Math.floor((new Date(d).getTime() - Date.now()) / 60000);

  const getProp = (obj, key) => {
    try {
      if (!obj) return undefined;
      return obj[key];
    } catch {
      return undefined;
    }
  };

  // Mock data (Date based)
  const now = new Date();
  const addHours = (h) => new Date(now.getTime() + h * 3600000);

  const initialScheduledSessions = [
    { id: 3,  patient: 'Deniz Öztürk',   start: addHours(0.2),  specialty: 'Initial Consultation', joinUrl: 'https://zoom.us/j/100000003' },
    { id: 4,  patient: 'Zeynep Kaya',    start: addHours(6),    specialty: 'Follow-up', joinUrl: 'https://zoom.us/j/100000004' },
    { id: 5,  patient: 'Ali Şen',        start: addHours(30),   specialty: 'Preoperative', joinUrl: 'https://zoom.us/j/100000005' },
    { id: 9,  patient: 'Mert Koç',       start: addHours(1.5),  specialty: 'Dermatology', joinUrl: 'https://zoom.us/j/100000009' },
  ];

  const [cancelModal, setCancelModal] = useState({ open: false, session: null });

  const initialCompletedSessions = [
    { id: 6, patient: 'Selin Acar',       start: addHours(-20), durationMin: 25, status: 'Completed' },
    { id: 7, patient: 'Mehmet Özkan',     start: addHours(-48), durationMin: 32, status: 'Completed' },
    { id: 8, patient: 'Fatma Yılmaz',     start: addHours(-72), durationMin: 18, status: 'Completed' },
  ];

  const initialCanceledSessions = [
    { id: 10, patient: 'Burcu Tekin',     start: addHours(-10), reason: 'Patient canceled' },
  ];

  const [scheduledSessions, setScheduledSessions] = useState(initialScheduledSessions);
  const [completedSessions] = useState(initialCompletedSessions);
  const [canceledSessions, setCanceledSessions] = useState(initialCanceledSessions);

  const [sessionsModal, setSessionsModal] = useState({ open: false, filter: 'total' });

  const totals = useMemo(() => {
    return {
      total: scheduledSessions.length + completedSessions.length + canceledSessions.length,
      scheduled: scheduledSessions.length,
      completed: completedSessions.length,
      canceled: canceledSessions.length,
    };
  }, [scheduledSessions.length, completedSessions.length, canceledSessions.length]);

  const stats = [
    { key: 'total', title: 'Total Sessions', value: String(totals.total), subtitle: 'All time', icon: Video, color: 'green' },
    { key: 'scheduled', title: 'Scheduled', value: String(totals.scheduled), subtitle: 'Upcoming', icon: Calendar, color: 'blue' },
    { key: 'completed', title: 'Completed', value: String(totals.completed), subtitle: 'Finished', icon: CheckCircle, color: 'purple' },
    { key: 'canceled', title: 'Canceled', value: String(totals.canceled), subtitle: 'History', icon: XCircle, color: 'orange' },
  ];

  const [upPage, setUpPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const pageSize = 3;

  const upTotalPages = Math.max(1, Math.ceil(scheduledSessions.length / pageSize));
  const upStart = (upPage - 1) * pageSize;
  const upItems = scheduledSessions.slice(upStart, upStart + pageSize);

  const pastTotalPages = Math.max(1, Math.ceil(completedSessions.length / pageSize));
  const pastStart = (pastPage - 1) * pageSize;
  const pastItems = completedSessions.slice(pastStart, pastStart + pageSize);

  const getSessionsForModal = () => {
    const all = [
      ...scheduledSessions.map((s) => ({ ...s, _kind: 'scheduled' })),
      ...completedSessions.map((s) => ({ ...s, _kind: 'completed' })),
      ...canceledSessions.map((s) => ({ ...s, _kind: 'canceled' })),
    ];
    if (sessionsModal.filter === 'scheduled') return all.filter((x) => x._kind === 'scheduled');
    if (sessionsModal.filter === 'completed') return all.filter((x) => x._kind === 'completed');
    if (sessionsModal.filter === 'canceled') return all.filter((x) => x._kind === 'canceled');
    return all;
  };

  const sessionsModalTitle = () => {
    if (sessionsModal.filter === 'scheduled') return 'Scheduled Sessions';
    if (sessionsModal.filter === 'completed') return 'Completed Sessions';
    if (sessionsModal.filter === 'canceled') return 'Canceled Sessions';
    return 'All Sessions';
  };

  const handleJoin = (session) => {
    const url = session?.joinUrl || `https://zoom.us/j/${session?.id || ''}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      try {
        window.location.assign(url);
      } catch {}
    }
  };

  const confirmCancel = (session) => {
    if (!session) return;
    setScheduledSessions((arr) => arr.filter((s) => s.id !== session.id));
    setCanceledSessions((arr) => ([
      { id: session.id, patient: session.patient, start: session.start, reason: 'Canceled by doctor' },
      ...arr,
    ]));
    notify({ type: 'success', message: 'Appointment canceled. Notification message + email sent to the patient.' });
  };

  // Disable global scroll while on Telehealth page
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('no-scroll');
    return () => {
      root.classList.remove('no-scroll');
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Uses global SidebarPatient */}

      {/* Main Content */}
      <div className="flex-1">

        <div className="px-4 pt-2 pb-3 sm:px-6 sm:pt-3 sm:pb-4">
          <div className="mb-2 sm:mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Telehealth</h1>
            <p className="text-gray-600 mt-1">Online consultation and telemedicine management</p>
          </div>
{/* Stats Cards */}
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
  {stats.map((stat, index) => (
    <button
      key={index}
      type="button"
      onClick={() => setSessionsModal({ open: true, filter: stat.key })}
      className="bg-white rounded-xl px-4 py-1 sm:px-4 sm:py-2 lg:px-4 lg:py-2 border border-gray-200 aspect-[3/2] md:aspect-[3/2] lg:aspect-[2/1] hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="h-full flex items-center justify-center gap-3 sm:gap-3">
        <div className="text-center">
          <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stat.value}</p>
          <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
            stat.color === 'blue' ? 'text-blue-600' :
            stat.color === 'green' ? 'text-green-600' :
            stat.color === 'orange' ? 'text-orange-600' :
            'text-purple-600'
          }`}>
            {stat.subtitle}
          </p>
        </div>
        <div className={`p-2 sm:p-2 rounded-lg ${
          stat.color === 'blue' ? 'bg-blue-100' :
          stat.color === 'green' ? 'bg-green-100' :
          stat.color === 'orange' ? 'bg-orange-100' :
          'bg-purple-100'
        }`}>
          <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
            stat.color === 'blue' ? 'text-blue-600' :
            stat.color === 'green' ? 'text-green-600' :
            stat.color === 'orange' ? 'text-orange-600' :
            'text-purple-600'
          }`} />
        </div>
      </div>
    </button>
  ))}
</div>


          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="divide-y min-h-[280px]">
                  {upItems.map((session) => (
                    <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 justify-between">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {session.patient.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{session.patient}</h4>
                          <p className="text-xs text-teal-700">{fmtDateTime(session.start)}</p>
                          <p className="text-xs text-gray-500">{session.specialty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const m = minutesUntil(session.start);
                            const canJoin = m <= 10 && m >= 0;
                            const canCancel = m >= 240;
                            return (
                              <>
                                <button
                                  disabled={!canJoin}
                                  onClick={() => { if (canJoin) handleJoin(session); }}
                                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-white transition-colors ${canJoin ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'}`}
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Join</span>
                                </button>
                                <button
                                  disabled={!canCancel}
                                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${canCancel ? 'text-red-700 hover:text-red-900' : 'text-gray-300 cursor-not-allowed'}`}
                                  title={canCancel ? '' : 'Cancellation allowed until 4 hours before'}
                                  onClick={() => { if (canCancel) setCancelModal({ open: true, session }); }}
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 border rounded-lg px-3 py-2 mt-2">
                <div className="flex justify-center items-center space-x-1.5">
                  <button
                    disabled={upPage === 1}
                    onClick={() => setUpPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {Array.from({ length: upTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setUpPage(page)}
                      className={`px-2.5 py-1 text-sm rounded ${
                        page === upPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={upPage === upTotalPages}
                    onClick={() => setUpPage((p) => Math.min(upTotalPages, p + 1))}
                    className="px-2.5 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* Past Appointments */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Appointments</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="divide-y min-h-[280px]">
                  {pastItems.map((session) => (
                    <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {session.patient.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{session.patient}</h4>
                          <p className="text-xs text-gray-500">{fmtDateTime(session.start)} - {session.durationMin} min</p>
                          <p className="text-xs text-green-600">{session.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 border rounded-lg px-3 py-2 mt-2">
                <div className="flex justify-center items-center space-x-1.5">
                  <button
                    disabled={pastPage === 1}
                    onClick={() => setPastPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {Array.from({ length: pastTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setPastPage(page)}
                      className={`px-2.5 py-1 text-sm rounded ${
                        page === pastPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={pastPage === pastTotalPages}
                    onClick={() => setPastPage((p) => Math.min(pastTotalPages, p + 1))}
                    className="px-2.5 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {cancelModal.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setCancelModal({ open: false, session: null })}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              onClick={() => setCancelModal({ open: false, session: null })}
            >
              <span className="block w-3.5 h-3.5 leading-none text-lg">×</span>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Telehealth Appointment</h3>
            <p className="text-gray-700 mb-1">Your online telehealth appointment will be canceled.</p>
            <p className="text-gray-600 mb-4">Date & time: <span className="font-medium text-gray-900">{fmtDateTime(cancelModal.session?.start)}</span></p>
            <div className="flex justify-end space-x-3 mt-2">
              <button
                onClick={() => setCancelModal({ open: false, session: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => {
                  confirmCancel(cancelModal.session);
                  setCancelModal({ open: false, session: null });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={sessionsModal.open}
        onClose={() => setSessionsModal({ open: false, filter: sessionsModal.filter })}
        title={sessionsModalTitle()}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
              onClick={() => setSessionsModal({ open: false, filter: sessionsModal.filter })}
            >
              Close
            </button>
          </div>
        )}
      >
        <div className="space-y-2">
          {getSessionsForModal().map((s) => (
            <div key={`${s._kind}_${s.id}`} className="rounded-lg border bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{s.patient}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{fmtDateTime(s.start)}</div>
                  {(() => {
                    const specialty = getProp(s, 'specialty');
                    const status = getProp(s, 'status');
                    const reason = getProp(s, 'reason');
                    if (s._kind === 'scheduled' && specialty) {
                      return <div className="text-xs text-gray-600 mt-1 truncate">{String(specialty)}</div>;
                    }
                    if (s._kind === 'completed') {
                      return <div className="text-xs text-green-700 mt-1">{String(status || 'Completed')}</div>;
                    }
                    if (s._kind === 'canceled') {
                      return <div className="text-xs text-rose-700 mt-1">{String(reason || 'Canceled')}</div>;
                    }
                    return null;
                  })()}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    s._kind === 'scheduled'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : s._kind === 'completed'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {s._kind}
                  </span>

                  {s._kind === 'scheduled' && (
                    (() => {
                      const m = minutesUntil(s.start);
                      const canJoin = m <= 10 && m >= 0;
                      return (
                    <button
                      type="button"
                      disabled={!canJoin}
                      onClick={() => handleJoin(s)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${canJoin ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-300 text-white cursor-not-allowed'}`}
                    >
                      <Video className="w-4 h-4" />
                      Join
                    </button>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default TelehealthPage;
