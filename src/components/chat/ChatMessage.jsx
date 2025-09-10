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
          <p className={`text-[11px] mt-1 flex items-center gap-2 ${isDoctor ? 'text-blue-100' : 'text-gray-500'}`}>
            <span>{message.time}</span>
            {!isDoctor && (
              <span className="inline-flex items-center gap-1">
                {message.status === 'sent' && <span title="Sent">✓</span>}
                {message.status === 'delivered' && <span title="Delivered">✓✓</span>}
                {message.status === 'read' && <span title="Read" className="text-teal-500">✓✓</span>}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
