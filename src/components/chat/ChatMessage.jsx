import React from 'react';

export default function ChatMessage({ message, leftAvatar, rightAvatar }) {
  const isDoctor = message.sender === 'doctor';
  return (
    <div className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start max-w-xs lg:max-w-md ${isDoctor ? 'flex-row-reverse' : ''}`}>
        {!isDoctor && (
          <div className="w-10 h-10 rounded-full mr-2 flex-shrink-0 overflow-hidden bg-gray-100">
            <img src={leftAvatar} alt="Contact" className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: 'center 20%' }} />
          </div>
        )}
        {isDoctor && (
          <div className="w-10 h-10 rounded-full ml-2 flex-shrink-0 overflow-hidden bg-gray-100">
            <img src={rightAvatar} alt="You" className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: 'center 20%' }} />
          </div>
        )}
        <div className={`rounded-lg px-4 py-2 ${isDoctor ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
          <p className="text-sm whitespace-pre-line">{message.text}</p>
          <div className={`text-[11px] mt-1 flex items-center justify-between gap-2 ${isDoctor ? 'text-blue-100' : 'text-gray-500'}`}>
            <div className="flex items-center gap-2">
              <span>{message.time}</span>
              {isDoctor && (
                <span className="inline-flex items-center gap-1">
                  {message.status === 'sent' && <span title="Sent">✓</span>}
                  {message.status === 'delivered' && <span title="Delivered">✓✓</span>}
                  {message.status === 'read' && <span title="Read" className="text-teal-500">✓✓</span>}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Translate message"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 bg-white text-gray-600 text-xs hover:bg-gray-50 flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="m5 8 6 6"></path>
                <path d="m4 14 6-6 2-3"></path>
                <path d="M2 5h12"></path>
                <path d="M7 2h1"></path>
                <path d="m22 22-5-10-5 10"></path>
                <path d="M14 18h6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
