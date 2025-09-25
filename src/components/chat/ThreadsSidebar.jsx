import React from 'react';

export default function ThreadsSidebar({
  threads = [],
  channelFilter,
  onChannelChange,
  activeThreadId,
  onSelectThread,
}) {
  return (
    <aside className="hidden lg:block w-full lg:col-span-2 bg-white border rounded-lg overflow-hidden">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Mesajlar</h2>
          </div>
          <button className="bg-blue-500 text-white px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5">
            <span className="text-base leading-none">＋</span>
            Yeni Mesaj
          </button>
        </div>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
          <input type="text" placeholder="Mesajlarda ara..." className="w-full pl-9 pr-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>
      <div className="overflow-y-auto divide-y" style={{ maxHeight: 'calc(100vh - 270px)' }}>
        {threads.map((t) => (
          <div key={t.id} className={`p-3 hover:bg-gray-50 cursor-pointer ${activeThreadId===t.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`} onClick={()=>onSelectThread?.(t.id)}>
            <div className="flex items-start gap-3">
              <div className="relative w-8 h-8 rounded-full mr-4 overflow-hidden bg-gray-100">
                <img src={t.avatar} alt="avatar" className="w-full h-full object-cover" loading="lazy" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${t.online ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-medium text-gray-900 truncate text-sm lg:text-sm">{t.name}</h4>
                  <span className="text-xs text-gray-500">{t.when}</span>
                </div>
                <div className="flex items-center gap-2 mb-1 mt-0.5">
                  {t.tags?.map(tag => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">{tag}</span>
                  ))}
                </div>
                <p className="text-xs lg:text-sm text-gray-600 truncate">{t.last}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
