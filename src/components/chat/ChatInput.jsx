import React from 'react';

export default function ChatInput({ message, onChange, onSend }) {
  return (
    <div className="p-4 border-t bg-white rounded-b-lg">
      <div className="flex items-center space-x-2">
        <button aria-label="Attach file" className="text-gray-600 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05 12 20.5a6 6 0 0 1-8.49-8.49l10-10a4 4 0 0 1 5.66 5.66L7.05 20.79"/></svg>
        </button>
        <button aria-label="Insert image" className="text-gray-600 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5a2 2 0 0 0-3 0L9 17"/></svg>
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && onSend?.()}
        />
        <button
          onClick={onSend}
          className="bg-blue-600 text-white p-2 rounded-xl border border-blue-700/20 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9 22 2z"/></svg>
        </button>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 mt-3">
        <button className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Request Appointment
        </button>
        <button className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V7L14 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><path d="M14 2v6h6"/></svg>
          Share File
        </button>
        <button className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="12" height="12" rx="2"/></svg>
          Video Call
        </button>
      </div>
    </div>
  );
}
