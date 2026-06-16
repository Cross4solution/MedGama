import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, MailOpen, Search, Trash2, Paperclip, Download, ChevronLeft,
  Loader2, Inbox, FileText, Image as ImageIcon, Clock, User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { contactMessageAPI } from '../../lib/api';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const CRMContactInbox = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [deleting, setDeleting] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      if (unreadOnly) params.unread_only = true;
      const res = await contactMessageAPI.inbox(params);
      const data = res?.data || res;
      setMessages(data?.data || []);
      setMeta({ total: data?.total || 0, last_page: data?.last_page || 1 });
    } catch (err) {
      console.error('Failed to fetch contact messages', err);
    }
    setLoading(false);
  }, [page, search, unreadOnly]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleSelect = async (msg) => {
    setSelected(msg);
    if (!msg.is_read) {
      try {
        await contactMessageAPI.show(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      } catch {}
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await contactMessageAPI.remove(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {}
    setDeleting(null);
  };

  const handleDownload = (att) => {
    const url = resolveStorageUrl(att.file_path);
    window.open(url, '_blank');
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t('crm.contactInbox.title', 'Contact Messages')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} ${t('crm.contactInbox.unread', 'unread')}`
              : t('crm.contactInbox.allRead', 'All caught up')}
          </p>
        </div>
      </div>

      {/* Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex min-h-0">
        {/* List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col min-h-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('crm.contactInbox.search', 'Search messages...')}
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setUnreadOnly(false); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  !unreadOnly ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t('common.all', 'All')}
              </button>
              <button
                onClick={() => { setUnreadOnly(true); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  unreadOnly ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t('crm.contactInbox.unreadOnly', 'Unread')}
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Inbox className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">{t('crm.contactInbox.empty', 'No messages yet')}</p>
              </div>
            ) : (
              messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    selected?.id === msg.id ? 'bg-teal-50/40 border-l-2 border-l-teal-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 flex-shrink-0 overflow-hidden">
                    {msg.sender?.avatar ? (
                      <img src={resolveStorageUrl(msg.sender.avatar)} alt="" className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      (msg.sender?.fullname || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${!msg.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {msg.sender?.fullname || 'Unknown'}
                      </p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(msg.created_at)}</span>
                    </div>
                    {msg.subject && (
                      <p className={`text-xs truncate mt-0.5 ${!msg.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{msg.subject}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 truncate flex-1">{msg.body}</p>
                      {msg.attachments?.length > 0 && (
                        <Paperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      {!msg.is_read && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                  ←
                </button>
                <span className="text-xs text-gray-400">{page} / {meta.last_page}</span>
                <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}
                  className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                  →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className={`flex-1 flex flex-col min-h-0 ${!selected ? 'hidden md:flex' : 'flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Mail className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('crm.contactInbox.selectMessage', 'Select a message')}</p>
              <p className="text-xs mt-1">{t('crm.contactInbox.selectDesc', 'Choose a message from the list to view details')}</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Detail header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelected(null)} className="md:hidden w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selected.subject || t('crm.contactInbox.noSubject', '(No Subject)')}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{selected.sender?.fullname}</span>
                      {selected.sender?.email && (
                        <span className="text-xs text-gray-400">({selected.sender.email})</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mr-2">
                    <Clock className="w-3 h-3" />
                    {new Date(selected.created_at).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    disabled={deleting === selected.id}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    title={t('common.delete', 'Delete')}
                  >
                    {deleting === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Message body */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selected.body}
                </div>

                {/* Attachments */}
                {selected.attachments?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {t('crm.contactInbox.attachments', 'Attachments')} ({selected.attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {selected.attachments.map(att => {
                        const isImg = att.mime_type?.startsWith('image/');
                        return (
                          <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            {isImg ? (
                              <img src={resolveStorageUrl(att.file_path)} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{att.file_name}</p>
                              <p className="text-xs text-gray-400">{formatBytes(att.file_size)} · {att.mime_type}</p>
                            </div>
                            <button
                              onClick={() => handleDownload(att)}
                              className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 flex items-center justify-center text-gray-500 hover:text-teal-600 transition-colors flex-shrink-0"
                              title={t('common.download', 'Download')}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMContactInbox;
