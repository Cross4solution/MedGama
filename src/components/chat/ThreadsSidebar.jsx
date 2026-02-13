import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ThreadsSidebar({
  threads = [],
  channelFilter,
  onChannelChange,
  activeThreadId,
  onSelectThread,
  threadsPerPage = 8,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? threads.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : threads;

  const totalPages = Math.ceil(filtered.length / threadsPerPage);
  const startIndex = (currentPage - 1) * threadsPerPage;
  const paginatedThreads = filtered.slice(startIndex, startIndex + threadsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="hidden lg:flex w-full h-full flex-col gap-2">
      <aside className="w-full rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/40 overflow-hidden flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <h2 className="text-sm font-bold text-gray-900 mb-2.5">Messages</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {paginatedThreads.map((t) => {
            const active = activeThreadId === t.id;
            return (
              <div
                key={t.id}
                className={`px-3 py-3 cursor-pointer transition-all duration-150 border-l-3 ${
                  active
                    ? 'bg-gradient-to-r from-teal-50/80 to-emerald-50/40 border-l-[3px] border-l-teal-500'
                    : 'hover:bg-gray-50/80 border-l-[3px] border-l-transparent'
                }`}
                onClick={() => onSelectThread?.(t.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm" loading="lazy" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${t.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-[13px] truncate ${active ? 'font-bold text-teal-800' : 'font-semibold text-gray-900'}`}>{t.name}</h4>
                      <span className="text-[10px] text-gray-400 font-medium flex-shrink-0 ml-2">{t.when}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {t.tags?.slice(0, 2).map(tag => {
                        const isUrgent = tag.toLowerCase().includes('urgent');
                        return (
                          <span
                            key={tag}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                              isUrgent
                                ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                                : 'bg-gray-100/80 text-gray-500 border border-gray-200/60'
                            }`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 truncate leading-relaxed">{t.last}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rounded-xl border border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm px-3 py-2">
          <div className="flex justify-center items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
