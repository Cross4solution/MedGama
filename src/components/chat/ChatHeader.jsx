import React from 'react';

export default function ChatHeader({ activeContact, onVideoCall, onCall, onBack }) {
  return (
    <div className="flex items-center justify-between p-2 border-b bg-gray-50 rounded-t-lg">
      <div className="flex items-center">
        {onBack && (
          <button
            aria-label="Back"
            className="mr-2 lg:hidden rounded-full w-9 h-9 flex items-center justify-center border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            onClick={onBack}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <div className="w-10 h-10 rounded-full mr-2 overflow-hidden bg-gray-100">
          <img 
            src={activeContact?.avatar || '/images/portrait-candid-male-doctor_720.jpg'} 
            alt={activeContact?.name || 'Contact'} 
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 20%' }}
            loading="lazy"
          />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 leading-tight">{activeContact?.name || 'Contact'}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{activeContact?.online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
      {/* action buttons removed as requested */}
    </div>
  );
}
