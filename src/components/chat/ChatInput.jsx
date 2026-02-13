import React from 'react';
import { Paperclip, Image, Send } from 'lucide-react';

export default function ChatInput({ message, onChange, onSend }) {
  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-white rounded-b-2xl flex-shrink-0">
      <div className="flex items-center gap-2">
        <button aria-label="Attach file" className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Paperclip className="w-4.5 h-4.5" />
        </button>
        <button aria-label="Insert image" className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Image className="w-4.5 h-4.5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:bg-white transition-all placeholder:text-gray-400"
          onKeyPress={(e) => e.key === 'Enter' && onSend?.()}
        />
        <button
          onClick={onSend}
          className="p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-200/50 hover:shadow-lg transition-all duration-200"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
