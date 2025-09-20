import React, { useMemo, useState, useEffect } from 'react';
import PatientLayout from '../components/PatientLayout';
import ThreadsSidebar from 'components/chat/ThreadsSidebar';
import ChatHeader from 'components/chat/ChatHeader';
import ChatMessageList from 'components/chat/ChatMessageList';
import ChatInput from 'components/chat/ChatInput';

const DoctorChatPage = () => {
  const [message, setMessage] = useState('');
  const [channelFilter, setChannelFilter] = useState('Tümü');
  const [mobileChatOpen, setMobileChatOpen] = useState(false); // mobile: list -> chat
  // Thread list (mock)
  const threads = useMemo(() => ([
    { id: 'zeynep', name: 'Zeynep Kaya', channel: 'WhatsApp', online: true, last: 'Cuma günü benim için daha uygun olur...', when: '15 dk', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA ≤5 dk', 'Acil'] },
    { id: 'ali', name: 'Ali Şen', channel: 'Facebook', online: false, last: 'Rica ederim, sağlıklı günler...', when: '2 saat', avatar: '/images/portrait-candid-male-doctor_720.jpg', tags: ['SLA >15 dk', 'Ön Değerlendirme'] },
    { id: 'selin', name: 'Selin Acar', channel: 'Web Form', online: true, last: 'Evet, görüntüledim. Yarın görüşebiliriz.', when: '1 gün', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA ≤15 dk', 'Ön Değerlendirme'] },
    { id: 'ayse', name: 'Ayşe Demir', channel: 'Chat', online: false, last: 'Elbette, size uygun saat nedir?', when: '2 gün', avatar: '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg', tags: ['SLA ≤5 dk', 'Randevu'] },
    { id: 'mehmet', name: 'Mehmet Özkan', channel: 'WhatsApp', online: false, last: 'Size yardımcı olmak için arayabilirim.', when: '3 gün', avatar: '/images/portrait-candid-male-doctor_720.jpg', tags: ['SLA >15 dk', 'Bilgi'] },
  ]), []);

  // Per-thread sample messages
  const getInitialMessages = (id) => {
    if (id === 'zeynep') {
      return [
        { id: 1, sender: 'patient', text: 'Hello! How can I help you? You can share your questions about your health condition.', time: '10:30' },
        { id: 2, sender: 'doctor', text: 'Hello doctor. I have been feeling chest pain for the last few days. It increases especially when I take a deep breath. Is this normal?', time: '10:32' },
        { id: 3, sender: 'patient', text: 'These symptoms can have various causes. Could you provide more details?\n\n• When did the pain start?\n• Is it constant or intermittent?\n• Do you have any other symptoms?', time: '10:35' },
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
    return threads.filter(t => (channelFilter === 'Tümü' ? true : t.channel === channelFilter));
  }, [threads, channelFilter]);

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

  return (
    <PatientLayout>

      {/* Doctor Info Header */}
      <div className="bg-white border-b">
        <div className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2`}>
          <div className="flex items-center">
                         <div className="w-14 h-14 rounded-full mr-4 overflow-hidden bg-gray-100">
               <img 
                 src="/images/portrait-candid-male-doctor_720.jpg" 
                 alt="Dr. Mehmet Özkan" 
                 className="w-full h-full object-cover"
                 style={{ objectPosition: 'center 20%' }}
               />
             </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dr. Mehmet Özkan</h1>
              <div className="flex items-center text-sm text-gray-600">
                <span>Cardiologist</span>
                <span className="mx-2">•</span>
                <span>Anadolu Health Center</span>
                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-3`}>
        {/* Mobile: Threads list or Chat view */}
        <div className="lg:hidden">
          {!mobileChatOpen ? (
            <div>
              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">Kanal</label>
                <select
                  value={channelFilter}
                  onChange={(e)=>setChannelFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {['Tümü','WhatsApp','Facebook','Web Form','Chat'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white border rounded-lg overflow-hidden divide-y">
                {filteredThreads.map((t)=> (
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
                          <span className="inline-flex items-center gap-1 rounded-full border bg-gray-100 border-gray-200 h-5 px-2 text-[11px]">{t.channel}</span>
                          {t.tags?.slice(0,2).map(tag => (
                            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-13rem)] flex flex-col">
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
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-6 gap-3">
          {/* Threads Sidebar */}
          <ThreadsSidebar
            threads={filteredThreads}
            channelFilter={channelFilter}
            onChannelChange={setChannelFilter}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
          />

          {/* Chat Area (expanded) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
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
      
    </PatientLayout>
  );
}
;

export default DoctorChatPage;