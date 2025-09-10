import React, { useMemo, useState, useEffect } from 'react';
import PatientLayout from '../components/PatientLayout';
import ThreadsSidebar from 'components/chat/ThreadsSidebar';
import ChatHeader from 'components/chat/ChatHeader';
import ChatMessageList from 'components/chat/ChatMessageList';
import ChatInput from 'components/chat/ChatInput';

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

      {/* Doctor Info Header */}
      <div className="bg-white border-b">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3`}>
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
          <ThreadsSidebar
            threads={filteredThreads}
            channelFilter={channelFilter}
            onChannelChange={setChannelFilter}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
          />

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
              {/* Chat Header */}
              <ChatHeader activeContact={activeContact} onVideoCall={() => {}} onCall={() => {}} />

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