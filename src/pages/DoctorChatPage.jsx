import React, { useMemo, useState, useEffect } from 'react';
import ThreadsSidebar from 'components/chat/ThreadsSidebar';
import ChatHeader from 'components/chat/ChatHeader';
import ChatMessageList from 'components/chat/ChatMessageList';
import ChatInput from 'components/chat/ChatInput';

const DoctorChatPage = () => {
  const [message, setMessage] = useState('');
  const [channelFilter, setChannelFilter] = useState('TÃ¼mÃ¼');
  const [mobileChatOpen, setMobileChatOpen] = useState(false); // mobile: list -> chat
  const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
  const threadsPerPage = 8;
  // Thread list (mock) - daha fazla thread pagination test iÃ§in
  const threads = useMemo(() => {
    const baseThreads = [
      { id: 'zeynep', name: 'Zeynep Kaya', channel: 'WhatsApp', online: true, last: 'Friday would be more convenient for me...', when: '15min', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA >5min', 'Urgent'] },
      { id: 'ali', name: 'Ali Yılmaz', channel: 'Facebook', online: false, last: 'Youre welcome, have a good day', when: '2 hours', avatar: '/images/portrait-candid-male-doctor_720.jpg', tags: ['SLA >15min', 'Preliminary Evaluation'] },
      { id: 'selin', name: 'Selin Acar', channel: 'Web Form', online: true, last: 'Yes, I did. We can see each other tomorrow.', when: '1 day', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA >5min', 'Preliminary Evaluation'] },
      { id: 'ayse', name: 'Ayşe Demir', channel: 'Chat', online: false, last: 'Of course, what time suits you?', when: '2 day', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA >5min', 'Date'] },
      { id: 'mehmet', name: 'Mehmet Özkan', channel: 'WhatsApp', online: false, last: 'I can call to help you.', when: '3 day', avatar: '/images/portrait-candid-male-doctor_720.jpg', tags: ['SLA >15min', 'Information'] },
    ];

    // Daha fazla thread ekle (pagination test iÃ§in)
    const additionalThreads = [];
    const names = ['Ahmet Yılmaz', 'Fatma Kaya', 'Mustafa Demir', 'Elif Özkan', 'Can Şahin', 'Zeynep Arslan', 'Burak Aletik', 'Seda Yıldız', 'Emre Korkmaz', 'Gülay Aydın', 'Hakan Yormaz', 'Pınar Yaşar', 'Serkan DoÄŸan', 'Merve Koç', 'Tolga At', 'Deniz Soluk', 'Cem Demir', 'Sibel Kaya', 'Oğuz Demir', 'Nur Rızkan'];
    const channels = ['WhatsApp', 'Facebook', 'Web Form', 'Chat', 'Instagram'];
    const lastMessages = [
      'Hello, how are you?',
      'Id like to make an appointment',
      'Are my results ready?',
      'Thank you',
      'Are you available tomorrow?',
      'There is an emergency',
      'I want to get information',
      'follow-up appointment',
      'Prescription renewal',
      'I want to ask a question'
    ];
    const tags = [
      ['SLA >15min', 'Urgent'],
      ['SLA >15min', 'Preliminary Evaluation'],
      ['SLA >15min', 'Date'],
      ['SLA >15min', 'Information'],
      ['SLA >15min', 'Control']
    ];

    for (let i = 0; i < 20; i++) {
      additionalThreads.push({
        id: `thread_${i}`,
        name: names[i],
        channel: channels[i % channels.length],
        online: Math.random() > 0.5,
        last: lastMessages[i % lastMessages.length],
        when: `${i + 1} gÃ¼n`,
        avatar: i % 2 === 0 ? '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg' : '/images/portrait-candid-male-doctor_720.jpg',
        tags: tags[i % tags.length]
      });
    }

    return [...baseThreads, ...additionalThreads];
  }, []);

  // Per-thread sample messages
  const getInitialMessages = (id) => {
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
  };

  const [activeThreadId, setActiveThreadId] = useState('zeynep');
  const [messages, setMessages] = useState(getInitialMessages('zeynep'));
  const activeContact = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  // Apply channel filter to thread list
  const filteredThreads = useMemo(() => {
    return threads.filter(t => (channelFilter === 'TÃ¼mÃ¼' ? true : t.channel === channelFilter));
  }, [threads, channelFilter]);

  // Mobile pagination logic
  const mobileTotalPages = Math.ceil(filteredThreads.length / threadsPerPage);
  const mobileStartIndex = (mobileCurrentPage - 1) * threadsPerPage;
  const mobileEndIndex = mobileStartIndex + threadsPerPage;
  const mobilePaginatedThreads = filteredThreads.slice(mobileStartIndex, mobileEndIndex);

  const handleMobilePageChange = (page) => {
    setMobileCurrentPage(page);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'patient',
        text: message,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleSelectThread = (id) => {
    if (id === activeThreadId) return;
    setActiveThreadId(id);
    setMessages(getInitialMessages(id));
    // Mobile: open chat view
    setMobileChatOpen(true);
  };

  const handleChannelChange = (value) => {
    setChannelFilter(value);
    setMobileCurrentPage(1); // Reset pagination when filter changes
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-gray-50 overflow-hidden mt-3">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Doctor Info Header */}
        <div className="bg-white border-b flex-shrink-0">
          <div className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-1`}>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full mr-3 overflow-hidden bg-gray-100">
                <img 
                  src="/images/portrait-candid-male-doctor_720.jpg" 
                  alt="Dr. Mehmet Ã–zkan" 
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 20%' }}
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Dr. Mehmet Ã–zkan</h1>
                <div className="flex items-center text-[13px] text-gray-600">
                  <span>Cardiologist</span>
                  <span className="mx-2">$</span>
                  <span>Anadolu Health Center</span>
                  <span className="ml-2 bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-[11px]">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          <div className={`max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-2 h-full overflow-hidden min-h-0`}>
        {/* Mobile: Threads list or Chat view */}
        <div className="lg:hidden h-full overflow-hidden flex flex-col min-h-0">
          {!mobileChatOpen ? (
            <div>
              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">Kanal</label>
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
              <div className="bg-white border rounded-lg overflow-hidden divide-y">
                {mobilePaginatedThreads.map((t)=> (
                  <button
                    key={t.id}
                    className="w-full text-left p-3 hover:bg-gray-50"
                    onClick={()=>handleSelectThread(t.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-100">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${t.online ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white`}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">{t.name}</h4>
                          <span className="text-[11px] text-gray-500">{t.when}</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{t.last}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {t.tags?.slice(0,2).map(tag => (
                            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Mobile Pagination */}
              {mobileTotalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={mobileCurrentPage === 1}
                      onClick={() => handleMobilePageChange(mobileCurrentPage - 1)}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      â€¹
                    </button>
                    {Array.from({ length: mobileTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handleMobilePageChange(page)}
                        className={`px-3 py-2 text-sm rounded ${
                          page === mobileCurrentPage 
                            ? 'bg-blue-600 text-white' 
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
                      â€º
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border flex-1 flex flex-col overflow-hidden min-h-0">
              <ChatHeader activeContact={activeContact} onVideoCall={()=>{}} onCall={()=>{}} onBack={()=>setMobileChatOpen(false)} />
              <ChatMessageList
                messages={messages}
                leftAvatar={activeContact?.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                rightAvatar={'/images/portrait-candid-male-doctor_720.jpg'}
              />
              <ChatInput message={message} onChange={setMessage} onSend={handleSendMessage} />
            </div>
          )}
        </div>
            {/* Desktop layout */}
            <div className="hidden lg:flex gap-2 flex-1 overflow-hidden h-full min-h-0 mt-2">
              {/* Threads Sidebar */}
              <div className="w-80 flex-shrink-0">
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
                <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col min-h-0">
                  {/* Chat Header */}
                  <ChatHeader activeContact={activeContact} onVideoCall={() => {}} onCall={() => {}} onBack={() => {}} />

                  {/* Messages */}
                  <ChatMessageList
                    messages={messages}
                    leftAvatar={activeContact?.avatar || '/images/portrait-candid-male-doctor_720.jpg'}
                    rightAvatar={'/images/portrait-candid-male-doctor_720.jpg'}
                  />

                  {/* Message Input */}
                  <ChatInput message={message} onChange={setMessage} onSend={handleSendMessage} />
                </div>
              </div>

              {/* Right sidebar removed as requested */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
;

export default DoctorChatPage;
