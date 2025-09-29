import React, { useState } from 'react';

export default function ThreadsSidebar({
  threads = [],
  channelFilter,
  onChannelChange,
  activeThreadId,
  onSelectThread,
  threadsPerPage = 8,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination logic
  const totalPages = Math.ceil(threads.length / threadsPerPage);
  const startIndex = (currentPage - 1) * threadsPerPage;
  const endIndex = startIndex + threadsPerPage;
  const paginatedThreads = threads.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  return (
    <aside className="hidden lg:block w-full bg-white border rounded-lg overflow-hidden h-full flex flex-col">
      <div className="p-2 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Mesajlar</h2>
          </div>
        </div>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
          <input type="text" placeholder="Mesajlarda ara..." className="w-full pl-9 pr-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="overflow-y-auto divide-y flex-1">
          {paginatedThreads.map((t) => (
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
        
        {totalPages > 1 && (
          <div className="border-t bg-gray-50 p-1">
            <div className="flex justify-center items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2 py-1 text-xs rounded ${
                    page === currentPage 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
