import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare, Search, Plus, Send, Paperclip, Image, Smile, Phone, Video,
  MoreVertical, X, Check, CheckCheck, Clock, Circle, ChevronLeft, Star,
  Archive, Trash2, Filter, Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_CONVERSATIONS = [
  { id: 1, name: 'Zeynep Kaya', avatar: null, online: true, lastMessage: 'Thank you doctor, I will follow the prescription.', lastTime: '10:32', unread: 0, type: 'patient', starred: false },
  { id: 2, name: 'Ali Yilmaz', avatar: null, online: false, lastMessage: 'When should I come for the follow-up?', lastTime: '09:45', unread: 2, type: 'patient', starred: true },
  { id: 3, name: 'MedaGama System', avatar: null, online: true, lastMessage: 'New appointment request from Burak Sahin.', lastTime: '09:12', unread: 1, type: 'system', starred: false },
  { id: 4, name: 'Selin Acar', avatar: null, online: true, lastMessage: 'I uploaded my test results to the portal.', lastTime: 'Yesterday', unread: 0, type: 'patient', starred: false },
  { id: 5, name: 'Secretary - Aylin', avatar: null, online: true, lastMessage: 'Dr., your 14:00 appointment has been rescheduled to 15:00.', lastTime: 'Yesterday', unread: 0, type: 'staff', starred: true },
  { id: 6, name: 'Mehmet Ozkan', avatar: null, online: false, lastMessage: 'My blood sugar levels have been unstable this week.', lastTime: 'Yesterday', unread: 3, type: 'patient', starred: false },
  { id: 7, name: 'Fatma Koc', avatar: null, online: false, lastMessage: 'Should I continue the same dosage?', lastTime: 'Feb 14', unread: 0, type: 'patient', starred: false },
  { id: 8, name: 'Elif Arslan', avatar: null, online: false, lastMessage: 'The procedure went well, thank you!', lastTime: 'Feb 13', unread: 0, type: 'patient', starred: false },
  { id: 9, name: 'Lab Department', avatar: null, online: true, lastMessage: 'Results for patient #00004 are ready.', lastTime: 'Feb 13', unread: 1, type: 'staff', starred: false },
  { id: 10, name: 'Deniz Korkmaz', avatar: null, online: false, lastMessage: 'I have some questions about my medication.', lastTime: 'Feb 12', unread: 0, type: 'patient', starred: false },
];

const MOCK_MESSAGES = {
  1: [
    { id: 1, sender: 'patient', text: 'Good morning doctor, I wanted to ask about my prescription.', time: '10:15', status: 'read' },
    { id: 2, sender: 'doctor', text: 'Good morning Zeynep. Of course, what would you like to know?', time: '10:18', status: 'read' },
    { id: 3, sender: 'patient', text: 'Should I take the medication before or after meals?', time: '10:20', status: 'read' },
    { id: 4, sender: 'doctor', text: 'Take it 30 minutes before meals, twice a day. If you experience any side effects, please let me know immediately.', time: '10:25', status: 'read' },
    { id: 5, sender: 'patient', text: 'Thank you doctor, I will follow the prescription.', time: '10:32', status: 'read' },
  ],
  2: [
    { id: 1, sender: 'patient', text: 'Hello doctor, my surgery was last week.', time: '09:30', status: 'read' },
    { id: 2, sender: 'doctor', text: 'Yes Ali, how are you feeling? Any pain or discomfort?', time: '09:35', status: 'read' },
    { id: 3, sender: 'patient', text: 'I feel much better now. The wound is healing well.', time: '09:40', status: 'read' },
    { id: 4, sender: 'patient', text: 'When should I come for the follow-up?', time: '09:45', status: 'delivered' },
  ],
  3: [
    { id: 1, sender: 'system', text: 'New appointment request from Burak Sahin for Feb 16, 13:00. Type: New Patient, Method: In-Person.', time: '09:12', status: 'read' },
  ],
  6: [
    { id: 1, sender: 'patient', text: 'Doctor, I need to talk about my blood sugar levels.', time: '14:00', status: 'read' },
    { id: 2, sender: 'patient', text: 'They have been very unstable this week, ranging from 180 to 280.', time: '14:02', status: 'delivered' },
    { id: 3, sender: 'patient', text: 'My blood sugar levels have been unstable this week.', time: '14:05', status: 'delivered' },
  ],
};

// ─── Component ───────────────────────────────────────────────
const CRMMessages = () => {
  const { t } = useTranslation();
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  const filtered = useMemo(() => {
    return MOCK_CONVERSATIONS.filter((c) => {
      if (filterType === 'unread' && c.unread === 0) return false;
      if (filterType === 'starred' && !c.starred) return false;
      if (filterType === 'patient' && c.type !== 'patient') return false;
      if (filterType === 'staff' && c.type !== 'staff' && c.type !== 'system') return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, filterType]);

  const activeChat = MOCK_CONVERSATIONS.find((c) => c.id === activeConversation);
  const messages = MOCK_MESSAGES[activeConversation] || [];

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

  const totalUnread = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

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
            {filtered.length === 0 ? (
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
                      conv.type === 'system' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                      conv.type === 'staff' ? 'bg-gradient-to-br from-violet-400 to-violet-600 text-white' :
                      'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                    }`}>
                      {conv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                      activeChat.type === 'system' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                      activeChat.type === 'staff' ? 'bg-gradient-to-br from-violet-400 to-violet-600 text-white' :
                      'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                    }`}>
                      {activeChat.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    {activeChat.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{activeChat.name}</p>
                    <p className="text-[11px] text-gray-400">{activeChat.online ? t('crm.messages.online') : t('crm.messages.offline')} · {activeChat.type}</p>
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
                {messages.map((msg) => {
                  const isDoctor = msg.sender === 'doctor';
                  return (
                    <div key={msg.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 ${
                        isDoctor
                          ? 'bg-teal-600 text-white rounded-br-md'
                          : msg.sender === 'system'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200 rounded-bl-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isDoctor ? 'text-teal-200' : 'text-gray-400'}`}>
                          <span className="text-[10px]">{msg.time}</span>
                          {isDoctor && <MessageStatus status={msg.status} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setMessageText(''); } }}
                    />
                  </div>
                  <button
                    disabled={!messageText.trim()}
                    className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
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
