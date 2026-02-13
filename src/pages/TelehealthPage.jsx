import React, { useEffect, useState } from 'react';
import { Video, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';

const TelehealthPage = () => {
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

  // Mock data (Date based)
  const now = new Date();
  const addHours = (h) => new Date(now.getTime() + h * 3600000);

  const scheduledSessions = [
    { id: 3,  patient: 'Deniz Öztürk',   start: addHours(0.2),  specialty: 'Initial Consultation' },
    { id: 4,  patient: 'Zeynep Kaya',    start: addHours(6),    specialty: 'Follow-up' },
    { id: 5,  patient: 'Ali Şen',        start: addHours(30),   specialty: 'Preoperative' },
    { id: 9,  patient: 'Mert Koç',       start: addHours(1.5),  specialty: 'Dermatology' },
  ];

  const [cancelModal, setCancelModal] = useState({ open: false, session: null });

  const completedSessions = [
    { id: 6, patient: 'Selin Acar',       start: addHours(-20), durationMin: 25, status: 'Completed' },
    { id: 7, patient: 'Mehmet Özkan',     start: addHours(-48), durationMin: 32, status: 'Completed' },
    { id: 8, patient: 'Fatma Yılmaz',     start: addHours(-72), durationMin: 18, status: 'Completed' },
  ];

  const canceledSessions = [
    { id: 10, patient: 'Burcu Tekin',     start: addHours(-10), reason: 'Patient canceled' },
  ];

  const totals = {
    total: scheduledSessions.length + completedSessions.length + canceledSessions.length,
    scheduled: scheduledSessions.length,
    completed: completedSessions.length,
    canceled: canceledSessions.length,
  };

  const stats = [
    { title: 'Total Sessions', value: String(totals.total), subtitle: 'All time', icon: Video, color: 'green' },
    { title: 'Scheduled', value: String(totals.scheduled), subtitle: 'Upcoming', icon: Calendar, color: 'blue' },
    { title: 'Completed', value: String(totals.completed), subtitle: 'Finished', icon: CheckCircle, color: 'purple' },
    { title: 'Canceled', value: String(totals.canceled), subtitle: 'History', icon: XCircle, color: 'orange' },
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

  // Allow normal scrolling on mobile, disable on desktop
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(min-width: 1024px)');
    const toggle = (e) => { e.matches ? root.classList.add('no-scroll') : root.classList.remove('no-scroll'); };
    toggle(mq);
    mq.addEventListener('change', toggle);
    return () => { root.classList.remove('no-scroll'); mq.removeEventListener('change', toggle); };
  }, []);

  const colorMap = {
    green: { bg: 'bg-emerald-100/80', text: 'text-emerald-600', sub: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
    blue: { bg: 'bg-blue-100/80', text: 'text-blue-600', sub: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600' },
    purple: { bg: 'bg-purple-100/80', text: 'text-purple-600', sub: 'text-purple-600', gradient: 'from-purple-500 to-violet-600' },
    orange: { bg: 'bg-amber-100/80', text: 'text-amber-600', sub: 'text-amber-600', gradient: 'from-amber-500 to-orange-600' },
  };

  const renderPagination = (currentPage, totalPages, onPageChange) => (
    totalPages > 1 && (
      <div className="rounded-xl border border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm px-3 py-2 mt-2">
        <div className="flex justify-center items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all duration-200 ${
                page === currentPage
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/60 to-white">
      <div className="flex-1">
        <div className="px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6">
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200/50">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Telehealth</h1>
              <p className="text-[11px] text-gray-400 font-medium">Online consultation and telemedicine management</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {stats.map((stat, index) => {
              const c = colorMap[stat.color] || colorMap.green;
              return (
                <div key={index} className="rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className={`text-[11px] font-medium mt-0.5 ${c.sub}`}>{stat.subtitle}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shadow-sm`}>
                      <stat.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
                Upcoming Appointments
              </h2>
              <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 overflow-hidden">
                <div className="min-h-[260px]">
                  {upItems.map((session, idx) => (
                    <div key={session.id} className={`px-4 py-3.5 hover:bg-gray-50/60 transition-colors ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="flex items-center gap-3 justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                          {session.patient.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{session.patient}</h4>
                          <p className="text-[11px] text-teal-600 font-medium">{fmtDateTime(session.start)}</p>
                          <p className="text-[11px] text-gray-400">{session.specialty}</p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          {(() => {
                            const m = minutesUntil(session.start);
                            const canJoin = m <= 15 && m >= 0;
                            const canCancel = m >= 240;
                            return (
                              <>
                                <button
                                  disabled={!canJoin}
                                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-200 ${canJoin ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50 hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                >
                                  <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>Join</span>
                                </button>
                                <button
                                  disabled={!canCancel}
                                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition-colors ${canCancel ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700' : 'text-gray-300 cursor-not-allowed'}`}
                                  title={canCancel ? '' : 'Cancellation allowed until 4 hours before'}
                                  onClick={() => { if (canCancel) setCancelModal({ open: true, session }); }}
                                >
                                  <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span className="hidden sm:inline">Cancel</span>
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
              {renderPagination(upPage, upTotalPages, setUpPage)}
            </div>

            {/* Past Appointments */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-purple-500 to-violet-500" />
                Past Appointments
              </h2>
              <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 overflow-hidden">
                <div className="min-h-[260px]">
                  {pastItems.map((session, idx) => (
                    <div key={session.id} className={`px-4 py-3.5 hover:bg-gray-50/60 transition-colors ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                          {session.patient.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{session.patient}</h4>
                          <p className="text-[11px] text-gray-500">{fmtDateTime(session.start)} - {session.durationMin} min</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/80 mt-0.5">{session.status}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(() => {
                            const m = minutesUntil(session.start);
                            const canJoin = m <= 15 && m >= 0;
                            const canCancel = m >= 240;
                            return (
                              <>
                                <button
                                  disabled={!canJoin}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${canJoin ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Join</span>
                                </button>
                                <button
                                  disabled={!canCancel}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${canCancel ? 'text-rose-600 hover:bg-rose-50' : 'text-gray-300 cursor-not-allowed'}`}
                                  title={canCancel ? '' : 'Cancellation allowed until 4 hours before'}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
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
              {renderPagination(pastPage, pastTotalPages, setPastPage)}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCancelModal({ open: false, session: null })} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50/80 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Cancel Appointment</h3>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setCancelModal({ open: false, session: null })}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600 leading-relaxed">Your online telehealth appointment will be canceled.</p>
                <div className="mt-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Date & Time</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{fmtDateTime(cancelModal.session?.start)}</p>
                </div>
              </div>
              <div className="px-5 pb-4 flex justify-end gap-2">
                <button
                  onClick={() => setCancelModal({ open: false, session: null })}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={() => setCancelModal({ open: false, session: null })}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 rounded-xl shadow-md shadow-rose-200/50 transition-all duration-200"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelehealthPage;
