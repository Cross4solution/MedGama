import React from 'react';
import { Search, Plus, Video, Clock, Calendar, CheckCircle } from 'lucide-react';

const TelehealthPage = () => {
  const activeSessions = [
    { id: 1, patient: 'Ayşe Demir', specialty: 'Cardiology Consultation', status: 'Active', duration: '12 min' },
    { id: 2, patient: 'Can Yıldız', specialty: 'Follow-up Appointment', status: 'Waiting', duration: '3 min' },
  ];

  const scheduledSessions = [
    { id: 3, patient: 'Deniz Öztürk', time: 'Tomorrow 14:00', specialty: 'Initial Consultation' },
    { id: 4, patient: 'Zeynep Kaya', time: 'Thursday 16:30', specialty: 'Follow-up' },
    { id: 5, patient: 'Ali Şen', time: 'Friday 10:00', specialty: 'Preoperative' },
  ];

  const recentSessions = [
    { id: 6, patient: 'Selin Acar', time: 'Yesterday 15:30 - 25 min', status: 'Completed' },
    { id: 7, patient: 'Mehmet Özkan', time: '2 days ago - 32 min', status: 'Completed' },
    { id: 8, patient: 'Fatma Yılmaz', time: '3 days ago - 18 min', status: 'Completed' },
  ];

  const stats = [
    { title: 'Active Sessions', value: '3', subtitle: 'Online now', icon: Video, color: 'green' },
    { title: 'Scheduled', value: '12', subtitle: 'This week', icon: Calendar, color: 'blue' },
    { title: 'Completed', value: '84', subtitle: 'This month', icon: CheckCircle, color: 'purple' },
    { title: 'Avg. Duration', value: '28', subtitle: 'minutes', icon: Clock, color: 'orange' },
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

          {/* Active Sessions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Sessions</h2>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {session.patient.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{session.patient}</h3>
                        <p className="text-sm text-gray-600">{session.specialty}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${session.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="text-sm text-gray-500">{session.status} - {session.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                        <Video className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <span>Deny</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scheduled Sessions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Sessions</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="divide-y">
                  {scheduledSessions.map((session) => (
                    <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {session.patient.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{session.patient}</h4>
                          <p className="text-xs text-teal-700">{session.time}</p>
                          <p className="text-xs text-gray-500">{session.specialty}</p>
                        </div>
                        <button className="text-teal-700 hover:text-teal-900">
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h2>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="divide-y">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {session.patient.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{session.patient}</h4>
                          <p className="text-xs text-gray-500">{session.time}</p>
                          <p className="text-xs text-green-600">{session.status}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Search className="w-4 h-4" />
                          </button>
                          <button className="text-teal-700 hover:text-teal-900">
                            <Video className="w-4 h-4" />
                          </button>
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
