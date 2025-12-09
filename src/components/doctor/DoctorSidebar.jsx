import React from 'react';
import { Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DoctorAppointmentCalendar from '../pricing/DoctorAppointmentCalendar';

export default function DoctorSidebar() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  return (
    <div className="lg:w-96 xl:w-[26rem] space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
        <button className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2">
          <Video className="w-5 h-5" />
          <span>Online Consultation</span>
        </button>
        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
          <img
            src="/images/icon/calender-svgrepo-com.svg"
            alt="Calendar"
            className="w-5 h-5 brightness-0 invert"
          />
          <span>Book Appointment</span>
        </button>
        <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
          <img
            src="/images/icon/chat-round-line-svgrepo-com.svg"
            alt="Chat"
            className="w-5 h-5 brightness-0 invert"
          />
          <span>Send Message</span>
        </button>

        <button
          type="button"
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <img
            src="/images/icon/archive-up-minimlistic-svgrepo-com.svg"
            alt="Tourism package"
            className="w-5 h-5 brightness-0 invert"
          />
          <span>One-click Health Tourism Package</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Consultation</span>
              <span className="font-medium text-gray-900"> 500 -  800</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Angiography</span>
              <span className="font-medium text-gray-900"> 8K -  15K</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Echocardiography</span>
              <span className="font-medium text-gray-900"> 1K -  2K</span>
            </div>
          </div>
        </div>

        <DoctorAppointmentCalendar onChange={() => {}} />
      </div>
    </div>
  );
}
