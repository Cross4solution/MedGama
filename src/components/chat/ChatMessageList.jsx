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
    <div ref={containerRef} className="flex-1 p-4 pl-8 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} leftAvatar={leftAvatar} rightAvatar={rightAvatar} />)
      )}
      <div ref={bottomRef} />
    </div>
  );
}
