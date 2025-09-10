import React from 'react';
import { Video, MessageCircle } from 'lucide-react';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
      <div className="space-y-3">
        <button onClick={onTelehealth} className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md">
          <Video className="w-5 h-5" />
          <span>Telehealth Appointment</span>
        </button>
        <button onClick={onBook} className="w-full bg-green-500 text-white py-2 px-4 rounded-xl hover:bg-green-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md">
          <MessageCircle className="w-5 h-5" />
          <span>Book Appointment</span>
        </button>
        <button onClick={onMessage} className="w-full bg-gray-100 text-gray-700 py-1.5 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Send Message</span>
        </button>
      </div>
    </div>
  );
}
