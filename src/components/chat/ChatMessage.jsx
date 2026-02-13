import React from 'react';

function ChatMessage({ message, leftAvatar, rightAvatar }) {
  const isDoctor = message.sender === 'doctor';
  return (
    <div className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end max-w-xs lg:max-w-md gap-2.5 ${isDoctor ? 'flex-row-reverse' : ''}`}>
        {!isDoctor && (
          <img src={leftAvatar} alt="Contact" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white shadow-sm flex-shrink-0" loading="lazy" style={{ objectPosition: 'center 20%' }} />
        )}
        {isDoctor && (
          <img src={rightAvatar} alt="You" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white shadow-sm flex-shrink-0" loading="lazy" style={{ objectPosition: 'center 20%' }} />
        )}
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${isDoctor ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'}`}>
          <p className="text-[13px] leading-relaxed whitespace-pre-line">{message.text}</p>
          <p className={`text-[10px] mt-1.5 flex items-center gap-2 ${isDoctor ? 'text-teal-100' : 'text-gray-400'}`}>
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

export default React.memo(ChatMessage);
