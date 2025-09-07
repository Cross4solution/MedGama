import React, { useMemo, useState, useEffect } from 'react';
import PatientLayout from '../components/PatientLayout';

const DoctorChatPage = () => {
  const [message, setMessage] = useState('');
  const [channelFilter, setChannelFilter] = useState('Tümü');
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
  };

  return (
    <PatientLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3`}>
          <nav className="flex text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">Home</a>
            <span className="mx-2">›</span>
            <a href="#" className="hover:text-gray-700">Clinics</a>
            <span className="mx-2">›</span>
            <a href="#" className="hover:text-gray-700">Anadolu Health Center</a>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Message</span>
          </nav>
        </div>
      </div>

      {/* Doctor Info Header */}
      <div className="bg-white border-b">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4`}>
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

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Threads Sidebar */}
          <aside className="hidden lg:block w-full lg:col-span-2 bg-white border rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Mesajlar</h2>
                  <p className="text-sm text-gray-500">Hasta mesajlarını yönetin</p>
                </div>
                <button className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <span className="text-base leading-none">＋</span>
                  Yeni Mesaj
                </button>
              </div>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                <input type="text" placeholder="Mesajlarda ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {['Tümü','WhatsApp','Facebook','Web Form','Chat'].map((t)=> (
                  <button
                    key={t}
                    onClick={()=>setChannelFilter(t)}
                    className={`px-2 py-1 border rounded-lg text-xs ${channelFilter===t ? 'bg-blue-50 border-blue-300 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[520px] divide-y">
              {filteredThreads.map((t) => (
                <div key={t.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${activeThreadId===t.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`} onClick={()=>handleSelectThread(t.id)}>
                  <div className="flex items-start gap-3">
                    <div className="relative w-8 h-8 rounded-full mr-4 overflow-hidden bg-gray-100">
                      <img src={t.avatar} alt="avatar" className="w-full h-full object-cover" loading="lazy" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${t.online ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate text-sm lg:text-base">{t.name}</h4>
                        <span className="text-xs text-gray-500">{t.when}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 rounded-full border bg-gray-100 border-gray-200 h-6 px-2 text-xs">{t.channel}</span>
                        {t.tags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">{tag}</span>
                        ))}
                      </div>
                      <p className="text-xs lg:text-sm text-gray-600 truncate">{t.last}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full mr-3 overflow-hidden bg-gray-100">
                    <img 
                      src={activeContact?.avatar || '/images/portrait-candid-male-doctor_720.jpg'} 
                      alt={activeContact?.name || 'Contact'} 
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center 20%' }}
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{activeContact?.name || 'Contact'}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {activeContact?.channel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white text-gray-700">
                          {activeContact.channel}
                        </span>
                      )}
                      <span>{activeContact?.online ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Video Call (primary) */}
                  <button
                    aria-label="Start video call"
                    className="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
                  </button>
                  {/* Phone (secondary) */}
                  <button
                    aria-label="Call"
                    className="rounded-full w-9 h-9 flex items-center justify-center border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.89.37 1.76.73 2.57a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.51-1.25a2 2 0 0 1 2.11-.45c.81.36 1.68.61 2.57.73A2 2 0 0 1 22 16.92z"/></svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start max-w-xs lg:max-w-md ${msg.sender === 'doctor' ? 'flex-row-reverse' : ''}`}>
                      {msg.sender === 'patient' && (
                        <div className="w-10 h-10 rounded-full mr-2 flex-shrink-0 overflow-hidden bg-gray-100">
                          <img 
                            src={activeContact?.avatar || '/images/portrait-candid-male-doctor_720.jpg'} 
                            alt={activeContact?.name || 'Contact'} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            style={{ objectPosition: 'center 20%' }}
                          />
                        </div>
                      )}
                      {msg.sender === 'doctor' && (
                        <div className="w-10 h-10 rounded-full ml-2 flex-shrink-0 overflow-hidden bg-gray-100">
                          <img
                            src="/images/portrait-candid-male-doctor_720.jpg"
                            alt="You"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            style={{ objectPosition: 'center 20%' }}
                          />
                        </div>
                      )}
                      <div className={`rounded-lg px-4 py-2 ${
                        msg.sender === 'doctor' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <p className={`text-[11px] mt-1 flex items-center gap-2 ${
                          msg.sender === 'doctor' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{msg.time}</span>
                          {msg.sender === 'patient' && (
                            <span className="inline-flex items-center gap-1">
                              {msg.status === 'sent' && <span title="Sent">✓</span>}
                              {msg.status === 'delivered' && <span title="Delivered">✓✓</span>}
                              {msg.status === 'read' && <span title="Read" className="text-teal-500">✓✓</span>}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="flex items-center space-x-2">
                  <button aria-label="Attach file" className="text-gray-600 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05 12 20.5a6 6 0 0 1-8.49-8.49l10-10a4 4 0 0 1 5.66 5.66L7.05 20.79"/></svg>
                  </button>
                  <button aria-label="Insert image" className="text-gray-600 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5a2 2 0 0 0-3 0L9 17"/></svg>
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 text-white p-2 rounded-xl border border-blue-700/20 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                    aria-label="Send message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9 22 2z"/></svg>
                  </button>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 mt-3">
                  <button className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Request Appointment
                  </button>
                  <button className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V7L14 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><path d="M14 2v6h6"/></svg>
                    Share File
                  </button>
                  <button className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
                    Video Call
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Doctor Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-100">
                  <img
                    src="/images/portrait-candid-male-doctor_720.jpg"
                    alt="Dr. Mehmet Özkan"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 20%' }}
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Dr. Mehmet Özkan</h3>
                <p className="text-gray-600 text-sm">Cardiologist</p>
                <div className="flex items-center justify-center mt-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">(4.9)</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500">🏥</span>
                  <span className="ml-2">15 years experience</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500">🏢</span>
                  <span className="ml-2">Anadolu Health Center</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500">🗣️</span>
                  <span className="ml-2">Turkish, English</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-2 rounded-xl mt-6 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
                View Profile
              </button>
            </div>

            {/* File Share */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Share Files</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-4xl mb-2">⬆️</div>
                <p className="text-sm text-gray-600">
                  Upload your X-ray, test results, or other files
                </p>
                <button className="text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-sm mt-3 hover:bg-blue-100">
                  Choose File
                </button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quick Info</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Consultation Fee:</span>
                  <span className="font-medium">₺300</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">~2 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Working Hours:</span>
                  <span className="font-medium">09:00-18:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default DoctorChatPage; 