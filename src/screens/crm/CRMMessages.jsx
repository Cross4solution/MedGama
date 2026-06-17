import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, Search, Plus, Send, Paperclip, Image, Smile, Phone, Video,
  MoreVertical, X, Check, CheckCheck, Clock, Circle, ChevronLeft, Star,
  Archive, Trash2, Filter, Users, Loader2, AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../lib/api';

// ─── Helpers ─────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

// Konuşmanın karşı taraf görünen adını çöz (direct: diğer katılımcı, group: title)
const resolveConversationName = (conv, currentUserId, t) => {
  if (conv.title) return conv.title;
  if (conv.type === 'direct' && Array.isArray(conv.participants)) {
    const other = conv.participants.find((p) => p.id !== currentUserId);
    if (other) return other.fullname || t('crm.messages.unknownUser', 'Bilinmeyen');
  }
  return t('crm.messages.conversation', 'Konuşma');
};

// type → UI tipi (avatar rengi/filtre için): system / staff / patient
const resolveConvType = (conv, currentUserId) => {
  if (conv.type === 'group') return 'staff';
  if (Array.isArray(conv.participants)) {
    const other = conv.participants.find((p) => p.id !== currentUserId);
    const roleId = other?.role_id || '';
    if (roleId === 'patient') return 'patient';
    if (['superAdmin', 'saasAdmin'].includes(roleId)) return 'system';
    return 'staff';
  }
  return 'patient';
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Dün';
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

// ─── Component ───────────────────────────────────────────────
const CRMMessages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convError, setConvError] = useState(null);

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  // ── Konuşma listesini yükle ──
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    setConvError(null);
    try {
      const res = await messageAPI.conversations();
      // Laravel paginate → { data: [...] }
      const list = res?.data?.data ?? res?.data ?? [];
      const mapped = (Array.isArray(list) ? list : []).map((conv) => ({
        ...conv,
        name: resolveConversationName(conv, currentUserId, t),
        uiType: resolveConvType(conv, currentUserId),
        lastMessage: conv.latest_message?.body || '',
        lastTime: formatTime(conv.latest_message?.created_at || conv.updated_at),
        unread: conv.unread_count || 0,
        starred: false,
        online: false,
      }));
      setConversations(mapped);
    } catch (err) {
      setConvError(err?.message || t('crm.messages.loadError', 'Konuşmalar yüklenemedi.'));
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }, [currentUserId, t]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Aktif konuşmanın mesajlarını yükle ──
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setLoadingMsgs(true);
    try {
      const res = await messageAPI.messages(conversationId);
      const list = res?.data?.data ?? res?.data ?? [];
      // API newest-first döner → kronolojik (eski→yeni) sıraya çevir
      const chrono = (Array.isArray(list) ? list : []).slice().reverse();
      setMessages(chrono);
      // Okundu işaretle + listedeki unread sıfırla
      try { await messageAPI.markRead(conversationId); } catch {}
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)));
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversation) loadMessages(activeConversation);
  }, [activeConversation, loadMessages]);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (filterType === 'unread' && c.unread === 0) return false;
      if (filterType === 'starred' && !c.starred) return false;
      if (filterType === 'patient' && c.uiType !== 'patient') return false;
      if (filterType === 'staff' && c.uiType !== 'staff' && c.uiType !== 'system') return false;
      if (searchQuery && !(c.name || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [conversations, searchQuery, filterType]);

  const activeChat = conversations.find((c) => c.id === activeConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation, messages.length]);

  const handleSelectConversation = (id) => {
    setActiveConversation(id);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const handleSend = async () => {
    const body = messageText.trim();
    if (!body || !activeConversation || sending) return;
    setSending(true);
    try {
      const res = await messageAPI.sendMessage(activeConversation, { body, type: 'text' });
      const newMsg = res?.data?.message ?? res?.data ?? null;
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
        // Konuşma listesinde son mesajı güncelle
        setConversations((prev) => prev.map((c) => (
          c.id === activeConversation
            ? { ...c, lastMessage: body, lastTime: formatTime(newMsg.created_at) }
            : c
        )));
      }
      setMessageText('');
    } catch (err) {
      // Sessiz başarısızlık yerine kullanıcıya geri bildirim
      setConvError(err?.message || t('crm.messages.sendError', 'Mesaj gönderilemedi.'));
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const MessageStatus = ({ status }) => {
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    if (status === 'sent') return <Check className="w-3.5 h-3.5 text-gray-400" />;
    return <Clock className="w-3 h-3 text-gray-400" />;
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.messages.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalUnread} {t('crm.messages.unreadMessages')}</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          {t('crm.messages.newMessage')}
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex min-h-0">
        {/* Conversation List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col min-h-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Search & Filter */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder={t('crm.messages.searchConversations')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { key: 'all', label: t('common.all') },
                { key: 'unread', label: `${t('crm.messages.unreadMessages')} (${totalUnread})` },
                { key: 'starred', label: t('crm.messages.starred') },
                { key: 'patient', label: t('crm.sidebar.patients') },
                { key: 'staff', label: t('crm.messages.staff') },
              ].map((f) => (
                <button key={f.key} onClick={() => setFilterType(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                    filterType === f.key ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                <p className="text-sm">{t('common.loading', 'Yükleniyor...')}</p>
              </div>
            ) : convError ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-4 text-center">
                <AlertCircle className="w-8 h-8 mb-2 text-rose-400" />
                <p className="text-sm">{convError}</p>
                <button onClick={loadConversations} className="mt-3 text-xs text-teal-600 font-medium hover:underline">
                  {t('common.retry', 'Tekrar dene')}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">{t('crm.messages.noConversations')}</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    activeConversation === conv.id ? 'bg-teal-50/40 border-l-2 border-l-teal-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                      conv.uiType === 'system' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                      conv.uiType === 'staff' ? 'bg-gradient-to-br from-violet-400 to-violet-600 text-white' :
                      'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                    }`}>
                      {getInitials(conv.name)}
                    </div>
                    {conv.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{conv.name}</p>
                        {conv.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{conv.lastTime}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${conv.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-teal-600 text-white text-[9px] font-bold px-1 flex-shrink-0">{conv.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col min-h-0 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('crm.messages.selectConversation')}</p>
              <p className="text-xs mt-1">{t('crm.messages.selectConversationDesc')}</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <button onClick={handleBack} className="md:hidden w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeChat.uiType === 'system' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                      activeChat.uiType === 'staff' ? 'bg-gradient-to-br from-violet-400 to-violet-600 text-white' :
                      'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                    }`}>
                      {getInitials(activeChat.name)}
                    </div>
                    {activeChat.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{activeChat.name}</p>
                    <p className="text-[11px] text-gray-400">{activeChat.online ? t('crm.messages.online') : t('crm.messages.offline')} · {activeChat.uiType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><Phone className="w-4 h-4" /></button>
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><Video className="w-4 h-4" /></button>
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-gray-50/30">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">{t('crm.messages.noMessages', 'Henüz mesaj yok')}</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId || msg.is_mine === true;
                    const isSystem = msg.type === 'system';
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 ${
                          isMine
                            ? 'bg-teal-600 text-white rounded-br-md'
                            : isSystem
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 rounded-bl-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-teal-200' : 'text-gray-400'}`}>
                            <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                            {isMine && <MessageStatus status={msg.read_at ? 'read' : 'sent'} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><Paperclip className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><Image className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                    <textarea
                      rows={1}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={t('crm.messages.typeMessage')}
                      className="w-full px-4 py-2.5 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none resize-none"
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMMessages;
