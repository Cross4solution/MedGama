import React from 'react';
import { Video } from 'lucide-react';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
      <div className="space-y-3">
        <button onClick={onTelehealth} className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-start gap-2 text-left shadow-sm hover:shadow-md">
          <Video className="w-5 h-5" />
          <span>Telehealth Appointment</span>
        </button>
        <button onClick={onBook} className="w-full text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-start gap-2 text-left shadow-sm hover:shadow-md" style={{ backgroundColor: '#2596be' }}>
          <img src="/images/icon/calender-svgrepo-com.svg" alt="Calendar" className="w-5 h-5 brightness-0 invert" />
          <span>Book Appointment</span>
        </button>
        <button onClick={onMessage} className="w-full text-white py-1.5 px-4 rounded-lg transition-colors flex items-center justify-start gap-2 text-left" style={{ backgroundColor: '#25D366' }}>
          <img src="/images/icon/chat-round-line-svgrepo-com.svg" alt="Chat" className="w-5 h-5 brightness-0 invert" />
          <span>Send Message</span>
        </button>
      </div>
    </div>
  );
}
