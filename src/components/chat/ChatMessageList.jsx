import React, { useEffect, useRef } from 'react';
import ChatMessage from 'components/chat/ChatMessage';

export default function ChatMessageList({ messages = [], leftAvatar, rightAvatar }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight; // scroll only the internal container
    } else {
      // Fallback (should rarely run)
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 px-5 py-4 overflow-y-auto overscroll-contain space-y-4 bg-gradient-to-b from-gray-50/40 to-white">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} leftAvatar={leftAvatar} rightAvatar={rightAvatar} />)
      )}
      <div ref={bottomRef} />
    </div>
  );
}
