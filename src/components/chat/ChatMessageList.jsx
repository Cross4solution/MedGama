import React from 'react';
import ChatMessage from 'components/chat/ChatMessage';

export default function ChatMessageList({ messages = [], leftAvatar, rightAvatar }) {
  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} leftAvatar={leftAvatar} rightAvatar={rightAvatar} />)
      )}
    </div>
  );
}
