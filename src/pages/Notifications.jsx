import React, { useState } from 'react';
import Header from '../components/Header';

export default function Notifications() {
  const [items, setItems] = useState([
    { id: 1, text: 'New comment on your post', read: false },
    { id: 2, text: 'Clinic invited you to a case discussion', read: false },
    { id: 3, text: 'Patient left a thank-you note', read: true },
  ]);

  const markAllAsRead = () => setItems(prev => prev.map(i => ({ ...i, read: true })));

  return (
    <div>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          <button onClick={markAllAsRead} className="px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
            Mark all as read
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl divide-y">
          {items.map(n => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${n.read ? 'bg-white' : 'bg-teal-50/40'}`}>
              <div className={`mt-1 w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-teal-600'}`} />
              <div className="text-sm text-gray-800">{n.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
