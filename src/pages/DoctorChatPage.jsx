import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import ThreadsSidebar from 'components/chat/ThreadsSidebar';
import ChatHeader from 'components/chat/ChatHeader';
import ChatMessageList from 'components/chat/ChatMessageList';
import ChatInput from 'components/chat/ChatInput';
import { messageAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ── Helpers ──

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Convert API conversation to thread format used by ThreadsSidebar.
 */
function convToThread(conv, currentUserId) {
  const other = conv.participants?.find(p => p.id !== currentUserId);
  const name = conv.type === 'group'
    ? (conv.title || conv.participants?.map(p => p.fullname).join(', ') || 'Group')
    : (other?.fullname || 'Unknown');
  const avatar = other?.avatar || '/images/default/default-avatar.svg';
  const last = conv.latest_message?.body || '';
  const when = timeAgo(conv.latest_message?.created_at || conv.updated_at);
  const tags = [];
  if (conv.unread_count > 0) tags.push(`${conv.unread_count} new`);

  return {
    id: conv.id,
    name,
    channel: 'Chat',
    online: false,
    last,
    when,
    avatar,
    tags,
    _raw: conv,
  };
}

/**
 * Convert API message to the format used by ChatMessage component.
 */
function apiMsgToLocal(msg, currentUserId) {
  return {
    id: msg.id,
    sender: msg.sender_id === currentUserId ? 'doctor' : 'patient',
    text: msg.body || '',
    time: formatTime(msg.created_at),
    status: 'sent',
    attachments: msg.attachments || [],
    _raw: msg,
  };
}

// ── Mock data (fallback when not authenticated or no conversations) ──

const MOCK_THREADS = [
  { id: 'zeynep', name: 'Zeynep Kaya', channel: 'WhatsApp', online: true, last: 'Friday would be more convenient for me...', when: '15min', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA >5min', 'Urgent'] },
  { id: 'ali', name: 'Ali Yılmaz', channel: 'Facebook', online: false, last: 'Youre welcome, have a good day', when: '2 hours', avatar: '/images/default/default-avatar.svg', tags: ['SLA >15min', 'Preliminary Evaluation'] },
  { id: 'selin', name: 'Selin Acar', channel: 'Web Form', online: true, last: 'Yes, I did. We can see each other tomorrow.', when: '1 day', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA >5min', 'Preliminary Evaluation'] },
  { id: 'ayse', name: 'Ayşe Demir', channel: 'Chat', online: false, last: 'Of course, what time suits you?', when: '2 day', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA >5min', 'Date'] },
  { id: 'mehmet', name: 'Mehmet Özkan', channel: 'WhatsApp', online: false, last: 'I can call to help you.', when: '3 day', avatar: '/images/default/default-avatar.svg', tags: ['SLA >15min', 'Information'] },
];

function getMockMessages(id) {
  if (id === 'zeynep') {
    return [
      { id: 1, sender: 'patient', text: 'Hello! How can I help you? You can share your questions about your health condition.', time: '10:30' },
      { id: 2, sender: 'doctor', text: 'Hello doctor. I have been feeling chest pain for the last few days. It increases especially when I take a deep breath. Is this normal?', time: '10:32' },
      { id: 3, sender: 'patient', text: 'These symptoms can have various causes. Could you provide more details?\n\n When did the pain start?\n Is it constant or intermittent?\n Do you have any other symptoms?', time: '10:35' },
    ];
  }
  return [
    { id: 1, sender: 'patient', text: `Hello, I am ${id}. I have a question.`, time: '10:10' },
    { id: 2, sender: 'doctor', text: 'Sure, please share details.', time: '10:12' },
  ];
}

// ── Component ──

const DoctorChatPage = () => {
  const { user, hydrated } = useAuth();
  const [message, setMessage] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
  const threadsPerPage = 8;

  // API state
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isApiMode, setIsApiMode] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const pollRef = useRef(null);

  const currentUserId = user?.id || null;
  const hasStoredToken = useMemo(() => {
    try {
      const fromState = JSON.parse(localStorage.getItem('auth_state') || '{}')?.token;
      return !!(fromState || localStorage.getItem('access_token') || localStorage.getItem('google_access_token'));
    } catch {
      return false;
    }
  }, []);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    // Wait until auth hydration settles to avoid brief mock UI flash
    if (!hydrated) return;
    if (!currentUserId) {
      // If we likely have a signed-in session, wait for user resolution instead of showing mock data
      if (hasStoredToken) return;
      // Guest mode fallback
      setThreads(MOCK_THREADS);
      setIsApiMode(false);
      setLoadingConvs(false);
      return;
    }

    try {
      const res = await messageAPI.conversations({ per_page: 50 });
      const data = res?.data || [];
      const apiThreads = Array.isArray(data) ? data.map(c => convToThread(c, currentUserId)) : [];
      setThreads(apiThreads);
      setIsApiMode(true);

      // If no active thread or active thread not in list, select first if present
      if (apiThreads.length > 0) {
        if (!activeThreadId || !apiThreads.find(t => t.id === activeThreadId)) {
          setActiveThreadId(apiThreads[0].id);
        }
      } else {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch {
      // API failed for authenticated user: keep clean empty state instead of flashing mock design
      setThreads([]);
      setIsApiMode(true);
      setActiveThreadId(null);
      setMessages([]);
    }
    setLoadingConvs(false);
  }, [hydrated, currentUserId, hasStoredToken, activeThreadId]);

  useEffect(() => {
    if (!hydrated) return;
    fetchConversations();
  }, [hydrated, fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId) => {
    if (!convId || !isApiMode) return;
    setLoadingMsgs(true);
    try {
      const res = await messageAPI.messages(convId, { per_page: 100 });
      const data = res?.data || [];
      const mapped = data.map(m => apiMsgToLocal(m, currentUserId));
      setMessages(mapped);
      // Mark as read
      messageAPI.markRead(convId).catch(() => {});
    } catch {
      setMessages([]);
    }
    setLoadingMsgs(false);
  }, [isApiMode, currentUserId]);

  // When active thread changes, fetch messages
  useEffect(() => {
    if (isApiMode && activeThreadId) {
      fetchMessages(activeThreadId);
    } else if (!isApiMode && activeThreadId) {
      setMessages(getMockMessages(activeThreadId));
    }
  }, [activeThreadId, isApiMode, fetchMessages]);

  // Polling: refresh conversations and messages every 10s
  useEffect(() => {
    if (!isApiMode) return;
    pollRef.current = setInterval(() => {
      fetchConversations();
      if (activeThreadId) {
        fetchMessages(activeThreadId);
      }
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [isApiMode, activeThreadId, fetchConversations, fetchMessages]);

  const activeContact = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  // Apply channel filter to thread list
  const filteredThreads = useMemo(() => {
    return threads.filter(t => (channelFilter === 'All' ? true : t.channel === channelFilter));
  }, [threads, channelFilter]);

  // Mobile pagination logic
  const mobileTotalPages = Math.ceil(filteredThreads.length / threadsPerPage);
  const mobileStartIndex = (mobileCurrentPage - 1) * threadsPerPage;
  const mobileEndIndex = mobileStartIndex + threadsPerPage;
  const mobilePaginatedThreads = filteredThreads.slice(mobileStartIndex, mobileEndIndex);

  const handleMobilePageChange = (page) => {
    setMobileCurrentPage(page);
  };

  const handleSendMessage = async (attachments) => {
    const text = message.trim();
    const hasFiles = attachments && attachments.length > 0;
    if (!text && !hasFiles) return;
    if (sending) return;

    if (isApiMode && activeThreadId) {
      // Optimistic: add message to UI immediately
      const optimistic = {
        id: 'opt-' + Date.now(),
        sender: 'doctor',
        text: text || (hasFiles ? `📎 ${attachments.length} file${attachments.length > 1 ? 's' : ''}` : ''),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'sending',
        attachments: [],
      };
      setMessages(prev => [...prev, optimistic]);
      setMessage('');
      setSending(true);

      try {
        const res = await messageAPI.sendMessage(activeThreadId, {
          body: text || undefined,
          attachments: hasFiles ? attachments : undefined,
        });
        // Replace optimistic with real message
        const real = apiMsgToLocal(res.message, currentUserId);
        setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m));
      } catch {
        // Mark as failed
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
      }
      setSending(false);
    } else {
      // Mock mode
      const newMessage = {
        id: messages.length + 1,
        sender: 'doctor',
        text: text || (hasFiles ? `📎 ${attachments.length} file${attachments.length > 1 ? 's' : ''}` : ''),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        attachments: [],
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  const handleSelectThread = (id) => {
    // Mobile: always open chat view
    setMobileChatOpen(true);
    if (id === activeThreadId) return;
    setActiveThreadId(id);
    if (!isApiMode) {
      setMessages(getMockMessages(id));
    }
  };

  const handleChannelChange = (value) => {
    setChannelFilter(value);
    setMobileCurrentPage(1);
  };

  // Get current user info for header
  const currentUserInfo = useMemo(() => {
    try {
      const saved = localStorage.getItem('auth_state');
      if (saved) {
        const { user } = JSON.parse(saved);
        return user;
      }
    } catch {}
    return null;
  }, []);

  const headerName = currentUserInfo?.fullname || 'Dr. Mehmet Özkan';
  const headerAvatar = currentUserInfo?.avatar || '/images/default/default-avatar.svg';

  if (loadingConvs) {
    return (
      <div className="h-[calc(100vh-5rem)] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-400 font-medium">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] w-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Doctor Info Header */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={headerAvatar}
                  alt={headerName}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-md"
                  style={{ objectPosition: 'center 20%' }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">{headerName}</h1>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mt-0.5">
                  <span>Messages</span>
                  {isApiMode && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-teal-600">{threads.length} conversations</span>
                    </>
                  )}
                  <span className="ml-1 inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border border-emerald-100/80">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          <div className="max-w-7xl mx-auto px-0 sm:px-3 lg:px-4 py-0 sm:py-2 h-full overflow-hidden min-h-0 flex flex-col">
        {/* Mobile: Threads list or Chat view */}
        <div className="lg:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
          {!mobileChatOpen ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-shrink-0 px-3 pt-2 pb-1">
                <label className="block text-xs text-gray-500 mb-1">Channel</label>
                <select
                  value={channelFilter}
                  onChange={(e)=>handleChannelChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {['All','WhatsApp','Facebook','Web Form','Chat'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-2">
                <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 overflow-hidden">
                  {mobilePaginatedThreads.map((t, idx)=> (
                    <button
                      key={t.id}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50/60 transition-colors ${idx > 0 ? 'border-t border-gray-100' : ''} ${activeThreadId === t.id ? 'bg-teal-50/40' : ''}`}
                      onClick={()=>handleSelectThread(t.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm" loading="lazy" />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${t.online ? 'bg-emerald-500' : 'bg-gray-300'} rounded-full border-2 border-white`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-[13px] font-semibold text-gray-900 truncate">{t.name}</h4>
                            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0 ml-2">{t.when}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            {t.tags?.slice(0,2).map(tag => {
                              const isUrgent = tag.toLowerCase().includes('urgent');
                              return (
                                <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${isUrgent ? 'bg-rose-50 text-rose-600 border border-rose-200/80' : 'bg-gray-100/80 text-gray-500 border border-gray-200/60'}`}>{tag}</span>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 truncate leading-relaxed">{t.last}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              
                {/* Mobile Pagination */}
                {mobileTotalPages > 1 && (
                  <div className="mt-3 pb-2 flex justify-center">
                    <div className="flex items-center space-x-1">
                      <button
                        disabled={mobileCurrentPage === 1}
                        onClick={() => handleMobilePageChange(mobileCurrentPage - 1)}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ‹
                      </button>
                      {Array.from({ length: mobileTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handleMobilePageChange(page)}
                          className={`px-3 py-2 text-sm rounded ${
                            page === mobileCurrentPage 
                              ? 'bg-teal-600 text-white' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        disabled={mobileCurrentPage === mobileTotalPages}
                        onClick={() => handleMobilePageChange(mobileCurrentPage + 1)}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-gray-200/60 sm:shadow-lg sm:shadow-gray-200/30">
              {activeThreadId && activeContact ? (
                <>
                  <ChatHeader activeContact={activeContact} onVideoCall={()=>{}} onCall={()=>{}} onBack={()=>setMobileChatOpen(false)} />
                  <ChatMessageList
                    messages={messages}
                    leftAvatar={activeContact?.avatar || '/images/default/default-avatar.svg'}
                    rightAvatar={headerAvatar}
                  />
                  <ChatInput message={message} onChange={setMessage} onSend={handleSendMessage} sending={sending} />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <button onClick={()=>setMobileChatOpen(false)} className="absolute top-3 left-3 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">No conversations yet</h3>
                  <p className="text-xs text-gray-400 max-w-xs">When patients send you a message, their conversations will appear here.</p>
                </div>
              )}
            </div>
          )}
        </div>
            {/* Desktop layout */}
            <div className="hidden lg:flex gap-2 flex-1 overflow-hidden h-full min-h-0">
              {/* Threads Sidebar */}
              <div className="w-80 flex-shrink-0 h-full flex flex-col min-h-0">
                <ThreadsSidebar
                  threads={filteredThreads}
                  channelFilter={channelFilter}
                  onChannelChange={setChannelFilter}
                  activeThreadId={activeThreadId}
                  onSelectThread={handleSelectThread}
                  threadsPerPage={5}
                />
              </div>

              {/* Chat Area (expanded) */}
              <div className="flex-1 min-h-0">
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/30 border border-gray-200/60 h-full flex flex-col min-h-0">
                  {activeThreadId && activeContact ? (
                    <>
                      {/* Chat Header */}
                      <ChatHeader activeContact={activeContact} onVideoCall={() => {}} onCall={() => {}} onBack={() => {}} />

                      {/* Messages */}
                      <ChatMessageList
                        messages={messages}
                        leftAvatar={activeContact?.avatar || '/images/default/default-avatar.svg'}
                        rightAvatar={headerAvatar}
                      />

                      {/* Message Input */}
                      <ChatInput message={message} onChange={setMessage} onSend={handleSendMessage} sending={sending} />
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">No conversations yet</h3>
                      <p className="text-xs text-gray-400 max-w-xs">When patients send you a message, their conversations will appear here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar removed as requested */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorChatPage;
