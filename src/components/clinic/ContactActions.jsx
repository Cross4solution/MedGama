import React from 'react';
import { Video } from 'lucide-react';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
      <button 
        onClick={onTelehealth} 
        className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <Video className="w-5 h-5" />
        <span>Online Consultation</span>
      </button>
      
      <button 
        onClick={onBook} 
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <img src="/images/icon/calender-svgrepo-com.svg" alt="Calendar" className="w-5 h-5 brightness-0 invert" />
        <span>Book Appointment</span>
      </button>
      
      <button 
        onClick={onMessage} 
        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <img src="/images/icon/chat-round-line-svgrepo-com.svg" alt="Chat" className="w-5 h-5 brightness-0 invert" />
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
        <span>One-click Health Tourism</span>
      </button>
    </div>
  );
}
