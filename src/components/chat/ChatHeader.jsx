import React from 'react';
import { ChevronLeft } from 'lucide-react';

export default function ChatHeader({ activeContact, onVideoCall, onCall, onBack }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white rounded-t-2xl">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            aria-label="Back"
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={onBack}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex-shrink-0">
          <img 
            src={activeContact?.avatar || '/images/portrait-candid-male-doctor_720.jpg'} 
            alt={activeContact?.name || 'Contact'} 
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-md"
            style={{ objectPosition: 'center 20%' }}
            loading="lazy"
          />
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${activeContact?.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">{activeContact?.name || 'Contact'}</h3>
          <span className={`text-[11px] font-medium ${activeContact?.online ? 'text-emerald-600' : 'text-gray-400'}`}>
            {activeContact?.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
