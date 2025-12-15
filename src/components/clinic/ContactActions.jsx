import React from 'react';
import { Video } from 'lucide-react';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={onTelehealth}
          className="w-full h-14 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center justify-start gap-3 px-4"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 flex-shrink-0">
            <Video className="w-4 h-4" />
          </span>
          <span className="text-sm leading-tight">Online Consultation</span>
        </button>

        <button
          onClick={onBook}
          className="w-full h-14 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-start gap-3 px-4"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 flex-shrink-0">
            <img src="/images/icon/calender-svgrepo-com.svg" alt="Calendar" className="w-4 h-4 brightness-0 invert" />
          </span>
          <span className="text-sm leading-tight">Book Appointment</span>
        </button>

        <button
          onClick={onMessage}
          className="w-full h-14 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center justify-start gap-3 px-4"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 flex-shrink-0">
            <img src="/images/icon/chat-round-line-svgrepo-com.svg" alt="Chat" className="w-4 h-4 brightness-0 invert" />
          </span>
          <span className="text-sm leading-tight">Send Message</span>
        </button>

        <button
          type="button"
          className="w-full h-14 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium flex items-center justify-start gap-3 px-4"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 flex-shrink-0">
            <img
              src="/images/icon/archive-up-minimlistic-svgrepo-com.svg"
              alt="Tourism package"
              className="w-4 h-4 brightness-0 invert"
            />
          </span>
          <span className="text-sm leading-tight">One-click Health Tourism</span>
        </button>
      </div>
    </div>
  );
}
