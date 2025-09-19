import React from 'react';

export default function ChatHeader({ activeContact, onVideoCall, onCall, onBack }) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
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
        <div className="w-12 h-12 rounded-full mr-3 overflow-hidden bg-gray-100">
          <img 
            src={activeContact?.avatar || '/images/portrait-candid-male-doctor_720.jpg'} 
            alt={activeContact?.name || 'Contact'} 
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 20%' }}
            loading="lazy"
          />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{activeContact?.name || 'Contact'}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {activeContact?.channel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white text-gray-700">
                {activeContact.channel}
              </span>
            )}
            <span>{activeContact?.online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          aria-label="Start video call"
          className="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
          onClick={onVideoCall}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
        </button>
        <button
          aria-label="Call"
          className="rounded-full w-9 h-9 flex items-center justify-center border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
          onClick={onCall}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.89.37 1.76.73 2.57a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.51-1.25a2 2 0 0 1 2.11-.45c.81.36 1.68.61 2.57.73A2 2 0 0 1 22 16.92z"/></svg>
        </button>
      </div>
    </div>
  );
}
