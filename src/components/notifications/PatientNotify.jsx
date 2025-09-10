import React from 'react';

// Basit hasta bildirim listesi (demo)
// Gerçek entegrasyon yerine örnek veri kullanır. Doktor tarafındaki notify görünümüne benzer sade bir kart listesi.
export default function PatientNotify({ items = null }) {
  const sample = items || [
    { id: 1, title: 'Appointment confirmed', text: 'Your appointment on Sep 15 at 10:30 has been confirmed.', time: '2 hours ago' },
    { id: 2, title: 'New message', text: 'Dr. A. Yılmaz has shared a file with you.', time: '5 hours ago' },
    { id: 3, title: 'Test result', text: 'Your blood test results are now available.', time: 'Yesterday' },
  ];
  return (
    <ul className="-mx-5 first:mt-0">
      {sample.map((n, idx) => (
        <li key={n.id} className={`px-5 py-3 flex items-start gap-3 ${idx !== sample.length - 1 ? 'border-b border-gray-200' : ''}`}>
          <span className="mt-2 w-2 h-2 rounded-full bg-teal-500 inline-block" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate">{n.title}</h4>
              <span className="text-xs text-gray-500 ml-2 shrink-0">{n.time}</span>
            </div>
            <p className="text-sm text-gray-700 mt-0.5">{n.text}</p>
          </div>
        </li>
      ))}
      {sample.length === 0 && (
        <li className="px-5 py-3 text-sm text-gray-500">Şu anda bildiriminiz yok.</li>
      )}
    </ul>
  );
}
