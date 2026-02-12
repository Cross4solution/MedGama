import React from 'react';
import { Video } from 'lucide-react';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
      </div>
      <div className="p-4 space-y-2.5">
        <button 
          onClick={onTelehealth} 
          className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-xl hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <Video className="w-4 h-4" />
          <span>Online Consultation</span>
        </button>
        
        <button 
          onClick={onBook} 
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <img src="/images/icon/calender-svgrepo-com.svg" alt="Calendar" className="w-4 h-4 brightness-0 invert" />
          <span>Book Appointment</span>
        </button>
        
        <button 
          onClick={onMessage} 
          className="w-full bg-violet-600 text-white py-2.5 px-4 rounded-xl hover:bg-violet-700 focus:ring-4 focus:ring-violet-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <img src="/images/icon/chat-round-line-svgrepo-com.svg" alt="Chat" className="w-4 h-4 brightness-0 invert" />
          <span>Send Message</span>
        </button>
      </div>
    </div>
  );
}
