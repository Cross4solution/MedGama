import React from 'react';
import { Search, Plus, Video, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Uses global SidebarPatient */}

      {/* Main Content */}
      <div className="flex-1">

        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="mb-2 sm:mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Telehealth</h1>
            <p className="text-gray-600 mt-1">Online consultation and telemedicine management</p>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-4 sm:p-5 lg:p-5 border border-gray-200 aspect-square md:aspect-[4/3] lg:aspect-[3/2] flex flex-col justify-between">
                <div className="flex items-start sm:items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stat.value}</p>
                    <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'green' ? 'text-green-600' :
                      stat.color === 'orange' ? 'text-orange-600' :
                      'text-purple-600'
                    }`}>
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg ${
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
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="divide-y">
                  {scheduledSessions.slice(0, 3).map((session) => (
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
                            const canJoin = m <= 15 && m >= 0;
                            const canCancel = m >= 240;
                            return (
                              <>
                                <button
                                  disabled={!canJoin}
                                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-white transition-colors ${canJoin ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'}`}
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Join</span>
                                </button>
                                <button
                                  disabled={!canCancel}
                                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${canCancel ? 'text-red-700 hover:text-red-900' : 'text-gray-300 cursor-not-allowed'}`}
                                  title={canCancel ? '' : 'Cancellation allowed until 4 hours before'}
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
            </div>

            {/* Past Appointments */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Appointments</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="divide-y">
                  {completedSessions.map((session) => (
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
                        <div className="flex items-center gap-2">
                          {(() => {
                            const m = minutesUntil(session.start);
                            const canJoin = m <= 15 && m >= 0;
                            const canCancel = m >= 240;
                            return (
                              <>
                                <button
                                  disabled={!canJoin}
                                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-white transition-colors ${canJoin ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'}`}
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Join</span>
                                </button>
                                <button
                                  disabled={!canCancel}
                                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${canCancel ? 'text-red-700 hover:text-red-900' : 'text-gray-300 cursor-not-allowed'}`}
                                  title={canCancel ? '' : 'Cancellation allowed until 4 hours before'}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelehealthPage;
